# Scripts

This folder contains scripts used inside the production server, versioned for reference.

## cleanup.sh

This script is used to perform routine cleanup and maintenance tasks on the production server.  
It helps free up disk space, remove unnecessary files, and keep the system logs manageable.

### What It Does

- **Cleans APT cache and removes unused packages:**  
  Frees up space by cleaning the package manager cache and purging packages that are no longer needed.

- **Vacuums systemd journal logs:**  
  Retains only the last 3 days of systemd logs to prevent log files from consuming excessive disk space.

- **Removes old log files:**  
  Deletes compressed and rotated log files from `/var/log` to further reclaim space.

- **Truncates large log files:**  
  Empties the contents of `syslog` and `auth.log` without deleting the files.

- **Cleans the `/tmp` directory:**  
  Removes all files and folders in `/tmp` to clear temporary data.

- **Removes old Snap revisions:**  
  Deletes disabled Snap package revisions to save disk space.

- **Truncates PM2 logs:**  
  Empties PM2 log files for both root and the user.

### Usage

> **Warning:**  
> This script performs destructive actions (deleting files, truncating logs).  
> Review and modify it as needed before running on your system.

1. Make the script executable:
   ```bash
   chmod +x cleanup.sh
   ```

2. Run the script with appropriate permissions:
   ```bash
   sudo ./cleanup.sh
   ```
  
**Note:** This script is scheduled with `cron` for regular automated maintenance.
