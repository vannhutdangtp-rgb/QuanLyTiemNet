const express = require("express");
const router = express.Router();

const chiTietController = require("../controllers/chiTietHoaDonController");

router.get("/", chiTietController.getAll);

router.get("/search", chiTietController.search);

module.exports = router;
