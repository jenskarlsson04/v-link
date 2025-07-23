#!/bin/bash
echo "Starting Patch.sh at $(date)"

CONFIG_DIR="$HOME/.config/v-link"

if [ -d "$CONFIG_DIR" ]; then
    echo "Removing old config directory: $CONFIG_DIR"
    rm -rf "$CONFIG_DIR"
else
    echo "No existing config directory found at $CONFIG_DIR. Nothing to remove."
fi

echo "Patch completed at $(date)"
exit 0