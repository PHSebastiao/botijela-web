import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import configurePassport from "../config/passport.js";
import InternalApiService from "../services/InternalApiService.js";
import { addError } from "../utils/toast.js";

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
    res.locals.partyKitHost = config.partykit?.host || null;
    res.locals.sessionId = req.cookies.socket_session_id;

    if (!req.user) {
      // Not authenticated, skip managing logic
      res.locals.managing = null;
      res.locals.managingSelf = true;
      res.locals.manageable = null;
      return next();
    }

    try {
      const username = req.user.username;
      const managingCookie = req.cookies.managing;

      // Get manageable channels
      res.locals.manageable = await InternalApiService.getModeratedChannels(
        req.user.userId
      );

      let managingUser = username;
      let managingSelf = true;

      if (
        managingCookie &&
        managingCookie !== username &&
        res.locals.manageable &&
        (res.locals.manageable
          .map((user) => user.name)
          .includes(managingCookie) ||
          req.user.username == "brejelinha")
      ) {
        // User is allowed to manage this channel
        managingUser = managingCookie;
        managingSelf = false;
      }

      // Get managed channel info
      res.locals.managing = await InternalApiService.getManagedChannelInfo(
        managingUser
      );
      res.locals.managingSelf = managingSelf;

      // Set cookie if needed
      if (req.cookies.managing !== managingUser) {
        res.cookie("managing", managingUser, {
          httpOnly: false,
          sameSite: "lax",
        });
      }
    } catch (err) {
      // Handle errors gracefully
      res.locals.managing = null;
      res.locals.managingSelf = true;
      res.locals.manageable = null;
      console.error("Error in managing middleware:", err);
      req.session.destroy((err) => {
        res.clearCookie("connect.sid");
        addError("Error in session, please login again.")
        res.redirect("/login");
      });
    }
    next();
  });
};
