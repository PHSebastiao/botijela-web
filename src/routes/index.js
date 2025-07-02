import express from "express";
import { isAuthenticated, isNotAuthenticated } from "../middleware/auth.js";
import InternalApiService from "../services/InternalApiService.js";
import i18next from "i18next";

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
  res.render("home", { title: "Botijela", activePage: "home"});
});

router.get("/queue", isAuthenticated, async (req, res) => {
  let queues = await InternalApiService.getQueueList(res.locals.managing.username);
  res.render("queue", { title: req.t("sidebar.queues"), activePage: "queue", queues: queues });
});

router.get("/options", isAuthenticated, (req, res) => {
  res.render("options", { title: req.t("sidebar.options"), activePage: "options" });
});

export default router;
