const KhuyenMai = require("../models/khuyenMaiModel");

/* GET ALL */
exports.getAll = async (req, res) => {
  try {
    res.json(await KhuyenMai.getAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* CREATE */
exports.create = async (req, res) => {
  try {
    res.json(await KhuyenMai.create(req.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* UPDATE */
exports.update = async (req, res) => {
  try {
    res.json(await KhuyenMai.update(req.params.id, req.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* DELETE */
exports.remove = async (req, res) => {
  try {
    res.json(await KhuyenMai.remove(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
