import threading
import time
import can
import socketio
import sys
from . import settings
from .buttonHandler import ButtonHandler
from .shared.shared_state import shared_state


class Config:
    def __init__(self, logger):
        self.logger = logger

        self.can_settings = settings.load_settings("can")
        self.interfaces = []
        self.sensors = {}

        self.load_interfaces()
        self.load_sensors()

    def load_interfaces(self):
        for iface in self.can_settings["interfaces"]:
            if iface["enabled"]:
                self.interfaces.append({
                    "channel": iface["channel"],
                    "bustype": iface["bustype"],
                    "is_extended": iface["is_extended"],
                    "bitrate": iface["bitrate"],
                })

    def load_sensors(self):
        for key, sensor in self.can_settings['sensors'].items():
            try:
                iface = sensor["interface"]

                if not sensor['enabled']:
                    continue

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
                    "type": sensor['type'],
                    "req_id": [req_id],
                    "rep_id": [rep_id],
                    "message_bytes": message_bytes,
                    "scale": scale,
                    "is_16bit": sensor['is_16bit'],
                    "id": sensor['app_id'],
                    "refresh_rate": refresh_rate,
                    "last_requested_time": 0
                })

                self.logger.debug(f"Loaded sensor '{key}' on {iface}")
            except Exception as e:
                self.logger.error(f"Error loading sensor '{key}': {e}")

class CANThread(threading.Thread):
    def __init__(self, logger):
        super(CANThread, self).__init__()
        self.logger = logger

        self._stop_event = threading.Event()
        self.daemon = True

        self.client = socketio.Client()
        self.config = Config(logger)
        self.can_control_settings = self.config.can_settings["controls"]

        self.can_buses = {}         # can interfaces
        self.notifiers = {}         # can filters (using a callback)
        self.broadcast_tasks = []   # scheduled tasks to send can messages

        
    def run(self):
        self.connect_to_socketio()
        self.initialize_canbus()
        
        try:
            while not self._stop_event.is_set():
                time.sleep(1)
        except KeyboardInterrupt:
            pass

    def initialize_canbus(self):
        for iface in self.config.interfaces:
            channel = iface["channel"] # can1, can2, etc
            is_extended = iface["is_extended"]

            try:
                bus = can.interface.Bus(
                    channel=channel,
                    bustype=iface["bustype"],
                    bitrate=iface["bitrate"]
                )
                if bus is None:
                    self.logger.error(f"Error: failed to initialize CAN bus {channel}, bus is None")
                    continue

                self.can_buses[channel] = bus
                self.logger.info(f"Initialized CAN interface: {channel}")

                # Configure filters: include sensor reply IDs and control reply ID (if controls enabled on this interface)
                sensors = self.config.sensors.get(channel, [])
                rep_ids = set()
                for sensor in sensors:
                    rep_ids.add(sensor["rep_id"][0])

                if self.can_control_settings['enabled'] and self.can_control_settings["interface"] == channel:
                    control_rep_id = int(self.can_control_settings['rep_id'], 16)
                    rep_ids.add(control_rep_id)

                # Set up filters for all reply_ids
                filters = [{"can_id": rep_id, "can_mask": 0x1FFFFFFF if is_extended else 0x7FF, "extended": is_extended} for rep_id in rep_ids]
                bus.set_filters(filters)

                # Configure scheduled tasks to send diagnostic CAN requests
                filtered_sensors = [sensor for sensor in sensors if sensor.get("type") == "diagnostic"]
                for sensor in filtered_sensors:
                    msg = can.Message(
                        arbitration_id=sensor["req_id"][0],
                        data=sensor["message_bytes"],
                        is_extended_id=is_extended
                    )
                    period = sensor.get("refresh_rate", 1) # default to 1 second if not supplied

                    task = bus.send_periodic(msg, period=period)
                    self.broadcast_tasks.append(task) # save task to list to prevent it being gc'ed
                    
                    #self.logger.debug(f"Created scheduled task for sensor {sensor['id']}")

                sensors_by_id = {}
                for sensor in sensors:
                    rep_id = sensor["rep_id"][0]
                    sensors_by_id.setdefault(rep_id, []).append(sensor)

                self.logger.debug("Starting CAN Notifier")

                listener = CANListener(sensors_by_id, self.can_control_settings, self.client)
                notifier = can.Notifier(bus, [listener])
                self.notifiers[channel] = notifier

            except Exception as e:
                self.logger.error(f"Error initializing CAN Bus {channel}: {e}")

    def stop_thread(self):
        time.sleep(.5)
        self._stop_event.set()
        for notifier in self.notifiers.values():
            try:
                notifier.stop()
            except Exception as e:
                self.logger.error(f"Error stopping Notifier: {e}")

        for channel, bus in self.can_buses.items():
            bus.stop_all_periodic_tasks()
            bus.shutdown()

        if self.client.connected:
            self.client.disconnect()

    def connect_to_socketio(self):
        max_retries = 10
        current_retry = 0
        while not self.client.connected and current_retry < max_retries:
            try:
                self.client.connect('http://localhost:4001', namespaces=['/can'])
            except Exception as e:
                self.logger.error(f"Socket.IO connection failed. Retry {current_retry}/{max_retries}. Error: {e}")
                time.sleep(.5)
                current_retry += 1

        if self.client.connected:
            self.logger.info(f"CAN connected to Socket.IO")
        else:
            self.logger.error(f"CAN failed to connect to Socket.IO.")

class CANListener(can.Listener):
    def __init__(self, sensors_by_id, control_settings, client):
        self.sensors_by_id = sensors_by_id
        self.control_settings = control_settings
        self.client = client

        # Control parameters
        self.zero_message = [int(byte, 16) for byte in control_settings['zero_message']]
        self.control_reply_id = int(control_settings['rep_id'], 16)
        self.control_byte_count = control_settings['control_byte_count']
        self.control_buttons = {k: self.parse_can_control_values(v) for k, v in control_settings['button'].items()}
        self.control_joystick = {k: self.parse_can_control_values(v) for k, v in control_settings['joystick'].items()}

        # Build lookup from control message tuple to button name
        self.control_lookup = {}
        for button_name, value_lists in {**self.control_buttons, **self.control_joystick}.items():
            for key_tuple in value_lists:
                self.control_lookup[key_tuple] = button_name

        self.button_handler = ButtonHandler(
            control_settings['click_timeout'],
            control_settings['long_press_duration'],
            control_settings['mouse_speed']
        )

    def parse_can_control_values(self, value):
        if isinstance(value[0], list):
            # Multiple CAN message (Already a list of lists)
            return [tuple(int(byte, 16) for byte in pair) for pair in value]
        else:
            # Single CAN message (flat list), wrap in a list
            return [tuple(int(byte, 16) for byte in value)]   

    def on_message_received(self, msg):
        try:
            if msg.arbitration_id in self.sensors_by_id:
                data = list(msg.data)
                if shared_state.verbose:
                    message_hex = " ".join(f"{byte:02X}" for byte in msg.data)
                    self.logger.debug("Parsing message: ", message_hex)

                for sensor in self.sensors_by_id[msg.arbitration_id]:
                    if (data[2] != sensor['message_bytes'][2] and  # Exclude request message (0xA6)
                        data[3] == sensor["message_bytes"][3] and  # match parameter0
                        data[4] == sensor["message_bytes"][4]):    # match parameter1

                        value = ((data[5] << 8) | data[6] if sensor["is_16bit"] else data[5])
                        converted_value = eval(sensor["scale"], {"value": value})

                        self.logger.debug(f"Sending message for {sensor['id']} to frontend with value {converted_value}")

                        if self.client and self.client.connected:
                            self.client.emit("data", f"{sensor['id']}:{float(converted_value)}", namespace="/can")
                        return  # Process only one sensor per message

            # Process control messages if enabled
            if self.control_settings['enabled'] and msg.arbitration_id == self.control_reply_id:
                message_data = list(msg.data)
                self.button_handler.timeout_button()
                if message_data[-len(self.zero_message):] == self.zero_message:
                    self.logger.debug("Zero message detected. Ignoring CAN Frame.")
                    return

                key = tuple(message_data[-self.control_byte_count:])
                if key in self.control_lookup:
                    self.logger.debug(f"Pressing: {self.control_lookup[key]}")
                    self.button_handler.handle(self.control_lookup[key])
                    return

                message_hex = " ".join(f"{byte:02X}" for byte in message_data)
                self.logger.debug(f"Unknown control signal received: {message_hex}")
        except Exception as e:
            self.logger.error(f"CAN listener error: {e}")
