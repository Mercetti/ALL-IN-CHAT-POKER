const csrf = require('csrf');
const tokens = new csrf();

module.exports = {
  generate: (req, res, next) => {
    const secret = tokens.secretSync();
    const token = tokens.create(secret);
    req.session.csrfSecret = secret;
    res.locals.csrfToken = token;
    next();
  },
  verify: (req, res, next) => {
    const secret = req.session.csrfSecret;
    const token = req.body.csrfToken;
    if (!tokens.verify(secret, token)) {
      return res.status(403).send('Invalid CSRF token');
    }
    next();
  }
};
