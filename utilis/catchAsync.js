const catchAsync = (fn) => {
  return (req, res, next) => {
    // Automatically forwards errors to Express's global error handler
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;
