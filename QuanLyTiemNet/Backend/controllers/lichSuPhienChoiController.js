const lichSuModel = require("../models/lichSuPhienChoiModel");
const PDFDocument = require("pdfkit");

// GET ALL
async function getAll(req, res) {
  try {
    const data = await lichSuModel.getAllLichSu();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi load lịch sử phiên chơi" });
  }
}

// SEARCH
async function search(req, res) {
  try {
    const { keyword } = req.query;
    const data = await lichSuModel.searchLichSu(keyword || "");
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tìm kiếm phiên chơi" });
  }
}

// EXPORT PDF HÓA ĐƠN
async function exportHoaDonPDF(req, res) {
  try {
    const { maPhien } = req.params;
    const phien = await lichSuModel.getPhienByMa(maPhien);

    if (!phien) {
      return res.status(404).json({ message: "Không tìm thấy phiên chơi!" });
    }

    // =============================
    // PDF SETUP
    // =============================
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=HoaDon_${maPhien}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // =============================
    // FONT TIẾNG VIỆT (FIX LỖI)
    // =============================
    doc.registerFont("Roboto", "./fonts/Roboto-Regular.ttf");
    doc.font("Roboto");

    // =============================
    // HEADER ĐẸP
    // =============================
    doc
      .fontSize(22)
      .text("HÓA ĐƠN TIỆM NET", { align: "center" });

    doc.moveDown();
    doc
      .fontSize(12)
      .text("==========================================", {
        align: "center",
      });

    doc.moveDown(1);

    // =============================
    // THÔNG TIN PHIÊN
    // =============================
    doc.fontSize(14).text(`Mã phiên: ${phien.MaPhien}`);
    doc.text(`Khách hàng: ${phien.MaKH}`);
    doc.text(`Máy: ${phien.MaMay}`);

    doc.moveDown();

    doc.fontSize(13).text("Thời gian sử dụng:", { underline: true });
    doc.text(`Giờ login : ${phien.GioLogin}`);
    doc.text(`Giờ logout: ${phien.GioLogout || "Chưa logout"}`);

    doc.moveDown();

    // =============================
    // TIỀN THANH TOÁN
    // =============================
    // =============================
// TIỀN THANH TOÁN (FIX)
// =============================
const gia = Math.round(phien.GiaTheoGio);
const sotien = Math.round(phien.SoTienTru || 0);

doc.fontSize(13).text("Chi phí:", { underline: true });

doc.text(`Giá theo giờ : ${gia.toLocaleString("vi-VN")} VND`);
doc.text(`Số tiền trừ  : ${sotien.toLocaleString("vi-VN")} VND`);


    doc.moveDown();

    doc.fontSize(13).text(`Trạng thái: ${phien.TrangThai}`);

    doc.moveDown(2);

    // =============================
    // FOOTER
    // =============================
    doc
      .fontSize(12)
      .text("Cảm ơn quý khách đã sử dụng dịch vụ!", {
        align: "center",
      });

    doc.text("Hẹn gặp lại ❤️", { align: "center" });

    doc.end();
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Lỗi xuất hóa đơn PDF" });
  }
}

module.exports = {
  getAll,
  search,
  exportHoaDonPDF
};
