const config             = require('./config.js');
const Atem               = require('./device/atem.js');
const MIDIControlPanel   = require('./device/midi_control_panel.js');
const atemSoftwareConfig = require('./utils/atem_software_config.js');

//const panel = new MIDIControlPanel(config.midiDevice);
//const atem  = new Atem(config.atemIP);

const main = async () => {
  const buttons = await atemSoftwareConfig.buttonOrder();
  console.log(buttons);
};

main();
