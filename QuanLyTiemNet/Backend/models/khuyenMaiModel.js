const db = require("../config/db.config");

/* ===========================
   AUTO UPDATE TRẠNG THÁI
   Nếu hôm nay > NgayKetThuc → DaHet
   Ngược lại → VanCon
=========================== */
async function autoUpdateTrangThai() {
  const pool = await db.getConnection();

  await pool.request().query(`
    UPDATE KhuyenMai
    SET TrangThai =
      CASE
        WHEN GETDATE() > NgayKetThuc THEN N'DaHet'
        ELSE N'VanCon'
      END
  `);
}

/* ===========================
   GET ALL KHUYẾN MÃI
=========================== */
exports.getAll = async () => {
  await autoUpdateTrangThai();

  const pool = await db.getConnection();

  const result = await pool.request().query(`
    SELECT * FROM KhuyenMai
    ORDER BY NgayBatDau DESC
  `);

  return result.recordset;
};

/* ===========================
   CREATE KHUYẾN MÃI
=========================== */
exports.create = async (data) => {
  const pool = await db.getConnection();

  await pool.request()
    .input("MaKM", data.MaKM)
    .input("TenKM", data.TenKM)
    .input("PhanTramTang", data.PhanTramTang)
    .input("NgayBatDau", data.NgayBatDau)
    .input("NgayKetThuc", data.NgayKetThuc)
    .query(`
      INSERT INTO KhuyenMai(MaKM, TenKM, PhanTramTang, NgayBatDau, NgayKetThuc, TrangThai)
      VALUES (
        @MaKM,
        @TenKM,
        @PhanTramTang,
        @NgayBatDau,
        @NgayKetThuc,
        CASE
          WHEN GETDATE() > @NgayKetThuc THEN N'DaHet'
          ELSE N'VanCon'
        END
      )
    `);

  return { message: "Thêm khuyến mãi thành công" };
};

/* ===========================
   UPDATE KHUYẾN MÃI
=========================== */
exports.update = async (MaKM, data) => {
  const pool = await db.getConnection();

  await pool.request()
    .input("MaKM", MaKM)
    .input("TenKM", data.TenKM)
    .input("PhanTramTang", data.PhanTramTang)
    .input("NgayBatDau", data.NgayBatDau)
    .input("NgayKetThuc", data.NgayKetThuc)
    .query(`
      UPDATE KhuyenMai
      SET TenKM=@TenKM,
          PhanTramTang=@PhanTramTang,
          NgayBatDau=@NgayBatDau,
          NgayKetThuc=@NgayKetThuc,
          TrangThai =
            CASE
              WHEN GETDATE() > @NgayKetThuc THEN N'DaHet'
              ELSE N'VanCon'
            END
      WHERE MaKM=@MaKM
    `);

  return { message: "Cập nhật thành công" };
};

/* ===========================
   DELETE
=========================== */
exports.remove = async (MaKM) => {
  const pool = await db.getConnection();

  await pool.request()
    .input("MaKM", MaKM)
    .query(`DELETE FROM KhuyenMai WHERE MaKM=@MaKM`);

  return { message: "Xóa khuyến mãi thành công" };
};
