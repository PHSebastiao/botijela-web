import logger from "morgan";
import { i18nextMiddleware, preserveLanguageMiddleware } from "./i18next.js";
import { configureSecurity } from "./security.js";
import { configureSession } from "./session.js";
import { configureStatic } from "./static.js";

export const configureMiddleware = (app, config) => {
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
    app.use(
      logger("combined", {
        skip: (req, res) => res.statusCode < 400,
      })
    );
  } else {
    app.use(
      logger("dev", {
        skip: (req) => req.url.startsWith("/favicon"),
      })
    );
  }

  app.use((req, res, next) => {
    if (req.cookies && ["pt-BR", "en", "es"].includes(req.cookies.i18next)) {
      res.clearCookie("i18next", { path: "/" });
      delete req.cookies.i18next;
    }
    next();
  });

  configureSecurity(app);
  configureStatic(app);
  configureSession(app, config);

  app.use(preserveLanguageMiddleware);
  app.use(i18nextMiddleware);
};
