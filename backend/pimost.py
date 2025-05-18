import threading
import time
import sys
import os
import subprocess
import socketio
import serial
import struct
from threading import Thread
from serial.tools import list_ports
from .shared.shared_state import shared_state
import time

# pymost-client implementation, replaced timer with thread
class PiMost:
    def __init__(self, recv_most_message):
        self.port = None
        self.ser = None
        self.VID = 51966
        self.connected = False
        self.recv_most_message = recv_most_message
        self.poll_pimost = Thread(target=self.poll)
        self.poll_pimost.setDaemon(True)
        self.poll_pimost.start()

        self._out_messages = {
            'force_switch': bytearray([0x55, 0x01, 0x74])
        }

    def force_switch(self):
        if self.connected:
            self.ser.write(self._out_messages['force_switch'])
        return

    def send_message(self):
        return

    def connect(self):
        self.ser = serial.Serial(port=self.port, baudrate=921600, bytesize=8, timeout=2)
        self.connected = True

    def find_port(self):
        device_list = list_ports.comports()
        print("Finding PiMost port")
        for device in device_list:
            if device.vid is not None or device.pid is not None:
                if device.vid == self.VID:
                    self.port = device.device
                    self.connect()
                    print("Found PiMost device")
                    break

    def poll(self):
        while True:
            if self.connected:
                try:
                    # noinspection PyUnresolvedReferences
                    command = self.ser.read(3)
                    if len(command) > 0:
                        if command[0] == 85:
                            length = command[1]
                            type = command[2]
                            # noinspection PyUnresolvedReferences
                            message = self.ser.read(length)
                            if type == 0x01:
                                self.parse_message(message, length)
                except serial.serialutil.SerialException:
                    print("PiMost Disconnected")
                    self.connected = False
                    self.ser = None
                    self.port = None

    def parse_message(self, data, length):
        raw_data = struct.unpack_from('>BBBBBHB', data, 0)
        message = data[8:len(data)]
        most_message = {
            'type': raw_data[0],
            'source_address_high': raw_data[1],
            'source_address_low': raw_data[2],
            'fBlock_id': raw_data[3],
            'instance_id': raw_data[4],
            'fkt_id': raw_data[5] >> 4,
            'op_type': raw_data[5] & 0xf,
            'tel_id': (raw_data[6] & 0xf) >> 4,
            'tel_len': raw_data[6] & 0xf,
            'data': message
        }
        self.recv_most_message(most_message)

class PiMOSTThread(threading.Thread):
    def __init__(self):
        super(PiMOSTThread, self).__init__()
        self.pimost = PiMost(self.recv_most_message)
        self.client = socketio.Client()
        self._stop_event = threading.Event()
        self.daemon = True

    def run(self):
        try:
            while not self._stop_event.is_set():
                # Connect to socketIO 
                if not self.client.connected:
                    self.connect_to_socketio()
                
                # Connect to PiMost
                if not self.pimost.connected:
                    if shared_state.verbose:
                        print("Attempting to connect to PiMost device")
                    self.pimost.find_port()           

                # Keep checking if connection is up
                time.sleep(10)
        except KeyboardInterrupt:
            pass

    def connect_to_socketio(self):
        max_retries = 10
        current_retry = 0
        while not self.client.connected and current_retry < max_retries:
            try:
                self.client.connect('http://localhost:4001', namespaces=['/most'])
            except Exception as e:
                print(f"Socket.IO connection failed. Retry {current_retry}/{max_retries}. Error: {e}")
                time.sleep(.5)
                current_retry += 1
        if shared_state.verbose:
            print("MOST connected to Socket.IO" if self.client.connected else "MOST failed to connect to Socket.IO.")

    # callback from PiMost class
    def recv_most_message(self, most_message):
        self.client.emit("most_message", most_message, namespace="/most")
        if shared_state.verbose:
            print("most message received")
            #print(most_message)

    def force_switch(self):
        if self.pimost.connected:
            print("pimost connected, force switching")
            self.pimost.force_switch()
        else:
            print("PiMost device not connected! Cannot send force_switch")
        
    def stop_thread(self):
        print("Stopping PiMost thread.")
        time.sleep(.5)
        self._stop_event.set()