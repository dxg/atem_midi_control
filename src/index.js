const bridge = require('./bridge.js')();

process.on('SIGINT', async () => {
  await bridge.stop();
  process.exit(0);
});

bridge.start();
