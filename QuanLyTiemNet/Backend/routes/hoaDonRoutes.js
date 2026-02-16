const express = require("express");
const router = express.Router();

const hoaDonController = require("../controllers/hoaDonController");

router.get("/", hoaDonController.getAll);

router.get("/search", hoaDonController.search);

router.get("/export/:MaHD", hoaDonController.exportPDF);

module.exports = router;
