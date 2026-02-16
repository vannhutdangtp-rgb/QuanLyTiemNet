const sql = require("mssql");
const db = require("../config/db.config");

/* ===========================
   LẤY DANH SÁCH CA
=========================== */
exports.getAll = async () => {
  const pool = await db.getConnection();

  const result = await pool.request().query(`
    SELECT 
      c.*,
      t.LuongMotGio
    FROM CaLamViec c
    LEFT JOIN TaiKhoanHeThong t ON c.MaNV = t.MaTK
    ORDER BY c.GioBatDau DESC
  `);

  return result.recordset;
};


/* ===========================
   TÌM KIẾM CA
=========================== */
exports.search = async (keyword) => {
  const pool = await db.getConnection();

  const result = await pool.request()
    .input("kw", sql.NVarChar, `%${keyword}%`)
    .query(`
      SELECT 
        c.*,
        t.LuongMotGio
      FROM CaLamViec c
      LEFT JOIN TaiKhoanHeThong t ON c.MaNV = t.MaTK
      WHERE c.MaNV LIKE @kw
         OR c.TrangThai LIKE @kw
      ORDER BY c.GioBatDau DESC
    `);

  return result.recordset;
};

/* ===========================
   LOGIN → BẮT ĐẦU CA
=========================== */
exports.startShift = async (MaNV) => {
  const pool = await db.getConnection();

  /* ✅ 1. Check nếu đang có ca */
  const check = await pool.request()
    .input("MaNV", sql.NVarChar, MaNV)
    .query(`
      SELECT TOP 1 *
      FROM CaLamViec
      WHERE MaNV=@MaNV AND TrangThai=N'Đang làm'
      ORDER BY GioBatDau DESC
    `);

  if (check.recordset.length > 0) {
    return {
      message: "Nhân viên đang có ca làm rồi!",
      MaCa: check.recordset[0].MaCa,
    };
  }

  /* ✅ 2. Auto tạo mã ca */
  const countResult = await pool.request().query(`
    SELECT COUNT(*) + 1 AS SoCa FROM CaLamViec
  `);

  const so = countResult.recordset[0].SoCa;
  const MaCa = "CA" + String(so).padStart(2, "0");

  /* ✅ 3. Insert ca mới (KHÔNG còn LuongMotGio) */
  await pool.request()
    .input("MaCa", sql.NVarChar, MaCa)
    .input("MaNV", sql.NVarChar, MaNV)
    .query(`
      INSERT INTO CaLamViec (MaCa, MaNV, GioBatDau, TrangThai)
      VALUES (@MaCa, @MaNV, GETDATE(), N'Đang làm')
    `);

  return { message: "Bắt đầu ca thành công!", MaCa };
};

/* ===========================
   LOGOUT → KẾT THÚC CA
   + TÍNH LƯƠNG + DOANH THU
=========================== */
exports.endShift = async (MaNV) => {
  const pool = await db.getConnection();

  /* ✅ 1. Lấy ca đang làm */
  const ca = await pool.request()
    .input("MaNV", sql.NVarChar, MaNV)
    .query(`
      SELECT TOP 1 *
      FROM CaLamViec
      WHERE MaNV=@MaNV AND TrangThai=N'Đang làm'
      ORDER BY GioBatDau DESC
    `);

  if (ca.recordset.length === 0) {
    return { message: "Không có ca nào đang làm để kết thúc!" };
  }

  const shift = ca.recordset[0];

  /* ✅ 2. Tính số giờ làm */
  const hoursResult = await pool.request()
    .input("GioBatDau", sql.DateTime, shift.GioBatDau)
    .query(`
      SELECT DATEDIFF(MINUTE, @GioBatDau, GETDATE()) / 60.0 AS SoGio
    `);

  const soGio = hoursResult.recordset[0].SoGio;

  /* ✅ 3. Lấy lương/giờ từ TaiKhoanHeThong */
  const luongRes = await pool.request()
    .input("MaNV", sql.NVarChar, MaNV)
    .query(`
      SELECT LuongMotGio
      FROM TaiKhoanHeThong
      WHERE MaTK=@MaNV
    `);

  const LuongMotGio = luongRes.recordset[0]?.LuongMotGio;

  if (!LuongMotGio) {
    return { message: "Nhân viên chưa có lương/giờ trong hệ thống!" };
  }
  /* ✅ 4. Doanh thu ca = hóa đơn nhân viên lập trong ca */
  const doanhThuResult = await pool.request()
    .input("GioBatDau", sql.DateTime, shift.GioBatDau)
    .input("MaNV", sql.NVarChar, MaNV)
    .query(`
      SELECT ISNULL(SUM(TongTien), 0) AS DoanhThu
      FROM HoaDon
      WHERE MaNV = @MaNV
        AND ThoiGianLap BETWEEN @GioBatDau AND GETDATE()
    `);


  const totalDoanhThu = doanhThuResult.recordset[0].DoanhThu;

  /* ✅ 5. Tổng lương */
  const tongLuong = soGio * LuongMotGio;

  /* ✅ 6. Update ca */
  await pool.request()
    .input("MaCa", sql.NVarChar, shift.MaCa)
    .input("DoanhThuCa", sql.Money, totalDoanhThu)
    .input("TongLuong", sql.Money, tongLuong)
    .query(`
      UPDATE CaLamViec
      SET GioKetThuc = GETDATE(),
          TrangThai = N'DA_KET_THUC',
          DoanhThuCa = @DoanhThuCa,
          TongLuong = @TongLuong
      WHERE MaCa=@MaCa
    `);

  return {
    message: "Kết thúc ca thành công!",
    soGio,
    tongLuong,
    totalDoanhThu,
  };
};
