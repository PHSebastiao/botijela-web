export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.passport && req.session.passport.user && res.locals.managing) {
    return next();
  }
  res.redirect('/login');
};

export const isNotAuthenticated = (req, res, next) => {
  if (!req.user) {
    return next();
  }
  res.redirect('/');
};

