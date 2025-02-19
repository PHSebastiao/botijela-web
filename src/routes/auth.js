import express from "express";
import passport from "passport";

const router = express.Router();

router.get("/general", passport.authenticate("general"));
router.get(
  "/general/callback",
  passport.authenticate("general", {
    failureRedirect: "/login",
    successRedirect: "/",
  })
);

router.get("/advanced", passport.authenticate("advanced"));
router.get(
  "/advanced/callback",
  passport.authenticate("advanced", {
    failureRedirect: "/login",
    successRedirect: "/",
  })
);

export default router;
