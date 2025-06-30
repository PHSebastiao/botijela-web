import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import configurePassport from "../config/passport.js";
import InternalApiService from "../services/InternalApiService.js";

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

  app.use(async (req, res, next) => {
    res.locals.link = "https://" + req.hostname + req.url;
    res.locals.theme = req.cookies.theme || "dark";
    res.locals.user = req.user || null;
    res.locals.manageable = req.user ? await InternalApiService.getModeratedChannels(req.user.userId) : null;
    if(res.locals.manageable && res.locals.manageable.map(user => user.name).includes(req.cookies.managing)) {
      res.locals.managing = await InternalApiService.getManagedChannelInfo(req.cookies.managing)
      res.cookie('managingSelf', false)
    } else {
      res.locals.managing = req.user ? await InternalApiService.getManagedChannelInfo(req.user.username) : null;
      res.cookie('managingSelf', true)
      req.user ? res.cookie('managing', res.locals.managing.username) : null;
    }
    next();
  });
};
