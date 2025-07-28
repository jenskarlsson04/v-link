#logger = logger(verbose=True)

#logger.debug("This is a debug message")       # Shown only if verbose=True
#logger.info("This is an info message")        # Shown only if verbose=True
#logger.warning("This is a warning message")   # Shown only if verbose=True
#logger.error("This is an error message")      # Shown only if verbose=True
#logger.critical("This is a critical message") # Always shown, even if verbose=False



import logging
from logging.handlers import RotatingFileHandler
import os

import subprocess
import datetime

LOG_DIR = os.path.expanduser("~/v-link/logs")
LOG_FILE = os.path.join(LOG_DIR, "logfile.txt")

BOOT_LOG = os.path.join(LOG_DIR, "bootlog.txt")
BOOT_LOG_OLD = os.path.join(LOG_DIR, "bootlog.prev.txt")

def collect_boot_diagnostics():
    timestamp = datetime.datetime.now().isoformat()
    lines = [f"=== Boot Diagnostics Log: {timestamp} ===\n"]

    # Rotate previous bootlog
    if os.path.exists(BOOT_LOG):
        os.replace(BOOT_LOG, BOOT_LOG_OLD)

    commands = {
        "Uptime": "uptime",
        "Kernel Version": "uname -a",
        "GPIO Summary": "gpioinfo",
        "Network Interfaces": "ip link show",
        "MCP Driver": "dmesg | grep -i mcp25*",
        "I2C Devices": "i2cdetect -l",
        "SPI Devices": "ls /dev/spidev*",
        "SPI / I2C": "dmesg | grep -Ei 'spi|i2c|probe|error'",
        "Systemd Boot Warnings/Errors": "journalctl -b -p 3..4",  # priority 3 = err, 4 = warning
        "Recent Kernel Messages": "journalctl -k -n 100",
    }

    for title, cmd in commands.items():
        lines.append(f"\n--- {title} ---")
        lines.append(exec(cmd))

    with open(BOOT_LOG, "w") as f:
        f.write("\n".join(lines))

def exec(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, text=True).strip()
    except subprocess.CalledProcessError as e:
        return f"[ERROR] Command '{cmd}' failed: {e}"


def logger(verbose=True):
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR)

    logger = logging.getLogger("vlink")
    logger.setLevel(logging.DEBUG if verbose else logging.CRITICAL)
    logger.propagate = False

    if not logger.handlers:
        file_handler = RotatingFileHandler(LOG_FILE, maxBytes=512 * 1024, backupCount=3)
        # Set file handler level according to verbose mode
        file_handler.setLevel(logging.DEBUG if verbose else logging.CRITICAL)
        file_format = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(file_format)
        logger.addHandler(file_handler)

        if verbose:
            console_handler = logging.StreamHandler()
            console_handler.setLevel(logging.DEBUG)
            console_format = logging.Formatter('%(levelname)s - %(message)s')
            console_handler.setFormatter(console_format)
            logger.addHandler(console_handler)

        # Only collect diagnostics when logger is initialized fresh
        collect_boot_diagnostics()

    return logger
