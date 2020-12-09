const _    = require('lodash');
const midi = require('midi');

class MIDIControlPanel {
  constructor(model) {
    this.config = require(`./config/${model}.json`);
    this.input  = new midi.Input();
    this.output = new midi.Output();

    this.openPort(this.input);
    this.openPort(this.output);

    this.listen();
  }

  close() {
    this.input.closePort();
    this.output.closePort();
  }

  findPortIndex(io, name) {
    const portCount = io.getPortCount();

    for (let a = 0; a < portCount; a++) {
      if (io.getPortName(a).startsWith(name)) {
        return a;
      }
    }
    return null;
  }

  openPort(io) {
    const index = this.findPortIndex(io, this.config.name);

    if (index == null) {
      throw new Error(`MIDI device '${this.config.name}' not found`);
    }

    io.openPort(index);
  }

  send(msg) {
    this.output.sendMessage(msg);
  }

  buttonLight(btn, on) {
    if (on) {
      this.send(btn.down);
    } else {
      this.send(btn.up);
    }
    btn.on = on;
  }

  onPress(btn) {
    if (btn.on) {
      this.send(btn.up);
    } else {
      _.without(_.filter(this.config.buttons, { group: btn.group, on: true }), btn).forEach((btn) => this.buttonLight(btn, false));
      this.buttonLight(btn, true);
    }
  }

  listen() {
    this.input.on('message', (deltaTime, message) => {
      const btn = _.find(this.config.buttons, { down: message });

      if (btn) {
        this.onPress(btn);
      }

      console.log(message);
    });
  }

  bounce(buttons, groupName) {
    let direction = 'right';
    let index = 0;

    const iterate = () => {
      this.onPress(buttons[index]);

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

  bounceAll() {
    const groups = _.groupBy(this.config.buttons, (b) => b.group.slice(0,3));

    _.values(groups).forEach((buttons, index) => {
      console.log(buttons[0].group, buttons.length, index);
      setTimeout((() => this.bounce(buttons, buttons[0].group)), index * 150);
    });
  }
}

module.exports = MIDIControlPanel;
