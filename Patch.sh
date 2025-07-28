#!/bin/bash
echo "Starting Patch.sh at $(date)"

#The 3.0.2 patch will improve the initialization and naming of the can interfaces.

# Step 1: Remove old config files
CONFIG_DIR="$HOME/.config/v-link"

if [ -d "$CONFIG_DIR" ]; then
    echo "Removing old config directory: $CONFIG_DIR"
    rm -rf "$CONFIG_DIR"
else
    echo "No existing config directory found at $CONFIG_DIR. Nothing to remove."
fi


# Step 2: Remove old systemd service
echo "Stopping and removing old v-link.service..."
sudo systemctl stop v-link.service
sudo systemctl disable v-link.service
sudo rm -f /etc/systemd/system/v-link.service


# Step 2: Create new CAN interface files
echo "Creating CAN interface files."
echo "Please make sure you enter the bitrates you are going to use in the config files (~/.config/v-link)"

# Prompt user for bitrate input
read -p "Enter bitrate for can1 (e.g., 125000): " CAN1_BITRATE
read -p "Enter bitrate for can2 (e.g., 500000): " CAN2_BITRATE

# Fallback to defaults if input is empty
CAN1_BITRATE=${CAN1_BITRATE:-125000}
CAN2_BITRATE=${CAN2_BITRATE:-500000}

echo "Using bitrate $CAN1_BITRATE for can1"
echo "Using bitrate $CAN2_BITRATE for can2"

# Create the can1.network file
sudo tee /etc/systemd/network/can1.network > /dev/null <<EOF
[Match]
Name=can1

[CAN]
BitRate=$CAN1_BITRATE

[Network]
# raw CAN
EOF

# Create the can2.network file
sudo tee /etc/systemd/network/can2.network > /dev/null <<EOF
[Match]
Name=can2

[CAN]
BitRate=$CAN2_BITRATE

[Network]
# raw CAN
EOF

sudo systemctl enable systemd-networkd


# Step 3: Create uinput module load config
echo "Creating uinput module config..."
echo "uinput" | sudo tee /etc/modules-load.d/uinput.conf > /dev/null


# Step 4: Update udev rules
echo "Updating udev rules..."
sudo tee "$UDEV_RULES_FILE" > /dev/null <<EOF
SUBSYSTEM=="usb", ATTR{idVendor}=="1314", ATTR{idProduct}=="152*", MODE="0660", GROUP="plugdev"

SUBSYSTEM=="net", ACTION=="add", KERNELS=="spi0.1", NAME="can1"
SUBSYSTEM=="net", ACTION=="add", KERNELS=="spi0.2", NAME="can2"

KERNEL=="ttyS0", MODE="0660", GROUP="plugdev"
KERNEL=="uinput", MODE="0660", GROUP="plugdev"
EOF

echo "Patch completed at $(date)"
exit 0