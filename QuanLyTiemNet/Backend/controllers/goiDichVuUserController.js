const GoiDichVuUser = require("../models/goiDichVuUserModel");

/* ===========================
   USER GỌI MÓN
=========================== */
exports.createOrder = async (req, res) => {
  try {
    const { MaDV, SoLuong } = req.body;

    // ✅ lấy MaKH từ user login
    const MaKH = req.user.MaKH;

    const result = await GoiDichVuUser.createOrder(
      MaKH,
      MaDV,
      SoLuong
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
