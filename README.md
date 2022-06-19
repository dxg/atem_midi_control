# ATEM MIDI control - Control a Blackmagic ATEM with a cheap MIDI controller

## Why?

An entry level OEM control panel costs upwards of $3000 USD.
There are however cheaper video controllers available for ~$400 USD such as the solidly built TY-1500HD which uses the MIDI protocol. This control panel is intended for use with vMix, however it can be made to work with Blackmagic.
There is an app called 'BMDSwitcherMIDIMapper' which enables controlling Blackmagic devices with midi ones, however I've found it to be unstable & missing some features.

## Functionality

Connects control interface buttons & fader to your video switcher.

This app reads your configuration from autosave files belonging to the official ATEM control software & maps them to the MIDI device.
It can be made to work without installing ATEM software, however I've not configured this yet.

## Getting started

This app should work on OS X, however it's untested.

### Simple install [Windows only]

1. Make sure ATEM control software is installed & working (doesn't need to be running when using this app, just installed)
2. Download latest complete windows release
3. Extract files
4. Adjust IP in `atem_midi_control/config.local.json`.
5. Double click `Run` batch file to start

### Advanced install [Windows, OS X, Linux]

*Note that whilst this should work with OS X & Linux, I've not tested it*

1. Install [NodeJS](https://nodejs.org/en/download/) 14 LTS or newer and any required build tools (`apt-get install build-essential` or equivalent).
2. Download the latest release
3. Extract files
4. Open a command prompt, `cd` into to extracted folder
5. Type `npm install` and press enter
6. Adjust IP in `config.local.json`.
7. Start with `npm start`
8. Copy `config.example.json` to `config.local.json` and adjust values inside `config.local.json` as required.

## Supported devices

### Video switchers
- ATEM video switchers (tested with ATEM 1/ME)
  Please install Atem software v 8.5 or newer to make sure your switcher has up to date firmware.

### Control interfaces
- TY-1500HD (MIDI)

## FAQ

**Why is it just a black window? Where is the interface?**
There isn't one. The app auto-configures itself based on your ATEM software configuration.
Further customisation is available by editing JSON files.

**My ATEM uses a different IP address and this app won't connect**
You can change the ATEM IP in `config.local.js`.

**Does it support other MIDI devices?**
Not currently, but have a look inside `src/devices/config` to see how it works and how to add support for other devices.

