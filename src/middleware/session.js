import session from "express-session";
import cookieParser from "cookie-parser";
import passport from "passport";
import configurePassport from "../config/passport.js";

export const configureSession = (app, config) => {
  app.use(cookieParser());

  app.use(
    session({
      secret: config.session.secret,
      ...config.session.config,
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  configurePassport(
    config.twitch.clientId,
    config.twitch.clientSecret,
    config.callbacks.general,
    config.callbacks.advanced,
    config.apiUrl
  );

  app.use((req, res, next) => {
    res.locals.link = "https://" + req.hostname + req.url;
    res.locals.user = req.user || null;
    res.locals.theme = req.cookies.theme || "dark";
    next();
  });
};
