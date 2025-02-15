#!/bin/bash

# HELPER FUNCTIONS
confirm_action() {
    while true; do
        read -p "Do you want to $1? (y/n): " choice
        case "$choice" in 
            y|Y ) return 0;;
            n|N ) return 1;;
            * ) echo "Invalid input. Please enter 'y' or 'n'.";;
        esac
    done
}

wait_for_key_press() {
    read -n 1 -s -r -p "Press any key to restart..."
    echo # To move to a new line after the key press
}

# SETUP
echo "Updating V-Link"

# Step 1: Remove the existing V-Link configuration and files
echo "Removing old files..."
rm -rf ~/.config/v-link
rm -rf ~/v-link/frontend/
rm -rf ~/v-link/backend
rm -f ~/v-link/V-Link.zip
rm -f ~/v-link/V-Link.py

# Step 2: Download the latest V-Link.zip from the latest release on GitHub

# Fetch the latest release info from GitHub (no external package needed)
echo "Fetching the latest release URL from GitHub..."
LATEST_RELEASE_URL=$(curl -s https://api.github.com/repos/LRYMND/v-link/releases/latest | grep "browser_download_url" | grep "V-Link.zip" | cut -d '"' -f 4)

if [ -z "$LATEST_RELEASE_URL" ]; then
    echo "Error: Could not find the latest V-Link.zip release."
    exit 1
fi

# Download the latest release
echo "Downloading latest V-Link.zip from GitHub..."
curl -L "$LATEST_RELEASE_URL" -o ~/v-link/V-Link.zip

# Step 3: Unzip the downloaded file
echo "Unzipping the latest V-Link.zip..."
unzip -o ~/v-link/V-Link.zip -d ~/v-link/

# Wait for user to press any key before restarting
wait_for_key_press

# Restart the system
echo "System will restart now..."
sudo reboot
