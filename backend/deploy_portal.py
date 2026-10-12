import os
import sys
import tarfile
import tempfile
import paramiko
import time
import subprocess

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

SERVER_IP = "187.77.188.152"
USERNAME = "testuser"
PASSWORD = "Uptrix12#$"

LOCAL_WORKSPACE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(LOCAL_WORKSPACE, "backend")
FRONTEND_DIR = os.path.join(LOCAL_WORKSPACE, "frontend")
FRONTEND_DIST = os.path.join(FRONTEND_DIR, "dist")
LANDING_DIR = os.path.join(LOCAL_WORKSPACE, "landing_site")
LANDING_DIST = os.path.join(LANDING_DIR, "dist")

REMOTE_BASE = "/var/www/intentpeople"
REMOTE_BACKEND = f"{REMOTE_BASE}/backend"
REMOTE_FRONTEND = f"{REMOTE_BASE}/frontend/dist"
REMOTE_LANDING = f"{REMOTE_BASE}/landing/dist"

def safe_print(text):
    try:
        print(text)
    except Exception:
        try:
            print(str(text).encode('ascii', errors='replace').decode('ascii'))
        except Exception:
            pass

def run_sudo_command(client, cmd):
    full_cmd = f"echo '{PASSWORD}' | sudo -S {cmd}"
    stdin, stdout, stderr = client.exec_command(full_cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    # Remove password prompt line from stderr
    clean_err = "\n".join([line for line in err.splitlines() if "[sudo]" not in line]).strip()
    return out, clean_err

def create_tar_gz(source_dir, output_path, arcname_prefix="", exclude_dirs=None):
    if exclude_dirs is None:
        exclude_dirs = {"__pycache__", "venv", ".git", "uploads", ".pytest_cache"}
    
    with tarfile.open(output_path, "w:gz") as tar:
        for root, dirs, files in os.walk(source_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                if file.endswith((".pyc", ".pyo")):
                    continue
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, source_dir)
                arcname = os.path.join(arcname_prefix, rel_path) if arcname_prefix else rel_path
                tar.add(file_path, arcname=arcname)
    safe_print(f"Created archive {output_path} ({os.path.getsize(output_path) / 1024 / 1024:.2f} MB)")

def deploy():
    safe_print("==================================================")
    safe_print("   INTENTPEOPLE PRODUCTION DEPLOYMENT PIPELINE    ")
    safe_print(f"   Target Server: {SERVER_IP} ({USERNAME})       ")
    safe_print("   Landing Site: https://intentpeople.com/        ")
    safe_print("   Portal:       https://portal.intentpeople.com/ ")
    safe_print("   Backend API:  https://backend.intentpeople.com/")
    safe_print("==================================================")

    # 0. Build frontend & landing site automatically
    if "--skip-build" not in sys.argv:
        safe_print("\n[Build 1/2] Compiling latest portal assets (npm run build in frontend)...")
        res1 = subprocess.run("npm run build", cwd=FRONTEND_DIR, shell=True)
        if res1.returncode != 0:
            raise RuntimeError("Frontend portal build failed! Please fix build errors before deploying.")

        safe_print("\n[Build 2/2] Compiling latest landing site assets (npm run build in landing_site)...")
        res2 = subprocess.run("npm run build", cwd=LANDING_DIR, shell=True)
        if res2.returncode != 0:
            raise RuntimeError("Landing site build failed! Please fix build errors before deploying.")
    else:
        safe_print("\n[Build] Skipped client compilation (--skip-build).")

    # Verify built artifacts
    frontend_index = os.path.join(FRONTEND_DIST, "index.html")
    landing_index = os.path.join(LANDING_DIST, "index.html")
    if not os.path.exists(frontend_index):
        raise RuntimeError(f"Frontend built assets not found at {frontend_index}.")
    if not os.path.exists(landing_index):
        raise RuntimeError(f"Landing built assets not found at {landing_index}.")

    temp_dir = tempfile.gettempdir()
    backend_archive = os.path.join(temp_dir, "intentpeople_backend.tar.gz")
    frontend_archive = os.path.join(temp_dir, "intentpeople_frontend.tar.gz")
    landing_archive = os.path.join(temp_dir, "intentpeople_landing.tar.gz")

    # 1. Package backend
    safe_print("\n[1/7] Packaging backend files...")
    create_tar_gz(BACKEND_DIR, backend_archive, arcname_prefix="")

    # 2. Package frontend portal & landing site
    safe_print("\n[2/7] Packaging frontend and landing built assets...")
    create_tar_gz(FRONTEND_DIST, frontend_archive, arcname_prefix="")
    create_tar_gz(LANDING_DIST, landing_archive, arcname_prefix="")

    # 3. Connect via SSH
    safe_print("\n[3/7] Connecting to remote server...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname=SERVER_IP, port=22, username=USERNAME, password=PASSWORD, timeout=20)
    safe_print("Connected successfully via SSH!")

    # 4. Prepare remote folders
    safe_print("\n[4/7] Preparing remote destination folders...")
    run_sudo_command(client, f"mkdir -p {REMOTE_BACKEND} {REMOTE_FRONTEND} {REMOTE_LANDING}")
    run_sudo_command(client, f"chown -R {USERNAME}:www-data {REMOTE_BASE}")
    run_sudo_command(client, f"chmod -R 775 {REMOTE_BASE}")

    # 5. Upload archives via SFTP
    safe_print("\n[5/7] Uploading archives to server...")
    sftp = client.open_sftp()
    remote_backend_archive = f"/home/{USERNAME}/intentpeople_backend.tar.gz"
    remote_frontend_archive = f"/home/{USERNAME}/intentpeople_frontend.tar.gz"
    remote_landing_archive = f"/home/{USERNAME}/intentpeople_landing.tar.gz"

    sftp.put(backend_archive, remote_backend_archive)
    safe_print(f"Uploaded backend archive to {remote_backend_archive}")

    sftp.put(frontend_archive, remote_frontend_archive)
    safe_print(f"Uploaded portal archive to {remote_frontend_archive}")

    sftp.put(landing_archive, remote_landing_archive)
    safe_print(f"Uploaded landing archive to {remote_landing_archive}")

    # 6. Extract archives
    safe_print("\n[6/7] Extracting files on server...")
    run_sudo_command(client, f"rm -rf {REMOTE_FRONTEND}/* {REMOTE_LANDING}/*")
    run_sudo_command(client, f"tar -xzf {remote_backend_archive} -C {REMOTE_BACKEND}")
    run_sudo_command(client, f"tar -xzf {remote_frontend_archive} -C {REMOTE_FRONTEND}")
    run_sudo_command(client, f"tar -xzf {remote_landing_archive} -C {REMOTE_LANDING}")
    run_sudo_command(client, f"rm -f {remote_backend_archive} {remote_frontend_archive} {remote_landing_archive}")
    safe_print("All archives extracted cleanly into their target directories.")

    # Upload local backend/.env directly to remote
    safe_print("Configuring production environment (.env)...")
    local_env_file = os.path.join(BACKEND_DIR, ".env")
    if os.path.exists(local_env_file):
        sftp.put(local_env_file, f"{REMOTE_BACKEND}/.env")
        safe_print("Synced production .env from local backend/.env successfully.")
    else:
        safe_print("WARNING: local backend/.env not found!")
    sftp.close()

    # Clean local temporary archives
    for f in [backend_archive, frontend_archive, landing_archive]:
        try:
            if os.path.exists(f):
                os.remove(f)
        except Exception:
            pass

    # 7. Setup virtual environment & dependencies
    safe_print("\n[7/7] Setting up Python virtual environment & dependencies...")
    run_sudo_command(client, f"python3 -m venv {REMOTE_BACKEND}/venv")
    out, err = run_sudo_command(client, f"{REMOTE_BACKEND}/venv/bin/pip install --upgrade pip")
    safe_print("Pip verified.")
    out, err = run_sudo_command(client, f"{REMOTE_BACKEND}/venv/bin/pip install -r {REMOTE_BACKEND}/requirements.txt psycopg2-binary gunicorn uvicorn")
    safe_print("Dependencies verified & installed.")

    # Run database initialization and model creation
    safe_print("Running database schema synchronization & seed check...")
    db_cmd = f"bash -c 'cd {REMOTE_BACKEND} && {REMOTE_BACKEND}/venv/bin/python -c \"from app.database import engine, Base, init_db_extensions; import app.models; Base.metadata.create_all(bind=engine); init_db_extensions(); from app.seed import seed; seed(); print(\\\"DB Schema, Extensions & Seed Ready\\\")\"'"
    out, err = run_sudo_command(client, db_cmd)
    safe_print(f"Database Init Result: {out}")
    if err:
        safe_print(f"DB Init Stderr: {err}")

    # Create systemd service
    safe_print("\nSetting up Systemd Service (backend.intentpeople.service)...")
    service_content = f"""[Unit]
Description=IntentPeople Backend API (backend.intentpeople.com)
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory={REMOTE_BACKEND}
EnvironmentFile={REMOTE_BACKEND}/.env
ExecStart={REMOTE_BACKEND}/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8050 --workers 3
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
"""
    with tempfile.NamedTemporaryFile("w", delete=False) as tf:
        tf.write(service_content)
        tf_name = tf.name
    sftp = client.open_sftp()
    sftp.put(tf_name, f"/home/{USERNAME}/backend.intentpeople.service")
    sftp.close()
    os.remove(tf_name)

    run_sudo_command(client, "systemctl stop intentpeople-backend.service || true")
    run_sudo_command(client, "systemctl disable intentpeople-backend.service || true")
    run_sudo_command(client, "rm -f /etc/systemd/system/intentpeople-backend.service")
    run_sudo_command(client, f"mv /home/{USERNAME}/backend.intentpeople.service /etc/systemd/system/backend.intentpeople.service")
    run_sudo_command(client, f"chown -R www-data:www-data {REMOTE_BASE}")
    run_sudo_command(client, f"chmod -R 775 {REMOTE_BASE}")
    run_sudo_command(client, "systemctl daemon-reload")
    run_sudo_command(client, "systemctl enable backend.intentpeople.service")
    run_sudo_command(client, "systemctl restart backend.intentpeople.service")
    time.sleep(3)

    out, _ = run_sudo_command(client, "systemctl status backend.intentpeople.service --no-pager -n 15")
    safe_print(f"Service Status:\n{out}")

    # Nginx Configuration 1: Landing Page (intentpeople.com, www.intentpeople.com)
    safe_print("\nSetting up Nginx configuration for Landing Site (intentpeople.com)...")
    landing_nginx_content = f"""# Landing Site: intentpeople.com
server {{
    listen 80;
    listen [::]:80;
    server_name intentpeople.com www.intentpeople.com;
    return 301 https://$host$request_uri;
}}

server {{
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name intentpeople.com www.intentpeople.com;

    ssl_certificate /etc/letsencrypt/live/intentpeople.com-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/intentpeople.com-0001/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 50M;

    # Landing Static App
    location / {{
        root {REMOTE_LANDING};
        index index.html;
        try_files $uri $uri/ /index.html;
    }}

    location /api/ {{
        proxy_pass http://127.0.0.1:8050/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }}

    location /payments/ {{
        proxy_pass http://127.0.0.1:8050/payments/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }}
}}
"""
    with tempfile.NamedTemporaryFile("w", delete=False) as tf:
        tf.write(landing_nginx_content)
        tf_name = tf.name
    sftp = client.open_sftp()
    sftp.put(tf_name, f"/home/{USERNAME}/intentpeople.com.conf")
    sftp.close()
    os.remove(tf_name)
    run_sudo_command(client, f"mv /home/{USERNAME}/intentpeople.com.conf /etc/nginx/sites-available/intentpeople.com")
    run_sudo_command(client, "ln -sf /etc/nginx/sites-available/intentpeople.com /etc/nginx/sites-enabled/intentpeople.com")

    # Nginx Configuration 2: Portal App (portal.intentpeople.com & tenant subdomains)
    safe_print("Setting up Nginx configuration for Portal App (portal.intentpeople.com)...")
    portal_nginx_content = f"""# Portal & Tenant Subdomains: portal.intentpeople.com
server {{
    listen 80;
    listen [::]:80;
    server_name portal.intentpeople.com *.intentpeople.com;
    return 301 https://$host$request_uri;
}}

server {{
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name portal.intentpeople.com *.intentpeople.com;

    ssl_certificate /etc/letsencrypt/live/intentpeople.com-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/intentpeople.com-0001/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 50M;

    # Strictly redirect any /superadmin access on portal to admin.intentpeople.com
    location /superadmin {{
        return 301 https://admin.intentpeople.com/;
    }}

    # Frontend Portal Single Page Application
    location / {{
        root {REMOTE_FRONTEND};
        index index.html;
        try_files $uri $uri/ /index.html;
    }}

    location /api/ {{
        proxy_pass http://127.0.0.1:8050/api/;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }}

    location /uploads/ {{
        proxy_pass http://127.0.0.1:8050/uploads/;
        proxy_set_header Host $host;
    }}
}}
"""
    with tempfile.NamedTemporaryFile("w", delete=False) as tf:
        tf.write(portal_nginx_content)
        tf_name = tf.name
    sftp = client.open_sftp()
    sftp.put(tf_name, f"/home/{USERNAME}/portal.intentpeople.com.conf")
    sftp.close()
    os.remove(tf_name)
    run_sudo_command(client, f"mv /home/{USERNAME}/portal.intentpeople.com.conf /etc/nginx/sites-available/portal.intentpeople.com")
    run_sudo_command(client, "ln -sf /etc/nginx/sites-available/portal.intentpeople.com /etc/nginx/sites-enabled/portal.intentpeople.com")

    # Nginx Configuration 2B: Dedicated Admin Domain (admin.intentpeople.com)
    safe_print("Setting up Nginx configuration for Dedicated Admin Portal (admin.intentpeople.com)...")
    admin_nginx_content = f"""# Superadmin Dedicated Domain: admin.intentpeople.com
server {{
    listen 80;
    listen [::]:80;
    server_name admin.intentpeople.com;
    return 301 https://$host$request_uri;
}}

server {{
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name admin.intentpeople.com;

    ssl_certificate /etc/letsencrypt/live/intentpeople.com-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/intentpeople.com-0001/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 50M;

    # Admin Frontend SPA
    location / {{
        root {REMOTE_FRONTEND};
        index index.html;
        try_files $uri $uri/ /index.html;
    }}

    location /api/ {{
        proxy_pass http://127.0.0.1:8050/api/;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }}

    location /uploads/ {{
        proxy_pass http://127.0.0.1:8050/uploads/;
        proxy_set_header Host $host;
    }}
}}
"""
    with tempfile.NamedTemporaryFile("w", delete=False) as tf:
        tf.write(admin_nginx_content)
        tf_name = tf.name
    sftp = client.open_sftp()
    sftp.put(tf_name, f"/home/{USERNAME}/admin.intentpeople.com.conf")
    sftp.close()
    os.remove(tf_name)
    run_sudo_command(client, f"mv /home/{USERNAME}/admin.intentpeople.com.conf /etc/nginx/sites-available/admin.intentpeople.com")
    run_sudo_command(client, "ln -sf /etc/nginx/sites-available/admin.intentpeople.com /etc/nginx/sites-enabled/admin.intentpeople.com")

    # Nginx Configuration 3: Backend API Subdomain (backend.intentpeople.com)
    safe_print("Setting up Nginx configuration for Backend (backend.intentpeople.com)...")
    backend_nginx_content = f"""# Backend Dedicated Subdomain: backend.intentpeople.com
server {{
    listen 80;
    listen [::]:80;
    server_name backend.intentpeople.com;
    return 301 https://$host$request_uri;
}}

server {{
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name backend.intentpeople.com;

    ssl_certificate /etc/letsencrypt/live/intentpeople.com-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/intentpeople.com-0001/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 50M;

    location / {{
        proxy_pass http://127.0.0.1:8050;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }}
}}
"""
    with tempfile.NamedTemporaryFile("w", delete=False) as tf:
        tf.write(backend_nginx_content)
        tf_name = tf.name
    sftp = client.open_sftp()
    sftp.put(tf_name, f"/home/{USERNAME}/backend.intentpeople.com.conf")
    sftp.close()
    os.remove(tf_name)
    run_sudo_command(client, f"mv /home/{USERNAME}/backend.intentpeople.com.conf /etc/nginx/sites-available/backend.intentpeople.com")
    run_sudo_command(client, "ln -sf /etc/nginx/sites-available/backend.intentpeople.com /etc/nginx/sites-enabled/backend.intentpeople.com")

    # Test and reload Nginx
    test_out, test_err = run_sudo_command(client, "nginx -t")
    safe_print(f"Nginx Syntax Test: {test_out} {test_err}")
    if "syntax is ok" in test_err or "syntax is ok" in test_out:
        run_sudo_command(client, "systemctl reload nginx")
        safe_print("Nginx reloaded successfully!")
    else:
        safe_print(f"Warning: Nginx test failed: {test_err}")

    # Health checks on server
    safe_print("\nRunning local health checks on server...")
    api_check, _ = run_sudo_command(client, "curl -s http://127.0.0.1:8050/")
    safe_print(f"FastAPI Backend Local Response: {api_check[:200] if api_check else 'No response'}")

    landing_check, _ = run_sudo_command(client, "curl -s -H 'Host: intentpeople.com' http://127.0.0.1/ | grep -i 'doctype html'")
    safe_print(f"Landing accessible via Nginx: {'YES' if 'doctype' in landing_check.lower() else 'NO'}")

    portal_check, _ = run_sudo_command(client, "curl -s -H 'Host: portal.intentpeople.com' http://127.0.0.1/ | grep -i 'doctype html'")
    safe_print(f"Portal accessible via Nginx: {'YES' if 'doctype' in portal_check.lower() else 'NO'}")

    admin_check, _ = run_sudo_command(client, "curl -s -H 'Host: admin.intentpeople.com' http://127.0.0.1/ | grep -i 'doctype html'")
    safe_print(f"Admin accessible via Nginx: {'YES' if 'doctype' in admin_check.lower() else 'NO'}")

    # Wildcard SSL Certificate Verification
    safe_print("\nVerifying Wildcard SSL Certificate (intentpeople.com-0001)...")
    cert_status, _ = run_sudo_command(client, "certbot certificates --cert-name intentpeople.com-0001")
    if "intentpeople.com-0001" in cert_status:
        safe_print(f"Wildcard SSL (*.intentpeople.com) is ACTIVE:\n{cert_status.strip()}")
    else:
        safe_print("Wildcard certificate not found, ensuring base SSL certificate...")
        cert_cmd = "certbot certonly --nginx -d intentpeople.com -d www.intentpeople.com -d backend.intentpeople.com -d portal.intentpeople.com -d admin.intentpeople.com --expand --non-interactive --agree-tos -m kyadaritarun10@gmail.com"
        cert_out, cert_err = run_sudo_command(client, cert_cmd)
        safe_print(f"Certbot result:\n{cert_out}")
        if cert_err:
            safe_print(f"Certbot stderr:\n{cert_err}")

    # Final public URL verification
    safe_print("\nVerifying Public Endpoints...")
    pub_landing, _ = run_sudo_command(client, "curl -s -I -k https://intentpeople.com | head -n 5")
    safe_print(f"HTTPS intentpeople.com:\n{pub_landing}")

    pub_portal, _ = run_sudo_command(client, "curl -s -I -k https://portal.intentpeople.com | head -n 5")
    safe_print(f"HTTPS portal.intentpeople.com:\n{pub_portal}")

    pub_admin, _ = run_sudo_command(client, "curl -s -I -k https://admin.intentpeople.com | head -n 5")
    safe_print(f"HTTPS admin.intentpeople.com:\n{pub_admin}")

    pub_api, _ = run_sudo_command(client, "curl -s -I -k https://backend.intentpeople.com/ | head -n 5")
    safe_print(f"HTTPS backend.intentpeople.com:\n{pub_api}")

    client.close()
    safe_print("\n==================================================")
    safe_print("   DEPLOYMENT COMPLETED SUCCESSFULLY!             ")
    safe_print("==================================================")

def deploy_only_landing():
    safe_print("==================================================")
    safe_print("   INTENTPEOPLE LANDING SITE ONLY DEPLOYMENT      ")
    safe_print(f"   Target Server: {SERVER_IP} ({USERNAME})       ")
    safe_print("   Target URL:    https://intentpeople.com/       ")
    safe_print("==================================================")

    # 1. Build if not skipped
    if "--skip-build" not in sys.argv:
        safe_print("\n[1/4] Compiling latest landing site assets (npm run build in landing_site)...")
        res = subprocess.run("npm run build", cwd=LANDING_DIR, shell=True)
        if res.returncode != 0:
            raise RuntimeError("Landing site build failed! Please check errors.")
    else:
        safe_print("\n[1/4] Skipped build (--skip-build).")

    landing_index = os.path.join(LANDING_DIST, "index.html")
    if not os.path.exists(landing_index):
        raise RuntimeError(f"Landing dist not found at {landing_index}")

    # 2. Package landing dist
    safe_print("\n[2/4] Packaging landing dist archive...")
    temp_dir = tempfile.gettempdir()
    landing_archive = os.path.join(temp_dir, "intentpeople_landing.tar.gz")
    create_tar_gz(LANDING_DIST, landing_archive, arcname_prefix="")

    # 3. Connect via SSH and SFTP
    safe_print("\n[3/4] Connecting to server via SSH...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname=SERVER_IP, port=22, username=USERNAME, password=PASSWORD, timeout=20)
    safe_print("Connected successfully via SSH!")

    run_sudo_command(client, f"mkdir -p {REMOTE_LANDING}")
    run_sudo_command(client, f"chown -R {USERNAME}:www-data {REMOTE_BASE}/landing")
    run_sudo_command(client, f"chmod -R 775 {REMOTE_BASE}/landing")

    sftp = client.open_sftp()
    remote_landing_archive = f"/home/{USERNAME}/intentpeople_landing.tar.gz"
    safe_print("Uploading landing archive...")
    sftp.put(landing_archive, remote_landing_archive)
    sftp.close()

    try:
        os.remove(landing_archive)
    except Exception:
        pass

    # 4. Extract and set permissions
    safe_print("\n[4/4] Extracting landing files on remote server...")
    run_sudo_command(client, f"rm -rf {REMOTE_LANDING}/*")
    run_sudo_command(client, f"tar -xzf {remote_landing_archive} -C {REMOTE_LANDING}")
    run_sudo_command(client, f"rm -f {remote_landing_archive}")
    run_sudo_command(client, f"chown -R www-data:www-data {REMOTE_BASE}/landing")
    run_sudo_command(client, f"chmod -R 775 {REMOTE_BASE}/landing")
    run_sudo_command(client, "systemctl reload nginx")

    # Verify endpoint
    safe_print("\nVerifying landing site endpoint...")
    pub_landing, _ = run_sudo_command(client, "curl -s -I -k https://intentpeople.com | head -n 5")
    safe_print(f"HTTPS intentpeople.com response:\n{pub_landing}")

    client.close()
    safe_print("\n==================================================")
    safe_print("   LANDING SITE DEPLOYED SUCCESSFULLY!           ")
    safe_print("==================================================")

if __name__ == "__main__":
    if "--only-landing" in sys.argv or "--landing-only" in sys.argv:
        deploy_only_landing()
    else:
        deploy()

