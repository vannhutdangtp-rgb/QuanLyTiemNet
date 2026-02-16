const GoiDichVu = require("../models/goiDichVuModel");

/* GET ALL */
exports.getAll = async (req, res) => {
  try {
    res.json(await GoiDichVu.getAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* UPDATE STATUS */
exports.updateStatus = async (req, res) => {
  try {
    const { TrangThai } = req.body;

    // ✅ lấy MaNV từ tài khoản login
    const MaNV = req.user.MaTK;
    console.log("🔧 updateStatus - MaNV:", MaNV, "TrangThai:", TrangThai, "MaGoi:", req.params.id);

    const result = await GoiDichVu.updateStatus(req.params.id, TrangThai, MaNV);
    console.log("✅ DONE:", result);
    res.json(result);
  } catch (err) {
    console.error("❌ ERROR updateStatus:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({ error: err.message });
  }
};

