const express = require("express");
const router = express.Router();

const controller = require("../controllers/TaiKhoanControllers");
const auth = require("../middleware/authMiddleware");

// LOGIN
router.post("/login", controller.login);


// CHECK TOKEN
router.get("/me", auth, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// CRUD
router.get("/", auth, controller.getAll);
// 🔍 SEARCH
router.get("/search", auth, controller.search);
router.post("/", auth, controller.create);
router.put("/:id", auth, controller.update);
router.delete("/:id", auth, controller.delete);

module.exports = router;
