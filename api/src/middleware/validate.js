const { badRequest } = require('../lib/errors');

/** Parse req[source] with a zod schema; replaces it with the parsed value on req.valid[source]. */
const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      const [first] = details;
      const message =
        first.message === 'Required' && first.field ? `${first.field} is required` : first.message;
      return next(badRequest(message, details));
    }
    req.valid = { ...req.valid, [source]: result.data };
    return next();
  };

module.exports = validate;
