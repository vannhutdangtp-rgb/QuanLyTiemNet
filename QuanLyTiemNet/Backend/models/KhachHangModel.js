const sql = require("mssql");
const dbConfig = require("../config/db.config");

const KhachHangModel = {
  // ==========================
  // GET ALL
  // ==========================
  // ==========================
// GET ALL (Có convert NgayTao)
// ==========================
async getAll() {
  const pool = await sql.connect(dbConfig);

  const result = await pool.request().query(`
    SELECT 
      MaKH,
      TenKH,
      TenDangNhap,
      MatKhauHash,
      SoDu,
      TongThoiGianChoi,

      -- ✅ Convert ngày tạo cho frontend dễ hiển thị
      CONVERT(VARCHAR, NgayTao, 120) AS NgayTao

    FROM KhachHang
    ORDER BY NgayTao DESC
  `);

  return result.recordset;
},


  // ==========================
  // GET BY ID
  // ==========================
  async getById(maKH) {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("MaKH", sql.NVarChar, maKH)
      .query("SELECT * FROM KhachHang WHERE MaKH=@MaKH");

    return result.recordset[0];
  },

  // ==========================
  // SEARCH
  // ==========================
  async search(keyword) {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("kw", sql.NVarChar, `%${keyword}%`)
      .query(`
        SELECT * FROM KhachHang
        WHERE MaKH LIKE @kw
           OR TenKH LIKE @kw
           OR TenDangNhap LIKE @kw
      `);
    return result.recordset;
  },

  // ==========================
  // CREATE
  // ==========================
  async create(data) {
    const pool = await sql.connect(dbConfig);

    await pool
      .request()
      .input("MaKH", sql.NVarChar, data.MaKH)
      .input("TenKH", sql.NVarChar, data.TenKH)
      .input("TenDangNhap", sql.NVarChar, data.TenDangNhap)
      .input("MatKhauHash", sql.NVarChar, data.MatKhauHash)
      .input("SoDu", sql.Money, data.SoDu)
      .input("TongThoiGianChoi", sql.Int, data.TongThoiGianChoi)
      .query(`
        INSERT INTO KhachHang
        (MaKH, TenKH, TenDangNhap, MatKhauHash, SoDu, TongThoiGianChoi, NgayTao)
        VALUES (@MaKH,@TenKH,@TenDangNhap,@MatKhauHash,@SoDu,@TongThoiGianChoi,GETDATE())
      `);

    return { message: "Thêm khách hàng thành công!" };
  },

  // ==========================
  // UPDATE
  // ==========================
  async update(maKH, data) {
    const pool = await sql.connect(dbConfig);

    await pool
      .request()
      .input("MaKH", sql.NVarChar, maKH)
      .input("TenKH", sql.NVarChar, data.TenKH)
      .input("TenDangNhap", sql.NVarChar, data.TenDangNhap)
      .input("SoDu", sql.Money, data.SoDu)
      .input("TongThoiGianChoi", sql.Int, data.TongThoiGianChoi)
      .query(`
        UPDATE KhachHang
        SET TenKH=@TenKH,
            TenDangNhap=@TenDangNhap,
            SoDu=@SoDu,
            TongThoiGianChoi=@TongThoiGianChoi
        WHERE MaKH=@MaKH
      `);

    return { message: "Cập nhật khách hàng thành công!" };
  },

  // ==========================
  // DELETE
  // ==========================
  async delete(maKH) {
    const pool = await sql.connect(dbConfig);

    await pool
      .request()
      .input("MaKH", sql.NVarChar, maKH)
      .query("DELETE FROM KhachHang WHERE MaKH=@MaKH");

    return { message: "Xóa khách hàng thành công!" };
  },

  // ==========================
  // LOGIN
  // ==========================
  async login(tenDangNhap) {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("TenDangNhap", sql.NVarChar, tenDangNhap)
      .query("SELECT MaKH, TenKH, TenDangNhap, MatKhauHash, SoDu FROM KhachHang WHERE TenDangNhap=@TenDangNhap");

    return result;
  },
};

module.exports = KhachHangModel;
