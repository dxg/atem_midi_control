const _    = require('lodash');
const midi = require('midi');

class MIDIControlPanel {
  #config
  #externalCallbacks
  #groupedButtons
  #input
  #output
  
  constructor(model, externalCallbacks) {
    this.#config = require(`./config/${model}.json`);
    this.#groupedButtons = _.groupBy(this.#config.buttons, 'group');

    this.#input  = new midi.Input();
    this.#output = new midi.Output();
    this.#externalCallbacks = _.defaults(externalCallbacks, {
      onControllerButtonPress: (() => {}),
      onFader:                 (() => {}),
    });

    this.#openPort(this.#input);
    this.#openPort(this.#output);

    this.#config.buttons.forEach((btn) => this.#buttonLight(btn, false));

    this.#listen();
  }

  close() {
    this.input.closePort();
    this.output.closePort();
  }

  #findPortIndex(io, name) {
    const portCount = io.getPortCount();

    for (let a = 0; a < portCount; a++) {
      if (io.getPortName(a).startsWith(name)) {
        return a;
      }
    }
    return null;
  }

  #openPort(io) {
    const index = this.#findPortIndex(io, this.#config.name);

    if (index == null) {
      throw new Error(`MIDI device '${this.#config.name}' not found`);
    }

    io.openPort(index);
  }

  #send(msg) {
    this.#output.sendMessage(msg);
  }

  #buttonLight(btn, on) {
    if (on) {
      this.#send(btn.down);
    } else {
      this.#send(btn.up);
    }
    btn.on = on;
  }

  #turnonButtonInGroup(btn) {
    if (btn.exclusive) {
      _.without(_.filter(this.#config.buttons, { group: btn.group, on: true }), btn).forEach((btn) => this.#buttonLight(btn, false));
    }
    this.#buttonLight(btn, true);
  }

  #onPress(btn) {
    if (!btn.on || !btn.exclusive) {
      this.#turnonButtonInGroup(btn);
    }

    this.#externalCallbacks.onControllerButtonPress(btn.group, btn.name);
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

      console.log(msg);
    });
  }

  #bounce(buttons, groupName) {
    let direction = 'right';
    let index = 0;

    const iterate = () => {
      this.#onPress(buttons[index]);

      if (direction === 'right') {
        if (index === (buttons.length - 1)) {
          direction = 'left';
          index--;
        } else {
          index++;
        }
      } else {
        if (index === 0) {
          direction = 'right';
          index++;
        } else {
          index--;
        }
      }
    };

    setInterval(iterate, 150);
  }

  turnonButtonInGroup(type, index) {
    const btn = this.#groupedButtons[type][index];
    this.#turnonButtonInGroup(btn);
  }

  // Just for fun
  bounceAll() {
    const groups = _.groupBy(this.#config.buttons, (b) => b.group.slice(0,3));

    _.values(groups).forEach((buttons, index) => {
      //console.log(buttons[0].group, buttons.length, index);
      setTimeout((() => this.#bounce(buttons, buttons[0].group)), index * 150);
    });
  }
}

module.exports = MIDIControlPanel;
