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
exports.updateStatus = async (MaGoi, TrangThai) => {
  const pool = await db.getConnection();

  await pool.request()
    .input("MaGoi", MaGoi)
    .input("TrangThai", TrangThai)
    .query(`
      UPDATE GoiDichVu
      SET TrangThai = @TrangThai
      WHERE MaGoi = @MaGoi
    `);

  return { message: "Cập nhật trạng thái thành công" };
};
