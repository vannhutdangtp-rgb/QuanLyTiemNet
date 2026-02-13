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
    .query(`
      INSERT INTO DichVu(MaDV, TenDV, Gia, TonKho)
      VALUES (@MaDV, @TenDV, @Gia, @TonKho)
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
    .query(`
      UPDATE DichVu
      SET TenDV=@TenDV, Gia=@Gia, TonKho=@TonKho
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
