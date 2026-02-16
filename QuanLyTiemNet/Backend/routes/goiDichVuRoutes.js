const express = require("express");
const router = express.Router();

const controller = require("../controllers/goiDichVuController");
const verifyToken = require("../middleware/authMiddleware");

router.get("/", controller.getAll);

/* Nhân viên xử lý đơn */
router.put("/:id/status", verifyToken, controller.updateStatus);

module.exports = router;
