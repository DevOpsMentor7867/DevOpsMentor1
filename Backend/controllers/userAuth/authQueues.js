const Bull = require("bull");
require('dotenv').config();

const REDIS_PORT = process.env.REDIS_PORT;

const queueConfig = {
  redis: { port: REDIS_PORT, host: 'localhost' }
};

module.exports = {
  registration_queue: new Bull('registration', queueConfig),
  verification_queue: new Bull('verification', queueConfig),
  login_queue: new Bull('login', queueConfig),
  logout_queue: new Bull('logout', queueConfig),
  forgot_password_queue: new Bull('forgot_password', queueConfig),
  reset_password_queue: new Bull('reset_password', queueConfig)
};

