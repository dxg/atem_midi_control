const _              = require('lodash');
const atemConnection = require('atem-connection');

class Atem {
  constructor(ip, options = {}) {
    this.ip = ip;
    this.options = options;
    this.device = new atemConnection.Atem();
    
    this.device.on('info', (a, b) => {
      console.log("info", a, b);
    });
    this.device.on('error', (a, b) => {
      console.error("error", a, b);
    });
    this.device.on('connected', () => {
      console.log("connected", this.device.state.info.productIdentifier);
    });
    this.device.on('stateChanged', (state, pathToChange) => {
      const pgm =  _.find(this.device.state.inputs, (v, k) => v.shortName === 'PGM');
      const pvw =  _.find(this.device.state.inputs, (v, k) => v.shortName === 'PVW');

      if (pathToChange[1].indexOf('previewInput') !== -1) {
        console.log("preview", this.device.listVisibleInputs('preview'));
      } else if (pathToChange[1].indexOf('programInput') !== -1) {
        console.log("program", this.device.listVisibleInputs('program'));
      } else {
        console.log("state changed", pathToChange);
      }
    });
  }

  async connect() {
    await this.device.connect(this.ip);
    console.log("Connected", this.device.state.info);
  }

  disconnect() {
    return this.device.disconnect();
  }

  changeProgramInput(input) {
    console.log("changing program input to", input);
    return this.device.changeProgramInput(input);
  }

  setFaderPosition(pos) {
    // 0 -> 10,000
    this.device.setTransitionPosition();
  }

}

module.exports = Atem;

//const atem = new Atem('192.168.10.240');
