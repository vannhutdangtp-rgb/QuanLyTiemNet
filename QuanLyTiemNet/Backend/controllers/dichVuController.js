const DichVu = require("../models/dichVuModel");

// GET ALL
exports.getAll = async (req, res) => {
  try {
    res.json(await DichVu.getAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET BY ID
exports.getById = async (req, res) => {
  try {
    res.json(await DichVu.getById(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE
exports.create = async (req, res) => {
  try {
    res.json(await DichVu.create(req.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.update = async (req, res) => {
  try {
    res.json(await DichVu.update(req.params.id, req.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
exports.remove = async (req, res) => {
  try {
    res.json(await DichVu.remove(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// SEARCH
exports.search = async (req, res) => {
  try {
    const keyword = req.query.q || req.body.keyword || "";
    res.json(await DichVu.search(keyword));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// REFRESH
exports.refresh = async (req, res) => {
  try {
    res.json(await DichVu.refresh());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
