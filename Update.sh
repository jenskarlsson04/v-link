#!/bin/bash

# Logging Setup
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOGFILE=~/v-link/update_$TIMESTAMP.log
mkdir -p ~/v-link
exec > >(tee -a "$LOGFILE") 2>&1
echo "==== V-Link Update started at $(date) ===="

# Helper Functions
confirm_action() {
    while true; do
        read -p "Do you want to $1? (y/n): " choice
        case "$choice" in 
            y|Y ) return 0;;
            n|N ) return 1;;
            * ) echo "[WARN] Invalid input. Please enter 'y' or 'n'.";;
        esac
    done
}

wait_for_key_press() {
    read -n 1 -s -r -p "Press any key to restart..."
    echo # To move to a new line after the key press
}

log_error_and_exit() {
    echo "[ERROR] $1"
    echo "==== Update failed at $(date) ===="
    exit 1
}


echo "[INFO] Updating V-Link..."

# Step 1: Remove the existing V-Link directory
echo "[INFO] Removing old V-Link files..."
rm -rf ~/v-link/frontend ~/v-link/backend ~/v-link/V-Link.zip ~/v-link/V-Link.py

# Step 2: Get latest release URL
echo "[INFO] Fetching latest release URL from GitHub..."
LATEST_RELEASE_URL=$(curl -s https://api.github.com/repos/BoostedMoose/v-link/releases/latest | grep "browser_download_url" | grep "V-Link.zip" | cut -d '"' -f 4)

[ -z "$LATEST_RELEASE_URL" ] && log_error_and_exit "Could not find the latest V-Link.zip release."

# Step 3: Download the latest release
echo "[INFO] Downloading latest V-Link.zip..."
if ! curl -L "$LATEST_RELEASE_URL" -o ~/v-link/V-Link.zip; then
    log_error_and_exit "Failed to download V-Link.zip"
fi

# Step 4: Unzip the new release
echo "[INFO] Unzipping V-Link.zip..."
if ! unzip -o ~/v-link/V-Link.zip -d ~/v-link/; then
    log_error_and_exit "Failed to unzip the archive"
fi

# Step 5: Run Patch.sh if present
if [ -f ~/v-link/Patch.sh ]; then
    echo "[INFO] Running Patch.sh..."
    if ! bash ~/v-link/Patch.sh; then
        log_error_and_exit "Patch.sh failed"
    fi
else
    echo "[INFO] No Patch.sh found. Skipping patch step."
fi

# Step 6: Prompt before reboot
wait_for_key_press

# Step 7: Reboot
echo "[INFO] System will restart now..."
echo "==== V-Link Update completed successfully at $(date) ===="
sudo reboot
