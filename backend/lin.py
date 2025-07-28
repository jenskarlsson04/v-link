import threading
import time
import sys
import serial
from enum import Enum, auto
from pathlib import Path
from .buttonHandler import ButtonHandler
from . import settings
from .shared.shared_state import shared_state

class Config:
    def __init__(self):
        self.lin_settings = settings.load_settings("lin")

class LinFrame:
    kMaxBytes = 8

    def __init__(self):
        self.bytes = bytearray()

    def append_byte(self, b):
        self.bytes.append(b)

    def get_byte(self, index):
        if 0 <= index < len(self.bytes):
            return self.bytes[index]

    def pop_byte(self):
        return self.bytes.pop()

    def num_bytes(self):
        return len(self.bytes)

    def reset(self):
        self.bytes.clear()

    def is_valid(self):
        return len(self.bytes) >= 6


class LINThread(threading.Thread):
    def __init__(self, logger):
        super(LINThread, self).__init__()
        self.logger = logger
        
        self.config = Config()
        self.lin_frame = LinFrame()
        self.lin_serial = None

        self._stop_event = threading.Event()
        self.daemon = True
        lin_settings = self.config.lin_settings



        # Button and joystick mappings
        self.button_mappings = self._parse_command_mappings(
            lin_settings["commands"]["button"]
        )
        self.joystick_mappings = self._parse_command_mappings(
            lin_settings["commands"]["joystick"]
        )

        self.click_timeout = lin_settings.get("click_timeout", 300)
        self.long_press_duration = lin_settings.get("long_press_duration", 2000)
        self.mouse_speed = lin_settings.get("mouse_speed", 8)

        self.button_handler = ButtonHandler(
            self.click_timeout,
            self.long_press_duration,
            self.mouse_speed
        )


    def _parse_command_mappings(self, commands):
        return {
            bytes.fromhex("".join(cmd.replace("0x", "") for cmd in command)): name
            for name, command in commands.items()
        }


    def run(self):
        try:
            if not shared_state.vLin:
                port = "/dev/ttyAMA0" if shared_state.rpiModel == 5 else "/dev/ttyS0"
                try:
                    self.lin_serial = serial.Serial(port=port, baudrate=9600, timeout=1)
                except Exception as e:
                    self.logger.error(f"UART error: {e}")
                
                while not self._stop_event.is_set():
                    try:
                        self._read_from_serial()
                    except serial.SerialException as e:
                        self.logger.error(f"Serial communication error: {e}")
                    except Exception as e:
                        self.logger.error(f"Error in LIN _read_from_serial: {e}")
            else:
                self._read_from_file()
        except Exception as e:
            self.logger.error(f"Unexpected error in LIN thread: {e}")


    def stop_thread(self):
        time.sleep(.5)
        self._stop_event.set()

        if self.lin_serial and self.lin_serial.is_open:
            self.lin_serial.close()

        self.join(timeout=2)


    def _read_from_serial(self):
        try:
            while not self._stop_event.is_set():
                if self.lin_serial and self.lin_serial.is_open:
                    if self.lin_serial.in_waiting > 0:
                        self._process_incoming_byte(self.lin_serial.read(1))
                        self.button_handler.timeout_button()
                    else:
                        time.sleep(0.1)
                else:
                    break
        except KeyboardInterrupt:
            self.logger.info("Live data collection terminated.")
        except serial.SerialException as e:
            self.logger.error(f"Serial communication error: {e}")
        except Exception as e:
            self.logger.error(f"Unexpected error: {e}")


    def _read_from_file(self):
        self.logger.info("Replaying LIN bus data from file...")
        try:
            time.sleep(10) # wait for app to be started
            with open(Path(__file__).parent / "dev/lin_test.txt", "r") as file:
                for line in file:
                    if self._stop_event.is_set():
                        break
                    frame_data = [int(byte, 16) for byte in line.strip().split()]
                    for byte in frame_data:
                        self._process_incoming_byte(byte.to_bytes(1, 'big'))
                    time.sleep(0.1)
        except KeyboardInterrupt:
            self.logger.info("Replay stopped by user.")


    def _process_incoming_byte(self, byte):
        try:
            if not byte:  # Check for empty data
                return
            
            n = self.lin_frame.num_bytes()
            sync_id = bytes.fromhex(self.config.lin_settings["sync_id"][2:])

            if byte == sync_id and n > 2 and self.lin_frame.get_byte(n - 1) == 0x00:
                self.lin_frame.pop_byte()
                self._handle_frame()
                self.lin_frame.reset()
            elif n == self.lin_frame.kMaxBytes:
                self.lin_frame.reset()
            else:
                if byte:
                    self.lin_frame.append_byte(byte[0] if isinstance(byte, bytes) else byte)
                elif shared_state.verbose:
                    self.logger.info("Empty byte, not adding to lin frame")
        except IndexError as e:
            self.logger.error(f"IndexError: {e} while processing incoming bytes.")

    def _handle_frame(self):
        swm_id = bytes.fromhex(self.config.lin_settings["swm_id"][2:])
                
        if self.lin_frame.get_byte(0) != swm_id[0]:
            return

        zero_code = bytes.fromhex(self.config.lin_settings["zero_code"][2:])
        if self.lin_frame.get_byte(5) == zero_code[0]:
            return

        if not self.lin_frame.is_valid():
            return

        frame_data = b"".join(self.lin_frame.get_byte(i).to_bytes(1, 'big') for i in range(5))
        button_name = self.button_mappings.get(frame_data) or self.joystick_mappings.get(frame_data) 
        
        print(button_name)
        self.button_handler.handle(button_name)
