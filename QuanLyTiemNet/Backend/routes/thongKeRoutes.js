const express = require("express");
const router = express.Router();

const ThongKeController = require("../controllers/ThongKeController");

router.get("/doanhthu-hoadon", ThongKeController.getDoanhThuHoaDon);

module.exports = router;
