import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 1000 // 1000 requests per windowMs
});


export const configureSecurity = (app) => {
  app.use(compression());
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
        },
      },
    })
  );

  app.use(limiter);
};
