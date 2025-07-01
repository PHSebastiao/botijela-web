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
      order: ["cookie", "querystring", "header"],
      caches: ["cookie"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;
export const i18nextMiddleware = middleware.handle(i18next);