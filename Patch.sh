#!/bin/sh
echo "Patching system for v3.0.2"

CONFIG_DIR="$HOME/.config/v-link"
UDEV_RULES_FILE="/etc/udev/rules.d/99-vlink.rules"

# Step 1: Remove old config files
if [ -d "$CONFIG_DIR" ]; then
    echo "Removing old config directory: $CONFIG_DIR"
    rm -rf "$CONFIG_DIR"
else
    echo "No existing config directory found at $CONFIG_DIR. Nothing to remove."
fi

# Step 2: Remove old systemd service
echo "Stopping and removing old v-link.service..."
sudo systemctl stop v-link.service 2>/dev/null || true
sudo systemctl disable v-link.service 2>/dev/null || true
sudo rm -f /etc/systemd/system/v-link.service

# Step 3: Create new CAN interface files
echo "Creating CAN interface files."
echo "Please make sure you enter the bitrates you are going to use in the config files (~/.config/v-link)"

printf "Enter bitrate for can1 (e.g., 125000): "
read CAN1_BITRATE
printf "Enter bitrate for can2 (e.g., 500000): "
read CAN2_BITRATE

# Fallback to defaults if empty
CAN1_BITRATE=${CAN1_BITRATE:-125000}
CAN2_BITRATE=${CAN2_BITRATE:-500000}

echo "Using bitrate $CAN1_BITRATE for can1"
echo "Using bitrate $CAN2_BITRATE for can2"

sudo tee /etc/systemd/network/can1.network > /dev/null <<EOF
[Match]
Name=can1

[CAN]
BitRate=$CAN1_BITRATE

[Network]
# raw CAN
EOF

sudo tee /etc/systemd/network/can2.network > /dev/null <<EOF
[Match]
Name=can2

[CAN]
BitRate=$CAN2_BITRATE

[Network]
# raw CAN
EOF

sudo systemctl enable systemd-networkd

# Step 4: Create uinput module load config
echo "Creating uinput module config..."
echo "uinput" | sudo tee /etc/modules-load.d/uinput.conf > /dev/null

# Step 5: Update udev rules
echo "Updating udev rules..."
sudo tee "$UDEV_RULES_FILE" > /dev/null <<EOF
SUBSYSTEM=="usb", ATTR{idVendor}=="1314", ATTR{idProduct}=="152*", MODE="0660", GROUP="plugdev"

SUBSYSTEM=="net", ACTION=="add", KERNELS=="spi0.1", NAME="can1"
SUBSYSTEM=="net", ACTION=="add", KERNELS=="spi0.2", NAME="can2"

KERNEL=="ttyS0", MODE="0660", GROUP="plugdev"
KERNEL=="uinput", MODE="0660", GROUP="plugdev"
EOF

echo "Patch completed. Rebooting now."
sleep 1

sudo reboot