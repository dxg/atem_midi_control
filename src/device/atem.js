const _              = require('lodash');
const atemConnection = require('atem-connection');

class Atem {
  constructor(ip, externalCallbacks = {}) {
    this.ip = ip;
    this.externalCallbacks = _.defaults(externalCallbacks, {
      onPgmPvwChange: (() => {}),
    });
    this.device = new atemConnection.Atem();
    this._connected = new Promise((resolve, reject) => {
      this.device.on('connected', () => {
        console.log("connected", this.device.state.info.productIdentifier);
        resolve();
      });
    });
    
    this.device.on('info', (a, b) => {
      console.log("info", a, b);
    });
    this.device.on('error', (a, b) => {
      console.error("error", a, b);
    });
    
    this.device.on('stateChanged', (state, pathToChange) => {
      const pgm =  _.find(this.device.state.inputs, (v, k) => v.shortName === 'PGM');
      const pvw =  _.find(this.device.state.inputs, (v, k) => v.shortName === 'PVW');

      if (pathToChange[1].indexOf('previewInput') !== -1) {
        this.externalCallbacks.onPgmPvwChange('PVW', this.device.listVisibleInputs('preview'));
      } else if (pathToChange[1].indexOf('programInput') !== -1) {
        this.externalCallbacks.onPgmPvwChange('PGM', this.device.listVisibleInputs('program'));
      } else {
        console.log("stateChanged", pathToChange);
      }
    });
  }

  async connect() {
    await this.device.connect(this.ip);
    await this._connected;
    console.log("Connected", this.device.state.info);
  }

  disconnect() {
    return this.device.disconnect();
  }

  getPgmPvwState() {
    return {
      'PVW': this.device.listVisibleInputs('preview'),
      'PGM': this.device.listVisibleInputs('program'),
    };
  }

  async changeInput(type, input) {
    const action = {
      'PGM': 'changeProgramInput',
      'PVW': 'changePreviewInput',
    }[type];

    if (!action) {
      console.error("Unknown input type:", type);
    }

    console.log("changing", action, "input to", input);
    
    return this.device[action](input);
  }

  async setFaderPosition(pos) {
    // 0 -> 10,000
    return this.device.setTransitionPosition(pos);
  }

}

module.exports = Atem;
