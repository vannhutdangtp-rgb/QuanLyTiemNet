const express = require("express");
const router = express.Router();

const controller = require("../controllers/napTienController");

router.get("/", controller.getAll);
router.post("/", controller.create);
router.put("/:MaNap", controller.update);
router.delete("/:MaNap", controller.delete);

module.exports = router;
