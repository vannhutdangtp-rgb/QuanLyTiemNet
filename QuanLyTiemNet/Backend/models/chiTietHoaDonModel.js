const db = require("../config/db.config");

/* ===============================
   GET ALL CHI TIẾT HÓA ĐƠN
================================ */
exports.getAll = async () => {
  const pool = await db.getConnection();

  const result = await pool.request().query(`
    SELECT * FROM ChiTietHoaDon
    ORDER BY MaHD DESC
  `);

  return result.recordset;
};

/* ===============================
   SEARCH CHI TIẾT HÓA ĐƠN
================================ */
exports.search = async (keyword) => {
  const pool = await db.getConnection();

  const result = await pool.request()
    .input("kw", `%${keyword}%`)
    .query(`
      SELECT * FROM ChiTietHoaDon
      WHERE MaCTHD LIKE @kw
         OR MaHD LIKE @kw
         OR LoaiChiTiet LIKE @kw
    `);

  return result.recordset;
};
