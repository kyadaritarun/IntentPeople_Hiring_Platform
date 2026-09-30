import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname='187.77.188.152', port=22, username='testuser', password='Uptrix12#$', timeout=20)

def run(cmd):
    stdin, stdout, stderr = client.exec_command(f"echo 'Uptrix12#$' | sudo -S bash -c '{cmd}'")
    return stdout.read().decode('utf-8', errors='replace').strip()

print("--- SITES-ENABLED ---")
print(run("ls -la /etc/nginx/sites-enabled/"))

print("\n--- TEST CURL BACKEND LOCALLY ON SERVER ---")
print("Curl 127.0.0.1:8050:")
print(run("curl -s http://127.0.0.1:8050/"))

print("\nCurl backend.intentpeople.com:")
print(run("curl -s -k https://backend.intentpeople.com/ | head -n 15"))

print("\nCurl intentpeople.com:")
print(run("curl -s -k https://intentpeople.com/ | head -n 15"))

client.close()
