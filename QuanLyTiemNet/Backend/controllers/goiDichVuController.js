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
    res.json(await GoiDichVu.updateStatus(req.params.id, TrangThai));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
