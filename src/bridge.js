const _                  = require('lodash');
const config             = require('./config.js');
const Atem               = require('./device/atem.js');
const MIDIControlPanel   = require('./device/midi_control_panel.js');
const atemSoftwareConfig = require('./utils/atem_software_config.js');

const main = async () => {
  let atem;
  let panel;
  let pgmPvwButtons;

  const onAtemPgmPvwChange = (type, data) => {
    const index = pgmPvwButtons.findIndex((b) => b.id == data[0]);
    if (index >= 0) {
      panel.turnonButtonInGroup(type, index);
    }
  };

  const onAtemFTBChange = (ftbState) => {
    let lightState = 'off';
    
    if (ftbState.inTransition) {
      lightState = 'on';
    } else if (ftbState.isFullyBlack) {
      lightState = 'flashing';
    }

    panel.fadeToBlackLight(lightState);
  }

  const syncState = () => {
    _.each(atem.getPgmPvwState(), (data, type) => {
      onAtemPgmPvwChange(type, data);
    });
    onAtemFTBChange(atem.getFTBState());
  };

  const onControllerReconnect = () => {
    console.log("onControllerConnect");
    syncState();
  };
  
  const onControllerButtonPress = async (group, name) => {
    switch (group) {
      case 'PGM':
      case 'PVW':
        const btnNum = Number(name);
        if (_.isFinite(btnNum)) {
          const btnId = pgmPvwButtons[name - 1]?.id;
          if (btnId) {
            await atem.changeInput(group, btnId);
          }
        }
        break;
      case 'transition':
        await atem.transition(name);
        break;
    }
  };

  const onControllerFader = async (name, value) => {
    switch (name) {
      case 'transition':
        await atem.setFaderPosition(value);
        break;
    }
  };

  panel = new MIDIControlPanel(config.midiDevice, {
    onButtonPress: onControllerButtonPress,
    onFader:       onControllerFader,
    onReconnect:   onControllerReconnect,
  });
  atem = new Atem(config.atemIP, {
    onPgmPvwChange: onAtemPgmPvwChange,
    onFTBChange:    onAtemFTBChange,
  });
  await atem.connect();
  pgmPvwButtons = await atemSoftwareConfig.buttonOrder();

  syncState();
};

main();
