const express = require("express");
const router = express.Router();

const dichVuController = require("../controllers/dichVuController");

router.get("/", dichVuController.getAll);
router.get("/search", dichVuController.search);
router.get("/refresh", dichVuController.refresh);
router.get("/:id", dichVuController.getById);
router.post("/", dichVuController.create);
router.put("/:id", dichVuController.update);
router.delete("/:id", dichVuController.remove);

module.exports = router;
