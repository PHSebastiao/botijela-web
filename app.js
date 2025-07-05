import express from "express";
import { engine } from "express-handlebars";

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import config from "./src/config/index.js";
import {
  errorHandler,
  notFoundHandler,
} from "./src/middleware/errorHandler.js";
import { configureMiddleware } from "./src/middleware/index.js";
import authRoutes from "./src/routes/auth.js";
import routes from "./src/routes/index.js";
import queueRoutes from "./src/routes/queue.js";

const app = express();

configureMiddleware(app, config);
app.engine(
  "handlebars",
  engine({
    defaultLayout: "main",
    helpers: {
      eq: (a, b) => a === b,
      array: (...args) => args.slice(0, -1),
      object: function () {
        const args = Array.from(arguments);
        const options = args.pop();
        const obj = {};
        for (let i = 0; i < args.length; i += 2) {
          obj[args[i]] = args[i + 1];
        }
        return obj;
      },
      t: function () {
        // Handlebars passes (key, options)
        const args = Array.from(arguments);
        const options = args.pop();
        const key = args[0];
        // options.hash contains named parameters
        if (typeof options.data.root.t === "function") {
          return options.data.root.t(key, options.hash);
        }
        return key;
      },
    },
  })
);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "src/views"));

app.use((req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    'payment=(self "https://ko-fi.com" "https://storage.ko-fi.com")'
  );
  next();
});

app.use("/", routes);
app.use("/queue", queueRoutes);
app.use("/auth", authRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const server = app
  .listen(config.port, config.host, () => {
    console.log(`Server is running on [${config.host}]:${config.port}`);
  })
  .on("error", (error) => {
    console.error("Server failed to start:", error);
    process.exit(1);
  });

const gracefulShutdown = async (signal) => {
  const shutdownTimeout = 30000;
  const forceShutdownTimer = setTimeout(() => {
    console.error(
      `Shutting down by ${signal}; Forcing shutdown after ${shutdownTimeout}ms`
    );
    process.exit(1);
  }, shutdownTimeout);

  try {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    clearTimeout(forceShutdownTimer);
    console.log("Server shutdown complete");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
