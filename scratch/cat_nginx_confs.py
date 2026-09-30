import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname='187.77.188.152', port=22, username='testuser', password='Uptrix12#$', timeout=20)

def run(cmd):
    stdin, stdout, stderr = client.exec_command(f"echo 'Uptrix12#$' | sudo -S bash -c '{cmd}'")
    return stdout.read().decode('utf-8', errors='replace').strip()

print("=== /etc/nginx/sites-available/backend.intentpeople.com ===")
print(run("cat /etc/nginx/sites-available/backend.intentpeople.com"))

print("\n=== /etc/nginx/sites-available/intentpeople.com ===")
print(run("cat /etc/nginx/sites-available/intentpeople.com"))

client.close()
