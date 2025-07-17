#!/bin/bash

# V-Link Installer - https://www.github.com/lrymnd/v-link

# CHECK PERMISSION
if [ $EUID -ne 0 ]; then
  echo "This script must be run as root to install certain services. Please use sudo. More information can be found in the source of this installer." >&2
  exit 1
fi

if [ -z "$SUDO_USER" ]; then
    # Fallback: Get the current user
    CURRENT_USER=$(whoami)
else
    CURRENT_USER=$SUDO_USER
fi

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

fix_ownership() {
    sudo chown -R "$CURRENT_USER:$CURRENT_USER" "$1"
}

user_exit() {
    echo "Aborted by user. Exiting."
    exit 1
}

setup_complete() {
    echo "Setup complete. Drive carefully :)"
}

# SETUP
echo "Installing V-Link"

# Determine Raspberry Pi Version
if [ -f /proc/device-tree/model ]; then
    # Read the content of the model file, stripping any null bytes with `strings`
    model=$(strings /proc/device-tree/model)

    # Loop through the Raspberry Pi models we want to detect
    rpiModel=""
    for i in 3 4 5; do
        if [[ "$model" == *"Raspberry Pi $i"* ]]; then
            echo "Raspberry Pi $i detected."
            rpiModel=$i
            break
        fi
    done

    # Default to Raspberry Pi 4 if no match found and rpiModel is unset
    if [ -z "$rpiModel" ]; then
        echo "Device not recognized, using config for Raspberry Pi 4."
        if ! confirm_action "proceed anyways"; then
            user_exit
        else
            rpiModel=4
        fi
    fi
else
    echo "Not running on a Raspberry Pi or file at /proc/device-tree/model not found."
    if ! confirm_action "proceed anyways"; then
        user_exit
    fi
fi

# Step 1: Update System
if confirm_action "update the system (Recommended)"; then
    sudo apt-get update && sudo apt-get upgrade
fi

# Step 2: Check if Python is installed
if ! command -v python &>/dev/null; then
    if confirm_action "install Python"; then
        sudo apt-get install -y python3
    else
        echo "Python is required. Exiting."
        exit 1
    fi
fi

# Step 3: Check if pip is installed
if ! command -v pip &>/dev/null; then
    if confirm_action "install pip"; then
        sudo apt-get install -y python3-pip
    else
        echo "pip is required. Exiting."
        exit 1
    fi
fi









# Fetch the latest release info from GitHub (no external package needed)
echo "Fetching the latest release URL from GitHub..."
LATEST_RELEASE_URL=$(curl -s https://api.github.com/repos/BoostedMoose/v-link/releases/latest | grep "browser_download_url" | grep "V-Link.zip" | cut -d '"' -f 4)

if [ -z "$LATEST_RELEASE_URL" ]; then
    echo "Error: Could not find the latest V-Link.zip release."
    exit 1
fi






# Step 4: Install Volvo V-Link
if confirm_action "install Boosted Moose V-Link now"; then
    # Step 4.1: Install dependencies
    sudo apt-get install -y ffmpeg libudev-dev libusb-dev build-essential python3-venv

    # Step 4.4: Download the file
    download_url=$LATEST_RELEASE_URL
    output_path="/home/$CURRENT_USER/v-link"
    echo "Downloading files to: $output_path"
    sudo mkdir -p "$output_path"
    sudo curl -L "$download_url" --output "$output_path/V-Link.zip"
    fix_ownership "$output_path"

    # Step 4.5: Unzip the contents
    echo "Unzipping the contents..."
    sudo -u "$CURRENT_USER" unzip "$output_path/V-Link.zip" -d "$output_path"

    # Step 4.6: Setup virtual environment
    cd "$output_path"
    if [ -d "venv" ]; then
        echo "Virtual environment already exists."
        source venv/bin/activate
    else
        echo "Creating virtual environment..."
        sudo -u "$CURRENT_USER" python3 -m venv venv
        source venv/bin/activate
    fi

    # Step 4.7: Install requirements
    requirements="$output_path/requirements.txt"
    if [ -f "$requirements" ]; then
        echo "Installing requirements..."
        pip install -r "$requirements"
    else
        echo "Requirements file not found: $requirements"
    fi

    echo -e "\nV-Link installation completed.\n"
    fix_ownership "$output_path"
else
    if confirm_action "do you want to abort the installation"; then
        user_exit
    fi
fi


# Step 5: Download overlay files to /boot/overlays
if confirm_action "install the custom DTOverlays? (Required for V-Link HAT)"; then
    OVERLAY_DIR="/boot/firmware/overlays"

    # Download the overlays to the determined directory
    sudo wget -O "$OVERLAY_DIR/v-link.dtbo" \
        https://github.com/BoostedMoose/v-link/raw/master/resources/dtoverlays/v-link.dtbo
    sudo wget -O "$OVERLAY_DIR/mcp2515-can1.dtbo" \
        https://github.com/BoostedMoose/v-link/raw/master/resources/dtoverlays/mcp2515-can1.dtbo
    sudo wget -O "$OVERLAY_DIR/mcp2515-can2.dtbo" \
        https://github.com/BoostedMoose/v-link/raw/master/resources/dtoverlays/mcp2515-can2.dtbo
fi

# Step 6: Append lines to /boot/config.txt or /boot/firmware/config.txt
if confirm_action "append lines to /boot/firmware/config.txt"; then
    # Renaming pwrkey service so ign logic works:
    echo "Renaming /etc/xdg/autostart/pwrkey.desktop to pwrkey.desktop.backup"
    sudo mv /etc/xdg/autostart/pwrkey.desktop /etc/xdg/autostart/pwrkey.desktop.backup

    CONFIG_PATH="/boot/firmware/config.txt"

    # Determine RPi version and set config.txt accordingly.
    if [[ "$rpiModel" -eq 5 ]]; then
        sudo bash -c 'cat >> /boot/firmware/config.txt <<EOF

[V-LINK RPi5]

#Enable GPIO 0&1
disable_poe_fan=1
force_eeprom_read=0

#Enable devicetree overlays
dtparam=spi=on
dtparam=i2c_arm=on

dtoverlay=v-link
dtparam=uart0=on
dtoverlay=uart2-pi5
dtoverlay=mcp2515-can1,oscillator=16000000,interrupt=24
dtoverlay=mcp2515-can2,oscillator=16000000,interrupt=22

#Configure IGN logic
dtoverlay=gpio-poweroff,gpiopin=0

#No Splash on boot
disable_splash=1
EOF'

    elif [[ "$rpiModel" -eq 4 ]]; then
        sudo bash -c 'cat >> /boot/firmware/config.txt <<EOF

[V-LINK RPi4]

#Enable GPIO 0&1
disable_poe_fan=1
force_eeprom_read=0

#Enable devicetree overlays
dtparam=spi=on
enable_uart=1
dtparam=i2c_arm=on

dtoverlay=v-link
dtoverlay=uart3
dtoverlay=mcp2515-can1,oscillator=16000000,interrupt=24
dtoverlay=mcp2515-can2,oscillator=16000000,interrupt=22

#Configure IGN logic
dtoverlay=gpio-poweroff,gpiopin=0

#No Splash on boot
disable_splash=1
EOF'

    else
        sudo bash -c 'cat >> /boot/firmware/config.txt <<EOF

[V-LINK RPi3]

#Enable GPIO 0&1
disable_poe_fan=1
force_eeprom_read=0

#Enable devicetree overlays
dtparam=spi=on
enable_uart=1
dtparam=i2c_arm=on

dtoverlay=v-link
dtoverlay=uart3
dtoverlay=mcp2515-can1,oscillator=16000000,interrupt=24
dtoverlay=mcp2515-can2,oscillator=16000000,interrupt=22

#Configure IGN logic
dtoverlay=pi3-disable-bt
dtoverlay=gpio-poweroff,gpiopin=0

#No Splash on boot
disable_splash=1
EOF'
    fi
fi

# Step 7: Configure systemd-networkd for CAN interfaces
if confirm_action "configure systemd-networkd for V-Link CAN interfaces"; then
    echo "Creating systemd-networkd configuration files for can1 and can2..."

    # Create can1.netdev
    sudo tee /etc/systemd/network/can1.network > /dev/null <<EOF
[Match]
Name=can1

[CAN]
BitRate=125000

[Network]
# raw CAN
EOF

    # Create can2.netdev
    sudo tee /etc/systemd/network/can2.network > /dev/null <<EOF
[Match]
Name=can2

[CAN]
BitRate=500000

[Network]
# raw CAN
EOF

    # Enable and restart systemd-networkd
    sudo systemctl enable systemd-networkd
    
    echo "Systemd-networkd now manages can1 and can2 automatically at boot."
fi

# Step 8: Load uinput kernel module at boot
if confirm_action "enable uinput kernel module at boot"; then
    echo "Creating /etc/modules-load.d/uinput.conf..."
    echo "uinput" | sudo tee /etc/modules-load.d/uinput.conf > /dev/null

    if [[ $? -eq 0 ]]; then
        echo -e "uinput module will now be auto-loaded at boot.\n"
    else
        echo -e "Failed to create uinput.conf.\n"
    fi
fi

# Step 9: Create V-Link udev rules
if confirm_action "create udev rules for V-Link"; then
    echo "Creating combined udev rule"
    RULE_FILE=/etc/udev/rules.d/42-v-link.rules

    # Write all rules into a single file
    echo 'SUBSYSTEM=="usb", ATTR{idVendor}=="1314", ATTR{idProduct}=="152*", MODE="0660", GROUP="plugdev"' | sudo tee $RULE_FILE

    echo 'SUBSYSTEM=="net", ACTION=="add", KERNELS=="spi0.1", NAME="can1"' | sudo tee $RULE_FILE
    echo 'SUBSYSTEM=="net", ACTION=="add", KERNELS=="spi0.2", NAME="can2"' | sudo tee $RULE_FILE
    
    echo 'KERNEL=="ttyS0", MODE="0660", GROUP="plugdev"' | sudo tee -a $RULE_FILE
    echo 'KERNEL=="uinput", MODE="0660", GROUP="plugdev"' | sudo tee -a $RULE_FILE

    if [[ $? -eq 0 ]]; then
        echo -e "Permissions created\n"
    else
        echo -e "Unable to create permissions\n"
    fi
fi

# Step 10: Create autostart file for V-Link
if confirm_action "create autostart file for V-Link"; then
    output_path="/home/$CURRENT_USER/v-link"

    sudo bash -c "cat > /etc/xdg/autostart/v-link.desktop <<EOL
[Desktop Entry]
Name=V-Link
Exec=sh -c 'python $output_path/V-Link.py'
Type=Application
EOL"
fi

# Step 11: Remove logo and cursor on boot
if confirm_action "boot the raspberry without logo"; then
    FILE="/boot/firmware/cmdline.txt"

    # Text to append
    APPEND_TEXT="logo.nologo vt.global_cursor_default=0"

    # Ensure the file exists
    if [[ ! -f "$FILE" ]]; then
        echo "Error: File $FILE does not exist."
        exit 1
    fi

    sudo sed -i "1{s/$/ $APPEND_TEXT/}" "$FILE"
fi

# Step 12: Prompt to reboot the system
if confirm_action "reboot the system now to apply the changes"; then
    setup_complete
    sudo reboot
else
    echo "Reboot was skipped. Please reboot manually to apply the changes."
    setup_complete
fi