const _        = require('lodash');
const exec     = require('child_process').exec;
const fs       = require('fs/promises');
const path     = require('path');
const util     = require('util');
const xml2json = require('xml2json');

const xml2jsonOptions = {
  object       : true,
  arrayNotation: true,
  coerce       : false,
  sanitize     : false,
  reversible   : true,
};

const paths = {
  win32: async () => {
    const { stdout } = await util.promisify(exec)(`powershell -Command "[Environment]::GetFolderPath('MyDocuments')"`);
    return stdout.trim();
  },
  darwin: async () => '~/Documents',
};

const getAtemAutosavePath = async () => {
  const docPath = await paths[process.platform]();

  return path.join(docPath, 'ATEM\ Autosave');
};

const getNewestConfigPath = async () => {
  const autosavePath = await getAtemAutosavePath();
  const dirs = (await fs.readdir(autosavePath, { withFileTypes: true }))
                 .filter((f) => f.isDirectory())
                 .map((f) => f.name)
                 .sort();

  const newestDir = path.join(autosavePath, _.last(dirs));

  const files = (await fs.readdir(newestDir, { withFileTypes: true }))
                  .filter((f) => f.isFile())
                  .map((f) => f.name)
                  .filter((f) => f.endsWith('.xml'))
                  .sort();

  return path.join(newestDir, _.last(files));
};

const readXMLFile = async (filePath) => {
  const contents = await fs.readFile(filePath, 'utf8');

  return xml2json.toJson(contents, xml2jsonOptions);
};

const buttonOrder = async () => {
  const configPath = await getNewestConfigPath();
  const data       = await readXMLFile(configPath);

  const rawButtons = _.get(data, 'Profile[0].Settings[0].ButtonMapping[0].Button');
  const buttons    = _.sortBy(rawButtons, (b) => parseInt(b.index));

  const rawInputs  = _.get(data, 'Profile[0].Settings[0].Inputs[0].Input');
  const inputs     = _.sortBy(rawInputs, (b) => parseInt(b.index));

  if (_.isEmpty(buttons) || _.isEmpty(inputs)) {
    throw new Error("ATEMP config not found");
  }

  return buttons.map((b) => inputs[b.externalInputIndex] ).filter(b => b);
};

module.exports = {
  buttonOrder,
}
