# Welcome to the Boosted Moose V-Link project!

Let's face it. MMIs from the 2000s suck. This is a personal project that I started because I couldn't find a suitable aftermarket solution. I wanted to implement live vehicle data as well as AndroidAuto/Apple CarPlay in an OEM like fashion to enhance the driving experience of retro cars and give the user the ability to tinker around. The heart of this project is the open source V-Link app. It's running natively on Raspberry Pi OS which enables full support of an OS without the restrictions of 3rd party images. A custom made HAT builds the bridge between the Raspberry Pi and the car and works plug and play with the app.

To use this application you need a Raspberry Pi, the V-Link Hat (optional) and an HDMI-screen, preferably with touch support.

This project is in ongoing development. Do you want to participate, got any tips for improvement or need help?

* [Swedespeed Forum](https://www.swedespeed.com/threads/volvo-rtvi-raspberry-media-can-interface.658254/)
* [V-Link Discord Server](https://discord.gg/V4RQG6p8vM)

Feel free to fork the project. Create a new branch, commit your changes and open a pull request.

---
![TITLE IMAGE](resources/media/banner.jpg?raw=true "Banner")  

# Installation

### > System Requirements:
```
Raspberry Pi 3/4/5
Raspberry Pi OS 12 (Bookworm)
```

For the best user experience a RPi 4 or 5 is recommended.

---

### > Run the App:

When using the Installer everything is being set up automatically.
Before updating, please uninstall the app. (See below)

```
#Download and Install
wget "https://github.com/LRYMND/v-link/releases/download/v2.2.1/Install.sh"
sudo chmod +x Install.sh
sudo ./Install.sh

#Test Hardware (Requires V-Link HAT)
python /home/$USER/v-link/HWT.py

#Execute
python /home/$USER/v-link/V-Link.py

#Advanced Options:
python /home/$USER/v-link/V-Link.py -h
```

#### In case you get an error when installing the requirements run these commands:
```
source /home/$USER/v-link/venv/bin/activate
pip install -r /home/$USER/v-link/requirements.txt
```

## Wiki

Detailed instructions on all the functions and features can be found in the [wiki](https://github.com/BoostedMoose/v-link/wiki) of this repository. In there you will find schematics, instructions to set up the HAT or your custom circuit and more. Definitely check it out!

## Disclaimer

The use of this soft- and hardware is at your own risk. The author and distributor of this project is not responsible for any damage, personal injury, or any other loss resulting from the use or misuse of the setup described in this repository. By using this setup, you agree to accept full responsibility for any consequences that arise from its use. It’s DIY after all!


---
#### The project is inspired by the following repositories:

* [volvo-can-gauge](https://github.com/Alfaa123/Volvo-CAN-Gauge)
* [react-carplay](https://github.com/rhysmorgan134/react-carplay)
* [volvo-crankshaft](https://github.com/laurynas/volvo_crankshaft)
* [volve](https://github.com/LuukEsselbrugge/Volve)
* [volvo-vida](https://github.com/Tigo2000/Volvo-VIDA)

#### Want to join development, got any tips for improvement or need help?  

* [Swedespeed Forum](https://www.swedespeed.com/threads/volvo-rtvi-raspberry-media-can-interface.658254/)
* [V-Link Discord Server](https://discord.gg/V4RQG6p8vM)

---


| [![Buy Me A Coffee](https://cdn.buymeacoffee.com/buttons/default-orange.png)](https://www.buymeacoffee.com/lrymnd)  | [![Buy Me A Coffee](https://cdn.buymeacoffee.com/buttons/default-orange.png)](https://www.buymeacoffee.com/tigo) |
|---|---|
| <center>(Louis)</center> | <center>(Tigo)</center> |
