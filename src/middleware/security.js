import compression from "compression";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10000, // 10000 requests per windowMs
  skip: (req) => 
    req.url.startsWith("/favicon") ||
    req.url.startsWith("/js/") ||
    req.url.startsWith("/css/") ||
    req.url.startsWith("/images/") 
});


export const configureSecurity = (app) => {
  app.use(compression());
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'", "https://ko-fi.com/"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://storage.ko-fi.com/", "https://ko-fi.com/"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://storage.ko-fi.com", "https://fonts.googleapis.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com/"],
        },
      },
    })
  );

  app.use(limiter);
};
