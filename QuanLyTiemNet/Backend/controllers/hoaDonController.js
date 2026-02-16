const HoaDonModel = require("../models/hoaDonModel");
const PDFDocument = require("pdfkit");
const path = require("path");

/* ===============================
   GET ALL
================================ */
exports.getAll = async (req, res) => {
  try {
    res.json(await HoaDonModel.getAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===============================
   SEARCH
================================ */
exports.search = async (req, res) => {
  try {
    res.json(await HoaDonModel.search(req.query.keyword));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===============================
   EXPORT PDF HÓA ĐƠN (BẢNG ĐẸP)
================================ */
exports.exportPDF = async (req, res) => {
  try {
    const { MaHD } = req.params;

    // ===============================
    // LẤY HÓA ĐƠN + CHI TIẾT
    // ===============================
    const hoaDon = await HoaDonModel.getByMaHD(MaHD);
    const chiTiet = await HoaDonModel.getChiTiet(MaHD);

    if (!hoaDon) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn!" });
    }

    // ===============================
    // PDF SETUP
    // ===============================
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=HoaDon_${MaHD}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // ===============================
    // FONT ROBOTO TIẾNG VIỆT
    // ===============================
    const fontPath = path.join(__dirname, "../fonts/Roboto-Regular.ttf");
    doc.registerFont("Roboto", fontPath);
    doc.font("Roboto");

    // ===============================
    // HEADER
    // ===============================
    doc.fontSize(22).text("HÓA ĐƠN THANH TOÁN", { align: "center" });

    doc.moveDown();
    doc.fontSize(12).text("TIỆM NET - QUẢN LÝ PHÒNG MÁY", {
      align: "center",
    });

    doc.moveDown();
    doc.text("==========================================", {
      align: "center",
    });

    doc.moveDown(1);

    // ===============================
    // THÔNG TIN HÓA ĐƠN
    // ===============================
    doc.fontSize(14).text(`Mã hóa đơn: ${hoaDon.MaHD}`);
    doc.text(`Khách hàng : ${hoaDon.MaKH}`);
    doc.text(`Nhân viên  : ${hoaDon.MaNV}`);
    doc.text(`Loại hóa đơn: ${hoaDon.LoaiHoaDon}`);

    doc.moveDown();

    doc.text(
      `Thời gian lập: ${new Date(hoaDon.ThoiGianLap).toLocaleString("vi-VN")}`
    );

    doc.moveDown(1);

    // ===============================
    // BẢNG CHI TIẾT (ĐẸP)
    // ===============================
    doc.fontSize(15).text("CHI TIẾT HÓA ĐƠN", { underline: true });
    doc.moveDown(1);

    // Table config
    const tableTop = doc.y;
    const itemHeight = 25;

    // Column positions
    const col1 = 50;   // STT
    const col2 = 100;  // Loại
    const col3 = 300;  // SL
    const col4 = 380;  // Thành tiền

    // HEADER TABLE
    doc.fontSize(12).text("STT", col1, tableTop);
    doc.text("Dịch vụ", col2, tableTop);
    doc.text("Số lượng", col3, tableTop);
    doc.text("Thành tiền", col4, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // DATA ROWS
    let y = tableTop + 25;

    chiTiet.forEach((item, index) => {
      doc.text(index + 1, col1, y);
      doc.text(item.LoaiChiTiet, col2, y);
      doc.text(item.SoLuong, col3, y);
      doc.text(
        Number(item.ThanhTien).toLocaleString("vi-VN") + " VND",
        col4,
        y
      );

      y += itemHeight;
    });

    doc.moveDown(2);

    // ===============================
    // TỔNG TIỀN
    // ===============================
    const tong = chiTiet.reduce(
      (sum, x) => sum + Number(x.ThanhTien),
      0
    );

    doc.moveDown();
    doc.fontSize(14).text(
      `TỔNG TIỀN: ${tong.toLocaleString("vi-VN")} VND`,
      { align: "right" }
    );

    doc.moveDown(2);

    // ===============================
    // FOOTER
    // ===============================
    doc.text("==========================================", {
      align: "center",
    });

    doc.moveDown();

    doc.fontSize(12).text("Cảm ơn quý khách đã sử dụng dịch vụ!", {
      align: "center",
    });

    doc.text("Hẹn gặp lại ❤️", { align: "center" });

    doc.end();
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Lỗi xuất PDF hóa đơn" });
  }
};
