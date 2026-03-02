require('dotenv').config();

const { createApp } = require('./app');

async function start() {
  const { app, config } = await createApp();

  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}/graphql`);
  });
}

start().catch((error) => {
  console.error('Failed to start API', error);
  process.exit(1);
});
