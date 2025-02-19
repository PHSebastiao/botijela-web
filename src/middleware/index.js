import logger from "morgan";
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
    app.use(logger("dev"));
  }

  configureSecurity(app);
  configureStatic(app);
  configureSession(app, config);
};
