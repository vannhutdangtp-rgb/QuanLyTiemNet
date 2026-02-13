const express = require("express");
const router = express.Router();
const controller = require("../controllers/caLamViecController");

router.get("/", controller.getAll);
router.get("/search", controller.search);

router.post("/start", controller.startShift);
router.post("/end", controller.endShift);

module.exports = router;
