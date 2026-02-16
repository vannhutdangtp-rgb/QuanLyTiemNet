const sql = require("mssql");
const dbConfig = require("../config/db.config");

// Lấy toàn bộ lịch sử phiên chơi
async function getAllLichSu() {
  const pool = await sql.connect(dbConfig);

  const result = await pool.request().query(`
    SELECT MaPhien, MaKH, MaMay,
           GioLogin, GioLogout,
           GiaTheoGio, SoTienTru, TrangThai
    FROM PhienChoi
    ORDER BY GioLogin DESC
  `);

  return result.recordset;
}

// Tìm kiếm lịch sử phiên chơi
async function searchLichSu(keyword) {
  const pool = await sql.connect(dbConfig);

  const result = await pool.request()
    .input("kw", sql.NVarChar, `%${keyword}%`)
    .query(`
      SELECT *
      FROM PhienChoi
      WHERE MaPhien LIKE @kw
         OR MaKH LIKE @kw
         OR MaMay LIKE @kw
      ORDER BY GioLogin DESC
    `);

  return result.recordset;
}

// Lấy 1 phiên chơi để xuất hóa đơn
async function getPhienByMa(maPhien) {
  const pool = await sql.connect(dbConfig);

  const result = await pool.request()
    .input("MaPhien", sql.VarChar, maPhien)
    .query(`
      SELECT *
      FROM PhienChoi
      WHERE MaPhien = @MaPhien
    `);

  return result.recordset[0];
}

module.exports = {
  getAllLichSu,
  searchLichSu,
  getPhienByMa
};
