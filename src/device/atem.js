const _              = require('lodash');
const atemConnection = require('atem-connection');
const chalk          = require('chalk');

class Atem {
  #ip
  #externalCallbacks
  #device
  #connected

  constructor(ip, externalCallbacks = {}) {
    this.#ip = ip;
    this.#externalCallbacks = _.defaults(externalCallbacks, {
      onPgmPvwChange:  (() => {}),
      onFTBChange: (() => {}),
    });
    this.#device = new atemConnection.Atem();
    this.#connected = new Promise((resolve, reject) => {
      this.#device.on('connected', () => {
        resolve();
      });
    });
    
    this.#device.on('info', (what) => {
      if (what !== 'reconnect') {
        console.log("ATEM info", what);
      }
    });
    this.#device.on('error', (what) => {
      console.error(chalk.red(`ATEM error: ${what}`));
    });
    
    this.#device.on('stateChanged', (state, allChanges, val) => {
      const pgm =  _.find(this.#device.state.inputs, (v, k) => v.shortName === 'PGM');
      const pvw =  _.find(this.#device.state.inputs, (v, k) => v.shortName === 'PVW');

      const changes = _.without(allChanges, 'info.lastTime');

      changes.forEach((change) => {
        if (change.indexOf('previewInput') !== -1) {
          this.#externalCallbacks.onPgmPvwChange('PVW', this.#device.listVisibleInputs('preview'));
        } else if (change.indexOf('programInput') !== -1) {
          this.#externalCallbacks.onPgmPvwChange('PGM', this.#device.listVisibleInputs('program'));
        } else if (change.indexOf('fadeToBlack') !== -1) {
          this.#externalCallbacks.onFTBChange(this.#device.state.video.mixEffects[0].fadeToBlack);
        } else if (change.indexOf('transitionPosition') !== -1) {
          // supress logs
        } else {
          console.log("stateChanged", change);
        }
      });
    });
  }

  async connect() {
    await this.#device.connect(this.#ip);
    await this.#connected;
    console.log(chalk.green(`Connected to ${this.#device.state.info.productIdentifier}`));
  }

  disconnect() {
    return this.#device.disconnect();
  }

  getPgmPvwState() {
    return {
      'PVW': this.#device.listVisibleInputs('preview'),
      'PGM': this.#device.listVisibleInputs('program'),
    };
  }

  getFTBState() {
    return this.#device.state.video.mixEffects[0].fadeToBlack;
  }

  async changeInput(type, input) {
    const action = {
      'PGM': 'changeProgramInput',
      'PVW': 'changePreviewInput',
    }[type];

    if (!action) {
      console.error("Unknown input type:", type);
    }

    // console.log(` ${type} -> ${input}`);
    
    return this.#device[action](input);
  }

  setFaderPosition(pos) {
    // 0 -> 10,000
    return this.#device.setTransitionPosition(pos);
  }

  transition(type) {
    switch (type) {
      case 'cut':
        return this.#device.cut();
      case 'auto':
        return this.#device.autoTransition(0);
      case 'ftb':
        return this.#device.fadeToBlack();
    }
  }

}

module.exports = Atem;
