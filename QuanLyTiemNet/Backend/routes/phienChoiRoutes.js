const express = require("express");
const router = express.Router();
const c = require("../controllers/phienChoiController");

router.get("/status", c.getStatus);
router.get("/khach", c.getKhach);

router.post("/start", c.start);
router.post("/begin-login", c.beginWhenLogin);
router.post("/logout", c.logout);
router.put("/stop/:id", c.stop);

module.exports = router;
