#!/bin/bash
# filepath: ~/cleanup.sh

# Clean APT cache and unused packages
sudo apt-get clean
sudo apt-get autoremove --purge -y

# Vacuum systemd journal logs (keep 3 days)
sudo journalctl --vacuum-time=3d

# Remove old log files
sudo rm -rf /var/log/*.gz /var/log/*.[0-9] /var/log/*.1

# Truncate large logs
sudo truncate -s 0 /var/log/syslog /var/log/auth.log 2>/dev/null

# Clean /tmp directory
sudo rm -rf /tmp/*

# Remove old Snap revisions
snap list --all | awk '/disabled/{print $1, $3}' | while read snapname revision; do sudo snap remove "$snapname" --revision="$revision"; done

# Truncate PM2 logs
sudo truncate -s 0 /root/.pm2/*.log /root/.pm2/logs/*.log /home/cs104/.pm2/logs/*.log 2>/dev/null