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
    }
  };

  const onFader = async (name, value) => {
    switch (name) {
      case 'transition':
        console.log("onFader", name, value);
        await atem.setFaderPosition(value);
    }
  };

  const syncState = () => {
    _.each(atem.getPgmPvwState(), (data, type) => {
      onAtemPgmPvwChange(type, data);
    });
  };
  
  panel = new MIDIControlPanel(config.midiDevice, { onControllerButtonPress, onFader });
  atem  = new Atem(config.atemIP, { onPgmPvwChange: onAtemPgmPvwChange });
  await atem.connect();
  pgmPvwButtons = await atemSoftwareConfig.buttonOrder();
  syncState();
  
  console.log(pgmPvwButtons);
};

main();
