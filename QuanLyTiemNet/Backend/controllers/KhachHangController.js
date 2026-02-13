const KhachHangModel = require("../models/KhachHangModel");

const KhachHangController = {
  // GET ALL
  async getAll(req, res) {
    try {
      const data = await KhachHangModel.getAll();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET BY ID
  async getById(req, res) {
    try {
      const kh = await KhachHangModel.getById(req.params.id);
      res.json(kh);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // CREATE
  async create(req, res) {
    try {
      const result = await KhachHangModel.create(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // UPDATE
  async update(req, res) {
    try {
      const result = await KhachHangModel.update(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE
  async delete(req, res) {
    try {
      const result = await KhachHangModel.delete(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = KhachHangController;
