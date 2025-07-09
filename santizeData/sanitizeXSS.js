import xss from 'xss';

const sanitizeXSS = (obj) => {
  if (typeof obj !== 'object' || obj === null) return;

  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = xss(obj[key]); // sanitize string inputs
    } else if (typeof obj[key] === 'object') {
      sanitizeXSS(obj[key]);
    }
  }
};

const sanitizeXSSMiddleware = (req, res, next) => {
  sanitizeXSS(req.body);
  sanitizeXSS(req.query);
  sanitizeXSS(req.params);
  next();
};

export default sanitizeXSSMiddleware;
