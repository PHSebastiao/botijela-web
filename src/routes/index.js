import express from "express";
import { isAuthenticated, isNotAuthenticated } from "../middleware/auth.js";

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
  console.log(req.locals);
  res.render("home", { title: "Botijela", activePage: "home"});
});

router.get("/queue", isAuthenticated, (req, res) => {
  res.render("queue", { title: "Queue", activePage: "queue" });
});

router.get("/options", isAuthenticated, (req, res) => {
  res.render("options", { title: "Options", activePage: "options" });
});

export default router;
