# Welcome to the Boosted Moose V-Link project!

![TITLE IMAGE](resources/media/banner.jpg?raw=true "Banner")

### Let's face it. MMIs from the 2000s suck.

This project was started because no suitable aftermarket solution could be found. I wanted to implement live vehicle data as well as AndroidAuto/Apple CarPlay in an **OEM like fashion** to enhance the driving experience of retro cars and give the user the ability to tinker around.

The heart of this project is the open source **V-Link app**. It's running natively on Raspberry Pi OS which enables full support of an OS without the restrictions of 3rd party images. **The custom V-Link HAT** builds the bridge between the Raspberry Pi and the car and works plug and play with the app. To use this application you need a Raspberry Pi, the V-Link Hat (optional) and an HDMI-screen, preferably with touch support.


 *This project is in ongoing development. Feel free to fork it, create a new branch and open a pull request with your cool ideas. Do you have  any tips for improvement, need help or just want to be part of our awesome little community?*

* [Swedespeed Forum](https://www.swedespeed.com/threads/volvo-rtvi-raspberry-media-can-interface.658254/)
* [V-Link Discord Server](https://discord.gg/V4RQG6p8vM)


# Installation

### > System Requirements:
```
Raspberry Pi 3/4/5
Raspberry Pi OS 12 (Bookworm)
```

For the best user experience a RPi 4 or 5 is recommended.

---

### > Run the App:

When using the Installer everything is being set up automatically. More information can be found in the Wiki.

```
#Download and Install
wget "https://github.com/LRYMND/v-link/releases/download/v3.0.0/Install.sh"
sudo chmod +x Install.sh
sudo ./Install.sh

#Test Hardware (Requires V-Link HAT)
python /home/$USER/v-link/HWT.py

#Execute
python /home/$USER/v-link/V-Link.py

#Advanced Options:
python /home/$USER/v-link/V-Link.py -h
```

## Wiki

Detailed instructions on all the functions and features can be found in the [Wiki](https://github.com/BoostedMoose/v-link/wiki) of this repository. In there you will find schematics, instructions to set up the HAT or your custom circuit and more. Definitely check it out!

## Disclaimer

The use of this soft- and hardware is at your own risk. The author and distributor of this project is not responsible for any damage, personal injury, or any other loss resulting from the use or misuse of the setup described in this repository. By using this setup, you agree to accept full responsibility for any consequences that arise from its use. It’s DIY after all!


#### The project is inspired by the following repositories:

* [volvo-can-gauge](https://github.com/Alfaa123/Volvo-CAN-Gauge)
* [react-carplay](https://github.com/rhysmorgan134/react-carplay)
* [volvo-crankshaft](https://github.com/laurynas/volvo_crankshaft)
* [volve](https://github.com/LuukEsselbrugge/Volve)
* [volvo-vida](https://github.com/Tigo2000/Volvo-VIDA)

#### Want to join development, got any tips for improvement or need help?  

* [Swedespeed Forum](https://www.swedespeed.com/threads/volvo-rtvi-raspberry-media-can-interface.658254/)
* [V-Link Discord Server](https://discord.gg/V4RQG6p8vM)



## Want to support us?

We are working on this project in our free time and support is always highly appreciated :)

| [![Buy Me A Coffee](https://cdn.buymeacoffee.com/buttons/default-orange.png)](https://www.buymeacoffee.com/lrymnd)  | [![Buy Me A Coffee](https://cdn.buymeacoffee.com/buttons/default-orange.png)](https://www.buymeacoffee.com/tigo) |
|---|---|
| <center>(Louis)</center> | <center>(Tigo)</center> |
