const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('./logger');

const transport = config.smtpUrl ? nodemailer.createTransport(config.smtpUrl) : null;

/** True when emails are only printed to the API console (local development). */
const devMode = !transport;

/** Send an email, or print it to the API log when SMTP_URL is not set. */
async function send({ to, subject, text }) {
  if (transport) {
    await transport.sendMail({ from: config.mailFrom, to, subject, text });
    return;
  }
  logger.info({ to, subject }, `\n📧 Email (SMTP_URL not set, printed instead)\n${text}\n`);
}

module.exports = { send, devMode };
