const db = require("../config/db.config");

/* ===========================
   MODEL: DỊCH VỤ
=========================== */

// Lấy tất cả dịch vụ
exports.getAll = async () => {
  const pool = await db.getConnection();
  const result = await pool.request().query("SELECT * FROM DichVu");
  return result.recordset;
};

// Lấy dịch vụ theo mã
exports.getById = async (MaDV) => {
  const pool = await db.getConnection();
  const result = await pool
    .request()
    .input("MaDV", MaDV)
    .query("SELECT * FROM DichVu WHERE MaDV = @MaDV");

  return result.recordset[0];
};

// Thêm dịch vụ mới
exports.create = async (data) => {
  const pool = await db.getConnection();

  await pool
    .request()
    .input("MaDV", data.MaDV)
    .input("TenDV", data.TenDV)
    .input("Gia", data.Gia)
    .input("TonKho", data.TonKho)
    .input("HinhAnh", data.HinhAnh || null) // Thêm trường HinhAnh
    .query(`
      INSERT INTO DichVu(MaDV, TenDV, Gia, TonKho, HinhAnh)
      VALUES (@MaDV, @TenDV, @Gia, @TonKho, @HinhAnh)
    `);

  return { message: "Thêm dịch vụ thành công!" };
};

// Cập nhật dịch vụ
exports.update = async (MaDV, data) => {
  const pool = await db.getConnection();

  await pool
    .request()
    .input("MaDV", MaDV)
    .input("TenDV", data.TenDV)
    .input("Gia", data.Gia)
    .input("TonKho", data.TonKho)
    .input("HinhAnh", data.HinhAnh || null) // Cập nhật trường HinhAnh
    .query(`
      UPDATE DichVu
      SET TenDV=@TenDV, Gia=@Gia, TonKho=@TonKho, HinhAnh=@HinhAnh
      WHERE MaDV=@MaDV
    `);

  return { message: "Cập nhật dịch vụ thành công!" };
};

// Xóa dịch vụ
exports.remove = async (MaDV) => {
  const pool = await db.getConnection();

  await pool
    .request()
    .input("MaDV", MaDV)
    .query("DELETE FROM DichVu WHERE MaDV=@MaDV");

  return { message: "Xóa dịch vụ thành công!" };
};

// Tìm kiếm dịch vụ
exports.search = async (keyword) => {
  const pool = await db.getConnection();
  const result = await pool
    .request()
    .input("kw", `%${keyword}%`)
    .query(`
      SELECT * FROM DichVu
      WHERE MaDV LIKE @kw OR TenDV LIKE @kw
      ORDER BY MaDV
    `);

  return result.recordset;
};

// Làm mới dịch vụ (lấy lại dữ liệu mới nhất)
exports.refresh = async () => {
  const pool = await db.getConnection();
  const result = await pool.request().query("SELECT * FROM DichVu ORDER BY MaDV");
  return result.recordset;
};
