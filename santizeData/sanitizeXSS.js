// sanitizeXSS.js
import xss from 'xss';

const stripAllHTML = (obj) => {
  if (typeof obj !== 'object' || obj === null) return;

  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = xss(obj[key], {
        whiteList: {}, // No tags allowed at all
        stripIgnoreTag: true, // Remove all HTML tags
        stripIgnoreTagBody: ['script'], // Remove content inside <script> tags
      });
    } else if (typeof obj[key] === 'object') {
      stripAllHTML(obj[key]);
    }
  }
};

const sanitizeXSSMiddleware = (req, res, next) => {
  stripAllHTML(req.body);
  stripAllHTML(req.query);
  stripAllHTML(req.params);
  next();
};

export default sanitizeXSSMiddleware;
