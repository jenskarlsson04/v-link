import os
import json
import shutil
import logging

from backend.shared.shared_state import shared_state

logger = logging.getLogger("vlink")

def load_directory():
    # Specify the directory path
    config_directory = os.path.expanduser("~/.config/v-link")

    # Check if the directory exists, if not, create it
    if not os.path.exists(config_directory):
        try:
            os.makedirs(config_directory)
            logger.info(f"Created directory at: '{config_directory}'")
        except Exception as e:
            logger.error(f"Error creating directory: {e}")
            return None

    return config_directory

def load_settings(setting):
    # Call load_directory to ensure the directory exists
    config_directory = load_directory()

    # Specify the file path
    default_settings_file = setting + ".json"
    destination_path = os.path.join(config_directory, default_settings_file)

    # Load or create the settings file
    if not os.path.exists(destination_path):
        try:
            shutil.copyfile(os.path.join(os.path.dirname(__file__), "config", default_settings_file), destination_path)
            logger.info(f"Created settings file at: '{destination_path}'")
        except Exception as e:
            logger.error(f"Error copying default settings file: {e}")
            return None
        
    # Load the JSON settings into Python
    try:
        with open(destination_path, 'r') as file:
            data = json.load(file)
            logger.info(setting + "-settings loaded.")
            return data
    except Exception as e:
        logger.error(f"Error loading settings from '{destination_path}': {e}")
        return None
    
def save_settings(setting, data):
    # Call load_directory to ensure the directory exists
    config_directory = load_directory()

    # Specify the file path
    default_settings_file = setting + ".json"
    destination_path = os.path.join(config_directory, default_settings_file)

    # Save the settings to the JSON file
    try:
        with open(destination_path, 'w') as file:
            json.dump(data, file, indent=4)
    except Exception as e:
        logger.error(f"Error saving settings to '{destination_path}': {e}")


def reset_settings(setting):
    # Call load_directory to ensure the directory exists
    config_directory = load_directory()

    # Specify the file paths
    default_settings_file = setting + ".json"
    destination_path = os.path.join(config_directory, default_settings_file)

    # Reset the settings to the original state
    try:
        shutil.copyfile(os.path.join(os.path.dirname(__file__), "config", default_settings_file), destination_path)
        #logger.debug(f"Reset {setting}-settings to the original state.")
    except Exception as e:
        logger.error(f"Error resetting settings: {e}")