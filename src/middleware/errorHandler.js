import createError from 'http-errors';

export const notFoundHandler = (req, res, next) => {
  next(createError(404));
};
export const errorHandler = (err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.locals.status = err.status || 500;

  res.status(err.status || 500);
  res.render('error', { layout: false });
};