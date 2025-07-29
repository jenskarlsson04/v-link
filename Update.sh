#!/bin/sh

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

mkdir -p "$HOME/v-link/logs"

wait_for_key_press() {
    printf "Press any key..."
    dd bs=1 count=1 < /dev/tty > /dev/null 2>&1
    echo
}


echo "Starting V-Link Update at $(date)"

# Run terminal with RTI keep alive message
lxterminal --title="RTI Keep Alive" --command="sh -c '
while true; do
  echo \"Sending RTI keep-alive: 0x40 0x20 0x83\"
  python3 -c \"
import serial, time
try:
    with serial.Serial(\\\"/dev/ttyAMA2\\\", 2400, timeout=1) as ser:
        ser.write(bytes([0x40, 0x20, 0x83]))
        time.sleep(0.1)
except Exception as e:
    print(\\\"Error:\\\", e)
\"
  sleep 1
done
'"


echo "Removing old V-Link files..."
rm -rf "$HOME/v-link/frontend" "$HOME/v-link/backend" "$HOME/v-link/V-Link.zip" "$HOME/v-link/V-Link.py" "$HOME/v-link/requirements.txt" "$HOME/v-link/Patch.sh"

echo "Fetching latest release URL from GitHub..."
LATEST_RELEASE_URL=$(curl -s https://api.github.com/repos/BoostedMoose/v-link/releases/latest | grep "browser_download_url" | grep "V-Link.zip" | cut -d '"' -f 4)

[ -z "$LATEST_RELEASE_URL" ] && {
  echo "Could not find the latest V-Link.zip release."
  exit 1
}

echo "Downloading latest V-Link.zip..."
if ! curl -L "$LATEST_RELEASE_URL" -o "$HOME/v-link/V-Link.zip"; then
  echo "Failed to download V-Link.zip"
  exit 1
fi

echo "Unzipping V-Link.zip..."
if ! unzip -o "$HOME/v-link/V-Link.zip" -d "$HOME/v-link/"; then
  echo "Failed to unzip the archive"
  exit 1
fi

if [ -f "$HOME/v-link/Patch.sh" ]; then
    echo "Patch detected. Launching patch in new terminal..."
    lxterminal --title="V-Link Patcher" --command="sh -c 'sh $HOME/v-link/Patch.sh; exec bash'"
    #setsid lxterminal --command "sh -c 'sleep 2; sh \"$HOME/v-link/Patch.sh\"; exec bash'"
    echo "Updater exiting..."
    exit 0
else
    echo "No patch found. Rebooting now."
    sleep 1
    sudo reboot
fi
