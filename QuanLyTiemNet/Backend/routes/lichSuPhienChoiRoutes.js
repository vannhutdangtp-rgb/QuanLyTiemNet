const express = require("express");
const router = express.Router();

const controller = require("../controllers/lichSuPhienChoiController");

// Load lịch sử
router.get("/", controller.getAll);

// Tìm kiếm
router.get("/search", controller.search);

// Xuất hóa đơn PDF
router.get("/export/:maPhien", controller.exportHoaDonPDF);

module.exports = router;
