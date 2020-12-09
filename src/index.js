

process.on('SIGINT', () => {
  panel.close();
  process.exit();
});

//setTimeout((() => panel.close()), 5000);
