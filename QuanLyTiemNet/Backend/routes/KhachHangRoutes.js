const express = require("express");
const router = express.Router();

const KhachHangController = require("../controllers/KhachHangController");

router.get("/", KhachHangController.getAll);
router.get("/:id", KhachHangController.getById);
router.post("/", KhachHangController.create);
router.put("/:id", KhachHangController.update);
router.delete("/:id", KhachHangController.delete);

module.exports = router;
