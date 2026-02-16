const ThongKeModel = require("../models/ThongKeModel");

exports.getDoanhThuHoaDon = async (req, res) => {
  try {
    const { from, to } = req.query;

    const danhSach = await ThongKeModel.getHoaDon(from, to);
    const tong = await ThongKeModel.getTongDoanhThu(from, to);
    const chart = await ThongKeModel.getChart(from, to);

    res.json({
      danhSach,
      tongDoanhThu: tong.TongDoanhThu || 0,
      chart,
    });
  } catch (err) {
    console.log("❌ ERROR thống kê:", err);
    res.status(500).json({ message: "Lỗi thống kê doanh thu" });
  }
};
