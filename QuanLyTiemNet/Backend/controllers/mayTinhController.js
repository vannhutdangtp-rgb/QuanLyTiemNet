const MayTinhModel = require("../models/mayTinhModel");

exports.getAll = async (req, res) => {
  try {
    const data = await MayTinhModel.getAllMayTinh();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const data = await MayTinhModel.getMayTinhById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    console.log("DATA CLIENT:", req.body);

    await MayTinhModel.createMayTinh(req.body);

    res.json({ message: "Thêm máy thành công!" });
  } catch (err) {
    console.log("🔥 LỖI THÊM MÁY:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.update = async (req, res) => {
  try {
    await MayTinhModel.updateMayTinh(req.params.id, req.body);
    res.json({ message: "Cập nhật máy thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await MayTinhModel.deleteMayTinh(req.params.id);
    res.json({ message: "Xóa máy thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
