# ATEM MIDI control - Control a Blackmagic ATEM with a cheap MIDI controller

## Why?

An entry level OEM control panel costs upwards of $3000 USD.
There are however cheapo MIDI based video controllers available for ~$400 USD such as the MIDI based TY-1500HD.
Someone makes a simple software app that connects it to Blackmagic devices, however I've found it to be unstable & contain limited functionlity.

## Functionality

Connects control interface buttons & fader to your video switcher.

This app scans reads your configuration from autosave files belonging to the official ATEM control software & maps them to the MIDI device.

## Getting started

This app should work on OS X, however it's untested.

### Simple install [Windows only]

1. Download `ATEM_MIDI_win_complete.zip`
2. Extract files
3. Double click `Run` batch file to start

### Advanced install [Windows, OS X, Linux]

1. Install [NodeJS](https://nodejs.org/en/download/) 14 LTS or newer and install build tools when prompted (will take a while & require internet).
2. Download a copy of `ATEM_MIDI_advanced.zip`
3. Extract files
4. Open a command prompt, `cd` into to extracted folder
5. Type `npm install` and press enter
6. Double click `Run.sh` to launch or run `node src/index.js`
7. Copy `config.example.js` to `config.local.js` and adjust values inside `config.local.js` as required.

## Supported devices

### Video switchers
- ATEM video switchers (tested with ATEM 1/ME)
  Please install Atem software v 8.5 or newer to make sure your switcher has up to date firmware.

### Control interfaces
- TY-1500HD (MIDI)

## FAQ

**Why is it just a black window? Where is the interface?**
There isn't one. It's a simple console based NodeJS app & configure by editing JSON files.

**My ATEM uses a different IP address and this app won't connect**
You can change the ATEM IP in `config.local.js`.

**Does it support other MIDI devices?**
Not currently, but have a look inside `src/devices/config` to see how it works and how to add support for other devices.
