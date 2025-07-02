import express from "express";
import { isAuthenticated, isNotAuthenticated } from "../middleware/auth.js";
import InternalApiService from "../services/InternalApiService.js";

const router = express.Router();

router.get("/login", isNotAuthenticated, (req, res) => {
  res.render("login", { title: "Botijela - Login", layout: false });
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
  res.render("home", { title: "Botijela", activePage: "home" });
});

router.get("/queue", isAuthenticated, async (req, res) => {
  try {
    let queues = await InternalApiService.getQueueList(
      res.locals.managing.username
    );
    const toast = req.session.toast;
    delete req.session.toast;
    res.render("queue", {
      title: req.t("sidebar.queues"),
      activePage: "queue",
      queues: queues,
      toast: toast,
    });
  } catch (error) {
    console.error("Error fetching queue list:", error);
    req.session.toast = {
      type: "danger",
      message: error.message || req.t("other.fetch_error"),
    };
    return res.redirect("/");
  }
});

router.post("/queue", isAuthenticated, async (req, res) => {
  try {
    await InternalApiService.createQueue(res.locals.managing.username, {
      username: res.locals.managing.username,
      userId: res.locals.managing.userId,
      queueName: req.body.queueName,
      queueDescription: req.body.queueDescription,
      queueSeparator: req.body.queueSeparator || "/",
      silentActions: req.body.silentActions == "on" || false,
      lng: res.locals.resolvedLanguage,
    });
    req.session.toast = {
      type: "success",
      message: req.t("queues.create_success"),
    };
    res.redirect("/queue");
  } catch (error) {
    console.error("Error creating queue:", error);
    req.session.toast = {
      type: "danger",
      message: error.message || req.t("queues.create_error"),
    };
    return res.redirect("/queue");
  }
});

router.get("/options", isAuthenticated, (req, res) => {
  try {
    res.render("options", {
      title: req.t("sidebar.options"),
      activePage: "options",
    });
  } catch (error) {
    console.error("Error rendering options page:", error);
    req.session.toast = {
      type: "danger",
      message: error.message || req.t("other.fetch_error"),
    };
    return res.redirect("/");
  }
});

export default router;
