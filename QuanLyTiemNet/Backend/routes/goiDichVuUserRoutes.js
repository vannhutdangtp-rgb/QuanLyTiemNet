const express = require("express");
const router = express.Router();

const controller = require("../controllers/goiDichVuUserController");
const authMiddleware = require("../middleware/authMiddleware");

/* USER gọi món */
router.post("/", authMiddleware, controller.createOrder);

module.exports = router;
