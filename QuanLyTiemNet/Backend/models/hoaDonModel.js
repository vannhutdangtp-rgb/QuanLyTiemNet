const db = require("../config/db.config");

/* ===============================
   GET ALL HÓA ĐƠN
================================ */
exports.getAll = async () => {
  const pool = await db.getConnection();
  const result = await pool.request().query(`
  SELECT 
    MaHD,
    MaKH,
    MaNV,
    LoaiHoaDon,
    TongTien,
    CONVERT(varchar, ThoiGianLap, 120) AS ThoiGianLap
  FROM HoaDon
  ORDER BY ThoiGianLap DESC
`);

  return result.recordset;
};

/* ===============================
   SEARCH HÓA ĐƠN
================================ */
exports.search = async (keyword) => {
  const pool = await db.getConnection();
  const result = await pool.request()
    .input("kw", `%${keyword}%`)
    .query(`
      SELECT * FROM HoaDon
      WHERE MaHD LIKE @kw OR MaKH LIKE @kw
    `);

  return result.recordset;
};

/* ===============================
   GET HÓA ĐƠN THEO MÃ
================================ */
exports.getByMaHD = async (MaHD) => {
  const pool = await db.getConnection();
  const result = await pool.request()
    .input("MaHD", MaHD)
    .query(`SELECT * FROM HoaDon WHERE MaHD=@MaHD`);

  return result.recordset[0];
};

/* ===============================
   GET CHI TIẾT HÓA ĐƠN
================================ */
exports.getChiTiet = async (MaHD) => {
  const pool = await db.getConnection();
  const result = await pool.request()
    .input("MaHD", MaHD)
    .query(`
      SELECT * FROM ChiTietHoaDon
      WHERE MaHD=@MaHD
    `);

  return result.recordset;
};
