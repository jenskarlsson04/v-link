#logger = logger(verbose=True)

#logger.debug("This is a debug message")       # Shown only if verbose=True
#logger.info("This is an info message")        # Shown only if verbose=True
#logger.warning("This is a warning message")   # Shown only if verbose=True
#logger.error("This is an error message")      # Shown only if verbose=True
#logger.critical("This is a critical message") # Always shown, even if verbose=False



import logging
from logging.handlers import RotatingFileHandler
import os

LOG_DIR = os.path.expanduser("~/v-link/logs")
LOG_FILE = os.path.join(LOG_DIR, "logfile.txt")

def logger(verbose=False):
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

    return logger
