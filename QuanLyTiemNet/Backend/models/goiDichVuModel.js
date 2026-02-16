const db = require("../config/db.config");

/* ===========================
   LẤY DANH SÁCH ĐƠN GỌI
=========================== */
exports.getAll = async () => {
  const pool = await db.getConnection();

  const result = await pool.request().query(`
    SELECT GDV.*, KH.TenKH, DV.TenDV
    FROM GoiDichVu GDV
    LEFT JOIN KhachHang KH ON GDV.MaKH = KH.MaKH
    LEFT JOIN DichVu DV ON GDV.MaDV = DV.MaDV
    ORDER BY ThoiGianGoi DESC
  `);

  return result.recordset;
};

/* ===========================
   NHÂN VIÊN CẬP NHẬT TRẠNG THÁI
=========================== */
exports.updateStatus = async (MaGoi, TrangThai, MaNV) => {
  const pool = await db.getConnection();

  const transaction = pool.transaction();
  await transaction.begin();

  try {
    console.log("📝 updateStatus Start - MaGoi:", MaGoi, "TrangThai:", TrangThai, "MaNV:", MaNV);

    // ==========================
    // 1. Update trạng thái đơn gọi
    // ==========================
    await transaction.request()
      .input("MaGoi", MaGoi)
      .input("TrangThai", TrangThai)
      .query(`
        UPDATE GoiDichVu
        SET TrangThai = @TrangThai
        WHERE MaGoi = @MaGoi
      `);
    console.log("✅ Step 1: Update GoiDichVu OK");

    // ==========================
    // 2. Nếu hoàn thành → tạo hóa đơn
    // ==========================
    // ==========================
// 2. Nếu hoàn thành → tạo hóa đơn + trừ tồn kho
// ==========================
if (TrangThai === "DaGiao") {
  console.log("📌 TrangThai = DaGiao, chuẩn bị tạo hóa đơn");

  // Lấy thông tin đơn gọi
  const goiData = await transaction.request()
    .input("MaGoi", MaGoi)
    .query(`
      SELECT GDV.*, DV.TenDV, DV.Gia, DV.TonKho
      FROM GoiDichVu GDV
      LEFT JOIN DichVu DV ON GDV.MaDV = DV.MaDV
      WHERE GDV.MaGoi = @MaGoi
    `);

  if (goiData.recordset.length === 0)
    throw new Error("Không tìm thấy đơn gọi!");

  const goi = goiData.recordset[0];

  console.log("✅ Lấy thông tin gọi:", goi.MaDV, goi.SoLuong, goi.TonKho);

  // ==========================
  // ✅ STEP TRỪ TỒN KHO
  // ==========================
  if (goi.TonKho < goi.SoLuong) {
    throw new Error(
      `❌ Dịch vụ ${goi.TenDV} không đủ tồn kho! (Còn ${goi.TonKho})`
    );
  }

  await transaction.request()
    .input("MaDV", goi.MaDV)
    .input("SoLuong", goi.SoLuong)
    .query(`
      UPDATE DichVu
      SET TonKho = TonKho - @SoLuong
      WHERE MaDV = @MaDV
    `);

  console.log("✅ Step Trừ tồn kho OK");

  // ==========================
  // Tính tiền hóa đơn
  // ==========================
  const MaKH = goi.MaKH;
  const ThanhTien = goi.SoLuong * goi.Gia;

  // ==========================
  // AUTO tạo MaHD mới
  // ==========================
  const hdResult = await transaction.request().query(`
    SELECT TOP 1 MaHD FROM HoaDon ORDER BY MaHD DESC
  `);

  let MaHD = "HD01";
  if (hdResult.recordset.length > 0) {
    let last = hdResult.recordset[0].MaHD;
    let num = parseInt(last.substring(2)) + 1;
    MaHD = "HD" + num.toString().padStart(2, "0");
  }

  // ==========================
  // Insert HoaDon
  // ==========================
  await transaction.request()
    .input("MaHD", MaHD)
    .input("MaKH", MaKH)
    .input("MaNV", MaNV)
    .input("LoaiHoaDon", "DichVu")
    .input("TongTien", ThanhTien)
    .query(`
      INSERT INTO HoaDon(MaHD, MaKH, MaNV, LoaiHoaDon, ThoiGianLap, TongTien)
      VALUES(@MaHD, @MaKH, @MaNV, @LoaiHoaDon, GETDATE(), @TongTien)
    `);

  console.log("✅ Insert HoaDon OK:", MaHD);

  // ==========================
  // AUTO tạo MaCTHD mới
  // ==========================
  const ctResult = await transaction.request().query(`
    SELECT TOP 1 MaCTHD FROM ChiTietHoaDon ORDER BY MaCTHD DESC
  `);

  let MaCTHD = "CT01";
  if (ctResult.recordset.length > 0) {
    let last = ctResult.recordset[0].MaCTHD;
    let num = parseInt(last.substring(2)) + 1;
    MaCTHD = "CT" + num.toString().padStart(2, "0");
  }

  // ==========================
  // Insert ChiTietHoaDon
  // ==========================
  await transaction.request()
    .input("MaCTHD", MaCTHD)
    .input("MaHD", MaHD)
    .input("LoaiChiTiet", "DichVu")
    .input("SoLuong", goi.SoLuong)
    .input("ThanhTien", ThanhTien)
    .query(`
      INSERT INTO ChiTietHoaDon(MaCTHD, MaHD, LoaiChiTiet, SoLuong, ThanhTien)
      VALUES(@MaCTHD, @MaHD, @LoaiChiTiet, @SoLuong, @ThanhTien)
    `);

  console.log("✅ Insert ChiTietHoaDon OK:", MaCTHD);
}


    // ==========================
    // DONE
    // ==========================
    await transaction.commit();
    console.log("✅✅✅ Transaction COMMITTED");
    return { message: "✅ Cập nhật trạng thái + tạo hóa đơn thành công!" };

  } catch (err) {
    console.error("❌ ERROR in transaction:", err.message);
    await transaction.rollback();
    throw err;
  }
};
