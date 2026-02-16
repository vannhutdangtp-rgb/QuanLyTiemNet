const db = require("../config/db.config");

/* ===========================
   USER TẠO ĐƠN GỌI DỊCH VỤ
=========================== */
exports.createOrder = async (MaKH, MaDV, SoLuong) => {
  const pool = await db.getConnection();

  // AUTO tạo MaGoi mới
  const result = await pool.request().query(`
    SELECT TOP 1 MaGoi FROM GoiDichVu ORDER BY MaGoi DESC
  `);

  let MaGoi = "GDV01";
  if (result.recordset.length > 0) {
    let last = result.recordset[0].MaGoi;
    let num = parseInt(last.substring(3)) + 1;
    MaGoi = "GDV" + num.toString().padStart(2, "0");
  }

  // Insert đơn gọi
  await pool.request()
    .input("MaGoi", MaGoi)
    .input("MaKH", MaKH)
    .input("MaDV", MaDV)
    .input("SoLuong", SoLuong)
    .query(`
      INSERT INTO GoiDichVu(MaGoi, MaKH, MaDV, SoLuong, TrangThai, ThoiGianGoi)
      VALUES(@MaGoi, @MaKH, @MaDV, @SoLuong, N'ChoXuLy', GETDATE())
    `);

  return { message: "✅ Gọi món thành công!", MaGoi };
};
