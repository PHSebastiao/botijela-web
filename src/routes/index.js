import express from "express";
import { isAuthenticated, isNotAuthenticated } from "../middleware/auth.js";
import { getAndClearToasts, addError } from "../utils/toast.js";

const router = express.Router();

router.get("/login", isNotAuthenticated, (req, res) => {
  res.render("login", { title: "Botijela - Login", activePage: "login", layout: "initial" });
});

router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) console.error("Logout error:", err);
    req.session.destroy((err) => {
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
});

router.get("/", isAuthenticated, (req, res) => {
  const toasts = getAndClearToasts(req);
  res.render("home", { title: "Botijela", activePage: "home", toasts });
});

router.get("/options", isAuthenticated, (req, res) => {
  try {
    const toasts = getAndClearToasts(req);
    res.render("options", {
      title: req.t("sidebar.options"),
      activePage: "options",
      toasts,
    });
  } catch (error) {
    console.error("Error rendering options page:", error);
    addError(req, error.message || req.t("other.fetch_error"));
    return res.redirect("/");
  }
});

export default router;
