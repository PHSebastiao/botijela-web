import express from "express";
import { isAuthenticated, isNotAuthenticated } from "../middleware/auth.js";
import { getAndClearToasts, addError, addSuccess } from "../utils/toast.js";
import InternalApiService from "../services/InternalApiService.js";

const router = express.Router();

router.get("/login", isNotAuthenticated, (req, res) => {
  const toasts = getAndClearToasts(req);

  res.render("login", {
    title: "Botijela - Login",
    activePage: "login",
    layout: "initial",
    toasts,
  });
});

router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) console.error("Logout error:", err);
    req.session.destroy((err) => {
      res.clearCookie("connect.sid");
      res.redirect("/login");
    });
  });
});

router.get("/", isAuthenticated, (req, res) => {
  const toasts = getAndClearToasts(req);
  res.render("home", { title: "Botijela", activePage: "home", toasts });
});

router.post("/join", isAuthenticated, async (req, res) => {
  try {
    const result = await InternalApiService.joinChannel(
      res.locals.managing.username,
      { user: req.user.username }
    );
    addSuccess(req, result.message);
    res.redirect("/");
  } catch (error) {
    console.error("Error joining channel:", error);
    addError(req, error.message || "Failed to join channel");
    res.redirect("/");
  }
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

router.get("/api/manageable", isAuthenticated, async (req, res) => {
  try {
    const manageable = await InternalApiService.getModeratedChannels(
      req.user.userId
    );
    res.json({ manageable });
  } catch (error) {
    console.error("Error fetching manageable channels:", error);
    res.status(500).json({ error: "Failed to fetch manageable channels" });
  }
});

export default router;
