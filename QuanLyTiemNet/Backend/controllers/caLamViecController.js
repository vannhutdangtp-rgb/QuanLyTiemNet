const CaLamViec = require("../models/caLamViecModel");

exports.getAll = async (req, res) => {
  res.json(await CaLamViec.getAll());
};

exports.search = async (req, res) => {
  res.json(await CaLamViec.search(req.query.keyword || ""));
};

exports.startShift = async (req, res) => {
  const { MaNV } = req.body;
  res.json(await CaLamViec.startShift(MaNV));

};

exports.endShift = async (req, res) => {
  const { MaNV } = req.body;
  res.json(await CaLamViec.endShift(MaNV));
};
