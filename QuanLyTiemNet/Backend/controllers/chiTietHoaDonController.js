const ChiTietHoaDon = require("../models/chiTietHoaDonModel");

/* ===============================
   GET ALL
================================ */
exports.getAll = async (req, res) => {
  try {
    res.json(await ChiTietHoaDon.getAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===============================
   SEARCH
================================ */
exports.search = async (req, res) => {
  try {
    const keyword = req.query.keyword;
    res.json(await ChiTietHoaDon.search(keyword));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
