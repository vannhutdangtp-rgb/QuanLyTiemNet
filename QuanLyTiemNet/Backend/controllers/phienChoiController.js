const model = require("../models/phienChoiModel");

exports.getStatus = async (req, res) => {
  res.json(await model.getMayTinhStatus());
};

exports.getKhach = async (req, res) => {
  res.json(await model.getKhachHang());
};

exports.start = async (req, res) => {
  try {
    res.json(await model.startSession(req.body));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.stop = async (req, res) => {
  res.json(await model.stopSession(req.params.id));
};
