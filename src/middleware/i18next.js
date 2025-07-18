import i18next from "i18next";
import Backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: "pt",
    preload: ["en", "pt", "es"],
    backend: {
      loadPath: path.join(__dirname, "../locales/{{lng}}.json"),
    },
    detection: {
      order: ["querystring", "cookie", "navigator"],
      caches: ["cookie", "session"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;
export const i18nextMiddleware = middleware.handle(i18next);

export const preserveLanguageMiddleware = (req, res, next) => {
  // Store current language in session before authentication redirects
  if (req.cookies.i18next && !req.session.language) {
    req.session.language = req.cookies.i18next;
  }
  
  // Restore language after authentication if it was lost
  if (req.session.language && !req.cookies.i18next) {
    res.cookie("i18next", req.session.language, {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
    });
  }
  
  next();
};