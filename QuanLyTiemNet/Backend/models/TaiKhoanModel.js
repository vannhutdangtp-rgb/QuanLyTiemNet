const sql = require("mssql");
const db = require("../config/db.config");

const TaiKhoanModel = {

  // Lấy tất cả tài khoản
  getAll: async () => {
    const pool = await db.getConnection();
    return pool.request().query("SELECT * FROM TaiKhoanHeThong");
  },

  // Lấy theo mã
  getById: async (MaTK) => {
    const pool = await db.getConnection();
    return pool.request()
      .input("MaTK", sql.NVarChar, MaTK)
      .query("SELECT * FROM TaiKhoanHeThong WHERE MaTK=@MaTK");
  },
   // ==========================
  // SEARCH
  // ==========================
  search: async (keyword) => {
    const pool = await db.getConnection();
    return pool.request()
      .input("kw", sql.NVarChar, `%${keyword}%`)
      .query(`
        SELECT * FROM TaiKhoanHeThong
        WHERE MaTK LIKE @kw
           OR TenTK LIKE @kw
           OR TenDangNhap LIKE @kw
      `);
  },

  // Thêm tài khoản
  create: async (data) => {
    const pool = await db.getConnection();
    return pool.request()
      .input("MaTK", sql.NVarChar, data.MaTK)
      .input("TenTK", sql.NVarChar, data.TenTK)
      .input("TenDangNhap", sql.NVarChar, data.TenDangNhap)
      .input("MatKhauHash", sql.NVarChar, data.MatKhauHash)
      .input("LuongMotGio", sql.Money, data.LuongMotGio)
      .input("SDT", sql.NVarChar, data.SDT)
      .input("DiaChi", sql.NVarChar, data.DiaChi)
      .input("Email", sql.NVarChar, data.Email)
      .input("VaiTro", sql.NVarChar, data.VaiTro)
      .query(`
        INSERT INTO TaiKhoanHeThong
        (MaTK, TenTK, TenDangNhap, MatKhauHash,
         LuongMotGio, SDT, DiaChi, Email, VaiTro, NgayTao)
        VALUES
        (@MaTK,@TenTK,@TenDangNhap,@MatKhauHash,
         @LuongMotGio,@SDT,@DiaChi,@Email,@VaiTro,GETDATE())
      `);
  },

  // Update
  // Update FULL
  update: async (MaTK, data) => {
    const pool = await db.getConnection();
    return pool.request()
      .input("MaTK", sql.NVarChar, MaTK)
      .input("TenTK", sql.NVarChar, data.TenTK)
      .input("TenDangNhap", sql.NVarChar, data.TenDangNhap)
      .input("MatKhauHash", sql.NVarChar, data.MatKhauHash)
      .input("LuongMotGio", sql.Money, data.LuongMotGio)
      .input("SDT", sql.NVarChar, data.SDT)
      .input("DiaChi", sql.NVarChar, data.DiaChi)
      .input("Email", sql.NVarChar, data.Email)
      .input("VaiTro", sql.NVarChar, data.VaiTro)
      .query(`
        UPDATE TaiKhoanHeThong
        SET
          TenTK=@TenTK,
          TenDangNhap=@TenDangNhap,
          MatKhauHash=@MatKhauHash,
          LuongMotGio=@LuongMotGio,
          SDT=@SDT,
          DiaChi=@DiaChi,
          Email=@Email,
          VaiTro=@VaiTro
        WHERE MaTK=@MaTK
      `);
  },
  // Delete
  delete: async (MaTK) => {
    const pool = await db.getConnection();
    return pool.request()
      .input("MaTK", sql.NVarChar, MaTK)
      .query("DELETE FROM TaiKhoanHeThong WHERE MaTK=@MaTK");
  },

  // Login
  login: async (TenDangNhap) => {
    const pool = await db.getConnection();
    return pool.request()
      .input("TenDangNhap", sql.NVarChar, TenDangNhap)
      .query(`
        SELECT * FROM TaiKhoanHeThong
        WHERE TenDangNhap=@TenDangNhap
      `);
  }
};

module.exports = TaiKhoanModel;
