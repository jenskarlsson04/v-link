import threading
import time
import sys
import os
import subprocess
import signal
from .shared.shared_state import shared_state

class APPThread(threading.Thread):
    def __init__(self, logger):
        super().__init__()
        self.logger = logger

        self.url = f"http://localhost:{4001 if shared_state.vite else 5173}"
        self.browser = None
        self._stop_event = threading.Event()


    def run(self):
        self.start_browser()

        while not self._stop_event.is_set():
            if(shared_state.toggle_app.is_set()):
                self.stop_thread()
            time.sleep(.1)

    def stop_thread(self):
        self._stop_event.set()
        self.close_browser()
        shared_state.toggle_app.clear()


    def start_browser(self):
        if shared_state.verbose: log_level_flag = "--log-level=3 >/dev/null 2>&1"
        else:                    log_level_flag = "--log-level=3 >/dev/null 2>&1"

        if shared_state.isKiosk:
            flags = "--window-size=800,480 --kiosk --enable-experimental-web-platform-features --enable-features=SharedArrayBuffer --autoplay-policy=no-user-gesture-required --disable-extensions  --remote-debugging-port=9222"
            command = f"chromium-browser --app={self.url} {flags} {log_level_flag}"
        else:
            flags = "--window-size=800,480 --disable-resize --enable-experimental-web-platform-features --enable-features=SharedArrayBuffer,OverlayScrollbar --autoplay-policy=no-user-gesture-required"
            command = f"chromium-browser {self.url} {flags} {log_level_flag}"


        self.browser = subprocess.Popen(command, shell=True)
        self.logger.info(f"Chromium browser started with PID: {self.browser.pid}")

    def close_browser(self):
        if self.browser:
            try:
                # Use subprocess to run a command that kills the process and its children
                subprocess.run(['pkill', '-P', str(self.browser.pid)])
                self.browser.wait()
            except subprocess.CalledProcessError as e:
                # Handle possible exceptions
                self.logger.error(f"Error stopping frontend {e}")
        else:
            self.logger.error("Chromium not found on this system.")