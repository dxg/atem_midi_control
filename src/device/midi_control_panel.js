const _     = require('lodash');
const chalk = require('chalk');
const midi  = require('midi');

class MIDIControlPanel {
  #config
  #connected
  #externalCallbacks
  #groupedButtons
  #input
  #output

  #aliveInterval
  
  constructor(model, externalCallbacks) {
    this.#config = require(`./config/${model}.json`);
    this.#groupedButtons = _.groupBy(this.#config.buttons, 'group');
    this.#connected = false;

    this.#externalCallbacks = _.defaults(externalCallbacks, {
      onButtonPress: (() => {}),
      onFader:       (() => {}),
      onReconnect:   (() => {}),
    });

    this.#connect();
    this.#aliveInterval = setInterval((() => this.#checkDeviceConnected()), 330);
  }
  
  #connect() {
    this.#input  = new midi.Input();
    this.#output = new midi.Output();

    this.#openPort(this.#input);
    this.#openPort(this.#output);
    this.#connected = true;

    console.log(chalk.green(`Connected to '${this.#config.name}' (midi)`));

    this.#config.buttons.forEach((btn) => this.#buttonLight(btn, false));
    this.#listen();
  }

  #disconnect() {
    this.#connected = false;
    this.#stopListening();
    this.#input.closePort();
    this.#output.closePort();
  }

  #runWithStartupDelay(fn) {
    // Wait until device has finished startup
    setTimeout(
      fn,
      this.#config.startupTimeMS,
    )
  }

  #checkDeviceConnected() {
    const inFound  = this.#findPortIndex(this.#input,  this.#config.name) !== -1;
    const outFound = this.#findPortIndex(this.#output, this.#config.name) !== -1;

    if (inFound && outFound) {
      if (!this.#connected) {
        console.log(chalk.yellow(`Reconnecting to '${this.#config.name}'`));
        this.#connect();
        this.#runWithStartupDelay(this.#externalCallbacks.onReconnect);
      }
    } else {
      if (this.#connected) {
        console.log(chalk.yellow(`Connection to '${this.#config.name}' lost`));
        this.#disconnect();
      }
    }
  }

  #findPortIndex(io, name) {
    const portCount = io.getPortCount();

    for (let a = 0; a < portCount; a++) {
      if (io.getPortName(a).startsWith(name)) {
        return a;
      }
    }
    return -1;
  }

  #openPort(io) {
    const index = this.#findPortIndex(io, this.#config.name);

    if (index === -1) {
      const err = new Error(`MIDI device '${this.#config.name}' not found`);
      err.code = 'midi-device-not-found';
      throw err;
    }

    io.openPort(index);
  }

  #send(msg) {
    const ret = this.#output.sendMessage(msg);
  }

  #buttonLight(btn, on) {
    if (on) {
      this.#send(btn.down);
    } else {
      this.#send(btn.up);
    }
    btn.on = on;
  }

  #buttonLightFlash(btn, flash) {
    if (flash && btn.flashing) {
      return;
    }
    if (!flash && !btn.flashing) {
      return;
    }
    
    if (!flash && btn.flashing) {
      clearInterval(btn.flashInterval);
      btn.flashInterval = null;
      btn.flashing = false;
      this.#buttonLight(btn, false);
      return;
    }

    btn.flashing = true;
    btn.flashInterval = setInterval(
      (() => this.#buttonLight(btn, !btn.on) ),
      300,
    );
  }

  #turnonButtonInGroup(btn) {
    if (btn.light === 'exclusive') {
      _.without(_.filter(this.#config.buttons, { group: btn.group, on: true }), btn).forEach((btn) => this.#buttonLight(btn, false));
    }
    if (['exclusive', 'temp'].includes(btn.light)) {
      this.#buttonLight(btn, true);
    }
    if (btn.light === 'temp') {
      setTimeout(
        (() => this.#buttonLight(btn, false)),
        500,
      );
    }
  }

  #onPress(btn) {
    if (!btn.on || btn.light !== 'exclusive') {
      this.#turnonButtonInGroup(btn);
    }

    this.#externalCallbacks.onButtonPress(btn.group, btn.name);
  }

  #onFader(btn, val) {
    let adjusted;

    if (btn.reverse) {
      adjusted = Math.round((127 - val) * (10000/127));
    } else {
      adjusted = Math.round(val * (10000/127));
    }

    if (val === 0) {
      btn.reverse = false;
    }
    if (val === 127) {
      btn.reverse = true;
    }

    this.#externalCallbacks.onFader(btn.name, adjusted);
  }

  #listen() {
    this.#input.on('message', (deltaTime, msg) => {
      const btn = this.#config.buttons.find((b) => b.down[0] === msg[0] && b.down[1] === msg[1]);

      if (btn) {
        switch (btn.type) {
          case 'button':
            this.#onPress(btn);
            break;
          case 'fader':
            this.#onFader(btn, msg[2]);
            break;
        }
      }

      // console.log("msg:", msg);
    });
  }

  #stopListening() {
    this.#input.removeAllListeners();
  }

  turnonButtonInGroup(type, index) {
    const btn = this.#groupedButtons[type][index];
    this.#turnonButtonInGroup(btn);
  }

  fadeToBlackLight(state) {
    const btn = this.#config.buttons.find((b) => b.name === 'ftb');

    switch (state) {
      case 'off':
        this.#buttonLightFlash(btn, false);
        this.#buttonLight(btn, false);
        break;
      case 'on':
        this.#buttonLightFlash(btn, false);
        this.#buttonLight(btn, true);
        break;
      case 'flashing':
        this.#buttonLightFlash(btn, true);
        break;
    }
  }
}

module.exports = MIDIControlPanel;
