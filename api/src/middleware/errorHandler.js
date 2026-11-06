const { AppError } = require('../lib/errors');
const logger = require('../lib/logger');

const PG_ERRORS = {
  '23P01': [
    409,
    'CONFLICT',
    'This slot has just been booked by someone else. Please pick another.',
  ],
  23505: [409, 'CONFLICT', 'A record with these values already exists.'],
  23503: [400, 'VALIDATION_ERROR', 'Referenced record does not exist.'],
};

module.exports = function errorHandler(err, req, res, _next) {
  if (err instanceof AppError)
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details, requestId: req.id },
    });
  if (err.status === 413 || err.type === 'entity.too.large')
    return res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body must be smaller than 100 KB',
        requestId: req.id,
      },
    });
  if (err.type === 'entity.parse.failed')
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Malformed JSON body', requestId: req.id },
    });
  if (err.status === 413 || err.type === 'entity.too.large')
    return res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body must be smaller than 100 KB',
        requestId: req.id,
      },
    });
  if (PG_ERRORS[err.code]) {
    const [status, code, message] = PG_ERRORS[err.code];
    return res.status(status).json({ error: { code, message, requestId: req.id } });
  }
  (req.log || logger).error({ err }, 'Unhandled request error');
  return res
    .status(500)
    .json({ error: { code: 'INTERNAL', message: 'Something went wrong', requestId: req.id } });
};
