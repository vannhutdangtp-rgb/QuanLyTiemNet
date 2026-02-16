const sql = require("mssql");
const dbConfig = require("../config/db.config");

// ==========================
// GET ALL
// ==========================
async function getAllMayTinh() {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request().query("SELECT * FROM MayTinh");
  return result.recordset;
}

// ==========================
// GET ONE
// ==========================
async function getMayTinhById(maMay) {
  const pool = await sql.connect(dbConfig);

  const result = await pool
    .request()
    .input("MaMay", sql.NVarChar(10), maMay)
    .query("SELECT * FROM MayTinh WHERE MaMay=@MaMay");

  return result.recordset[0];
}

// ==========================
// CREATE
// ==========================
async function createMayTinh(data) {
  const pool = await sql.connect(dbConfig);

  // ⚠️ TrangThai phải không dấu theo yêu cầu bạn
  let trangThai = data.TrangThai;

  if (trangThai === "Trống") trangThai = "Trong";
  if (trangThai === "Đang sử dụng") trangThai = "DangSuDung";
  if (trangThai === "Bảo trì") trangThai = "BaoTri";

  await pool
    .request()
    .input("MaMay", sql.NVarChar(10), data.MaMay)
    .input("TenMay", sql.NVarChar(50), data.TenMay)
    .input("TrangThai", sql.NVarChar(20), trangThai)
    .query(`
      INSERT INTO MayTinh (MaMay, TenMay, TrangThai)
      VALUES (@MaMay, @TenMay, @TrangThai)
    `);
}

// ==========================
// UPDATE
// ==========================
async function updateMayTinh(maMay, data) {
  const pool = await sql.connect(dbConfig);

  let trangThai = data.TrangThai;

  if (trangThai === "Trống") trangThai = "Trong";
  if (trangThai === "Đang sử dụng") trangThai = "DangSuDung";
  if (trangThai === "Bảo trì") trangThai = "BaoTri";

  await pool
    .request()
    .input("MaMay", sql.NVarChar(10), maMay)
    .input("TenMay", sql.NVarChar(50), data.TenMay)
    .input("TrangThai", sql.NVarChar(20), trangThai)
    .query(`
      UPDATE MayTinh
      SET TenMay=@TenMay, TrangThai=@TrangThai
      WHERE MaMay=@MaMay
    `);
}

// ==========================
// DELETE
// ==========================
async function deleteMayTinh(maMay) {
  const pool = await sql.connect(dbConfig);

  await pool
    .request()
    .input("MaMay", sql.NVarChar(10), maMay)
    .query("DELETE FROM MayTinh WHERE MaMay=@MaMay");
}

module.exports = {
  getAllMayTinh,
  getMayTinhById,
  createMayTinh,
  updateMayTinh,
  deleteMayTinh,
};
