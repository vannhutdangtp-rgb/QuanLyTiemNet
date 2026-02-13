const express = require("express");
const router = express.Router();

const controller = require("../controllers/goiDichVuController");

router.get("/", controller.getAll);

/* Nhân viên xử lý đơn */
router.put("/:id/status", controller.updateStatus);

module.exports = router;
