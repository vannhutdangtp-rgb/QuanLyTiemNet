const NapTien = require("../models/napTienModel");

exports.getAll = async (req, res) => {
  try {
    res.json(await NapTien.getAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    res.json(await NapTien.create(req.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    res.json(await NapTien.update(req.params.MaNap, req.body.SoTien));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    res.json(await NapTien.remove(req.params.MaNap));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
