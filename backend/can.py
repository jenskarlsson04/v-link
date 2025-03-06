import threading
import time
import can
import socketio
import sys
from . import settings
from .buttonHandler import ButtonHandler
from .shared.shared_state import shared_state

class Config:
    def __init__(self):
        self.canSettings = settings.load_settings("can")
        # self.timeout = self.canSettings["timeout"]
        self.interfaces = []
        self.sensors = {}
        self.load_interfaces()
        self.load_sensors()

    def load_interfaces(self):
        for iface in self.canSettings["interfaces"]:
            if iface["enabled"]:
                self.interfaces.append({
                    "channel": iface["channel"],
                    "bustype": iface["bustype"],
                    "bitrate": iface["bitrate"],
                })

    def load_sensors(self):
        for key, sensor in self.canSettings['sensors'].items():
            try:
                iface = sensor["interface"]

                if iface not in self.sensors:
                    self.sensors[iface] = []

                req_id = int(sensor['req_id'], 16)
                rep_id = int(sensor['rep_id'], 16)
                target = int(sensor['target'], 16)
                action = int(sensor['action'], 16)
                parameter0 = int(sensor['parameter'][0], 16)
                parameter1 = int(sensor['parameter'][1], 16)

                # calculate dlc
                message_data = [rep_id, target, action, parameter0, parameter1]
                message_data = [byte for byte in message_data if byte != 0]
                dlc = 0xC8 + len(message_data)

                message_bytes = [dlc, target, action, parameter0, parameter1, 0x01, 0x00, 0x00]
                refresh_rate = sensor.get('refresh_rate', 0.5)
                scale = sensor["scale"]

                # check scale calculation
                if not isinstance(scale, str) or "value" not in scale:
                    raise ValueError(f"Invalid scale format for sensor {key}")

                self.sensors[iface].append({
                    "req_id": [req_id],
                    "rep_id": [rep_id],
                    "message_bytes": message_bytes,
                    "scale": scale,
                    "is_16bit": sensor['is_16bit'],
                    "id": sensor['app_id'],
                    "refresh_rate": refresh_rate,
                    "last_requested_time": 0
                })

                print(f"Loaded sensor '{key}' on {iface}")
            except Exception as e:
                print(f"Error loading sensor '{key}': {e}")

class CANThread(threading.Thread):
    def __init__(self):
        super(CANThread, self).__init__()
        self._stop_event = threading.Event()
        self.daemon = True
        self.client = socketio.Client()
        self.config = Config()
        self.can_buses = {}
        self.send_threads = []
        self.listen_threads = []

        self.canSettings = self.config.canSettings["controls"]

    def run(self):
        self.connect_to_socketio()
        self.initialize_canbus()
            
        # start child threads
        for iface, can_bus in self.can_buses.items():
            sensors = self.config.sensors.get(iface, [])

            if not sensors:
                print(f"Warning: No sensors configured for active CAN interface {iface}")

            send_thread = CANSendThread(can_bus, sensors, self.client, self._stop_event)
            listen_thread = CANListenThread(can_bus, sensors, self.client, self._stop_event, self.canSettings)

            self.send_threads.append(send_thread)
            self.listen_threads.append(listen_thread)

            send_thread.start()
            listen_thread.start()

        for thread in self.send_threads + self.listen_threads:
            thread.join()

    def initialize_canbus(self):
        for iface in self.config.interfaces:
            try:
                bus = can.interface.Bus(
                    channel=iface["channel"],
                    bustype=iface["bustype"],
                    bitrate=iface["bitrate"]
                )
                if bus is None:
                    print(f"Error failed to initialize CAN bus {iface['channel']}, bus is None")
                    continue

                self.can_buses[iface["channel"]] = bus
                print(f"Initialized CAN interface: {iface['channel']}")
            except Exception as e:
                print(f"Error initializing CAN Bus {iface['channel']}: {e}")

    def stop_thread(self):
        print("Stopping CAN thread.")
        time.sleep(.5)
        self._stop_event.set()
        for thread in self.send_threads + self.listen_threads:
            thread.join()
        for channel, bus in self.can_buses.items():
            # bus.shutdown()
            print("CAN Bus shutting down!")

    def connect_to_socketio(self):
        max_retries = 10
        current_retry = 0
        while not self.client.connected and current_retry < max_retries:
            try:
                self.client.connect('http://localhost:4001', namespaces=['/can'])
            except Exception as e:
                print(f"Socket.IO connection failed. Retry {current_retry}/{max_retries}. Error: {e}")
                time.sleep(.5)
                current_retry += 1
        if shared_state.verbose:
            print("CAN connected to Socket.IO" if self.client.connected else "CAN failed to connect to Socket.IO.")

class CANSendThread(threading.Thread):
    def __init__(self, can_bus, sensors, client, stop_event):
        super(CANSendThread, self).__init__()
        self.can_bus = can_bus
        self.sensors = sensors
        self.client = client
        self._stop_event = stop_event
        self.event_trigger = threading.Event()

    def run(self):
        try:
            while not self._stop_event.is_set():
                current_time = time.time()
                next_send_time = current_time + 1

                for sensor in self.sensors:
                    try:
                        if current_time - sensor["last_requested_time"] >= sensor["refresh_rate"]:
                            self.request(sensor)
                            sensor["last_requested_time"] = current_time  # Update last request time

                            next_send_time = min(next_send_time, current_time + sensor["refresh_rate"])
                            time.sleep(2) # temp debugging
                    except:
                        print(f"Error preocessing sensor '{sensor['id']}': {e}")

                sleep_time = max(0, next_send_time - time.time())
                time.sleep(sleep_time) # sleep until a sensor needs to be updated
        except Exception as e:
            print("CAN send thread error:", e)

    def request(self, sensor):
        if not self.can_bus:
            print("Error: CAN bus is not initialized")
            return

        msg = can.Message(arbitration_id=sensor["req_id"][0], data=sensor["message_bytes"], is_extended_id=True)
        try:
            print(msg)
            self.can_bus.send(msg)
        except Exception as e:
            print(f"CAN send error: {e}")

class CANListenThread(threading.Thread):
    def __init__(self, can_bus, sensors, client, stop_event, can_settings):
        super(CANListenThread, self).__init__()
        self.can_bus = can_bus
        self.client = client
        self._stop_event = stop_event

        # Store expected reply IDs as a set for fast lookup
        self.expected_reply_ids = {sensor["rep_id"][0] for sensor in sensors}
        self.sensors_by_id = {sensor["rep_id"][0]: sensor for sensor in sensors}

        self.zero_message = [int(byte, 16) for byte in can_settings['zero_message']]
        self.control_reply_id = int(can_settings['rep_id'], 16)
        self.control_buttons = {k: [int(byte, 16) for byte in v] for k, v in can_settings['button'].items()}
        self.control_joystick = {k: [int(byte, 16) for byte in v] for k, v in can_settings['joystick'].items()}

        self.button_handler = ButtonHandler(
            300,
            2000
        )

    def run(self):
        while not self._stop_event.is_set():
            if not self.can_bus:
                print("Error in CAN listen thread: CAN bus is not initialized")
                time.sleep(0.5)
                continue

            try:
                # low timeout to minimize processing delay
                data = self.can_bus.recv(.001)

                if data:
                    if data.arbitration_id == self.control_reply_id:
                        self.process_control(data)

                    if data.arbitration_id in self.expected_reply_ids:
                        self.process_message(data)
            except Exception as e:
                print("CAN listen error:", e)
                time.sleep(10) # temp

    def process_message(self, data):
        sensor = self.sensors_by_id.get(data.arbitration_id)
        if sensor:
            value = (data.data[5] << 8) | data.data[6] if sensor["is_16bit"] else data.data[5]
            converted_value = eval(sensor["scale"], {"value": value})

            data_str = f"{sensor['id']}:{float(converted_value)}"
            self.emit_data_to_frontend(data_str)

    def emit_data_to_frontend(self, data):
        if self.client and self.client.connected:
            self.client.emit("data", data, namespace="/can")

    def process_control(self, data):
        message_data = list(data.data)

        if message_data[-len(self.zero_message):] == self.zero_message:
            if shared_state.verbose:
                print("Zero message detected. Ignoring CAN Frame.")
            return

        if not hasattr(self, "control_lookup"):
            self.control_lookup = {
                tuple(v): k for k, v in {**self.control_buttons, **self.control_joystick}.items()
            }

        # Only check the last 2 bytes (change this if the control CAN IDs are longer)
        key = tuple(message_data[-2:]) 
        if key in self.control_lookup:
            print(f"Pressing: {self.control_lookup[key]}")
            self.button_handler.handle(self.control_lookup[key])
            return
        
        message_hex = " ".join(f"{byte:02X}" for byte in message_data)
        print(f"Unknown control signal received: {message_hex}")
            
