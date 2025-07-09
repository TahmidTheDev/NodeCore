// middleware/sanitizeMongo.js
const sanitizeMongo = (obj) => {
  if (typeof obj !== 'object' || obj === null) return;

  for (const key in obj) {
    // Remove any key starting with $ or containing dot .
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeMongo(obj[key]);
    }
  }
};

const sanitizeMongoMiddleware = (req, res, next) => {
  sanitizeMongo(req.body);
  sanitizeMongo(req.query);
  sanitizeMongo(req.params);
  next();
};

export default sanitizeMongoMiddleware;
