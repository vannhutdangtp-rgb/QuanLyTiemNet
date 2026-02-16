const sql = require("mssql");
const db = require("../config/db.config");

/* ===========================
   AUTO TẠO MÃ PHIÊN: P01,P02,...
=========================== */
async function generateMaPhien() {
  const pool = await db.getConnection();

  const result = await pool.request().query(`
    SELECT TOP 1 MaPhien
    FROM PhienChoi
    ORDER BY MaPhien DESC
  `);

  if (result.recordset.length === 0) return "P01";

  let last = result.recordset[0].MaPhien; // P05
  let num = parseInt(last.substring(1)) + 1;

  return "P" + num.toString().padStart(2, "0");
}

/* ===========================
   LOAD DANH SÁCH MÁY + TRẠNG THÁI
=========================== */
async function getMayTinhStatus() {
  const pool = await db.getConnection();

  const query = `
    SELECT 
      mt.MaMay,
      mt.TrangThai,
      pc.MaKH,
      pc.GioLogin
    FROM MayTinh mt
    LEFT JOIN PhienChoi pc
      ON mt.MaMay = pc.MaMay AND pc.TrangThai = N'DangChoi'
  `;

  const result = await pool.request().query(query);
  return result.recordset;
}

/* ===========================
   LOAD DANH SÁCH KHÁCH
=========================== */
async function getKhachHang() {
  const pool = await db.getConnection();

  const result = await pool.request().query(`
    SELECT MaKH, TenKH, SoDu
    FROM KhachHang
  `);

  return result.recordset;
}

/* ===========================
   START PHIÊN CHƠI
=========================== */
async function startSession({ MaKH, MaMay }) {
  const pool = await db.getConnection();

  // Check khách còn tiền không
const checkKH = await pool.request()
  .input("MaKH", sql.NVarChar, MaKH)
  .query(`SELECT SoDu FROM KhachHang WHERE MaKH=@MaKH`);

if (checkKH.recordset.length === 0) {
  throw new Error("❌ Không tìm thấy khách!");
}

if (checkKH.recordset[0].SoDu <= 0) {
  throw new Error("❌ Khách đã hết tiền!");
}


  // Check khách có phiên nào chưa kết thúc không
  const checkSession = await pool.request()
    .input("MaKH", sql.NVarChar, MaKH)
    .query(`
      SELECT * FROM PhienChoi
      WHERE MaKH=@MaKH AND TrangThai IN (N'ChuaChoi', N'DangChoi')
    `);

  if (checkSession.recordset.length > 0) {
    throw new Error("❌ Khách đã có phiên rồi!");
  }

  // Check máy trống
  const checkMay = await pool.request()
    .input("MaMay", sql.NVarChar, MaMay)
    .query(`
      SELECT * FROM MayTinh
      WHERE MaMay=@MaMay AND TrangThai=N'Trong'
    `);

  if (checkMay.recordset.length === 0) {
    throw new Error("❌ Máy này không trống!");
  }

  // Auto mã phiên
  const MaPhien = await generateMaPhien();

  // ✅ Insert phiên chơi trạng thái ChuaChoi, chưa có GioLogin
  await pool.request()
    .input("MaPhien", sql.NVarChar, MaPhien)
    .input("MaKH", sql.NVarChar, MaKH)
    .input("MaMay", sql.NVarChar, MaMay)
    .query(`
      INSERT INTO PhienChoi
      (MaPhien, MaKH, MaMay, GiaTheoGio, TrangThai)
      VALUES
      (@MaPhien, @MaKH, @MaMay, 6000, N'ChuaChoi')
    `);

  // Máy chuyển sang ĐãĐặt
  await pool.request()
    .input("MaMay", sql.NVarChar, MaMay)
    .query(`
      UPDATE MayTinh
      SET TrangThai = N'DangSuDung'
      WHERE MaMay=@MaMay
    `);

  return { message: "✅ Tạo phiên thành công! Khách chưa bắt đầu chơi.", MaPhien };
}
/* ===========================
    USER Login
=========================== */
async function beginSessionWhenLogin(MaKH) {
  const pool = await db.getConnection();

  console.log("🔍 DEBUG beginSessionWhenLogin: MaKH=", MaKH);

  // Check có phiên ChuaChoi không
  const session = await pool.request()
    .input("MaKH", sql.NVarChar, MaKH)
    .query(`
      SELECT TOP 1 *
      FROM PhienChoi
      WHERE MaKH=@MaKH AND TrangThai=N'ChuaChoi'
      ORDER BY MaPhien DESC
    `);

  console.log("🔍 Found phien ChuaChoi:", session.recordset.length > 0);

  if (session.recordset.length === 0) {
    console.log("❌ Không tìm thấy phiên ChuaChoi cho MaKH:", MaKH);
    throw new Error("❌ Bạn chưa được tạo phiên chơi!");
  }

  const phien = session.recordset[0];

  console.log("✅ Phiên found:", { MaPhien: phien.MaPhien, MaMay: phien.MaMay, TrangThai: phien.TrangThai });

  // ✅ Update sang DangChoi + set GioLogin
  await pool.request()
    .input("MaPhien", sql.NVarChar, phien.MaPhien)
    .query(`
      UPDATE PhienChoi
      SET TrangThai=N'DangChoi',
          GioLogin=SYSDATETIME()
      WHERE MaPhien=@MaPhien
    `);

  console.log("✅ Updated phien to DangChoi");

  // Update máy sang ĐangSuDung
  await pool.request()
    .input("MaMay", sql.NVarChar, phien.MaMay)
    .query(`
      UPDATE MayTinh
      SET TrangThai=N'DangSuDung'
      WHERE MaMay=@MaMay
    `);

  console.log("✅ Updated machine status");

  return phien;
}


/* ===========================
   STOP SESSION THEO MÁY (admin/nhân viên stop máy)
=========================== */
async function stopSession(MaMay) {
  const pool = await db.getConnection();

  // Update phiên chơi + tính tiền
  const result = await pool.request()
    .input("MaMay", sql.NVarChar, MaMay)
    .query(`
      UPDATE PhienChoi
      SET GioLogout = SYSDATETIME(),
          TrangThai = N'KetThuc',
          SoTienTru =
            DATEDIFF(MINUTE, GioLogin, SYSDATETIME()) / 60.0 * GiaTheoGio
      WHERE MaMay=@MaMay AND TrangThai=N'DangChoi';

      SELECT TOP 1 *
      FROM PhienChoi
      WHERE MaMay=@MaMay AND TrangThai=N'KetThuc'
      ORDER BY GioLogout DESC;
    `);

  const phien = result.recordset[0];

  if (!phien) {
    throw new Error("❌ Máy này không có phiên chơi đang hoạt động!");
  }

  // Trừ tiền khách
  await pool.request()
    .input("MaKH", sql.NVarChar, phien.MaKH)
    .input("SoTienTru", sql.Money, phien.SoTienTru)
    .query(`
      UPDATE KhachHang
      SET SoDu = CASE 
        WHEN SoDu - @SoTienTru < 0 THEN 0
        ELSE SoDu - @SoTienTru
      END
      WHERE MaKH=@MaKH

    `);
    // ✅ Cộng thời gian chơi vào khách hàng
    await pool.request()
      .input("MaKH", sql.NVarChar, phien.MaKH)
      .input("GioLogin", sql.DateTime, phien.GioLogin)
      .input("GioLogout", sql.DateTime, phien.GioLogout)
      .query(`
        UPDATE KhachHang
        SET TongThoiGianChoi = ISNULL(TongThoiGianChoi, 0) +
            DATEDIFF(MINUTE, @GioLogin, @GioLogout)
        WHERE MaKH = @MaKH
      `);


  // Máy về trống (KHÔNG có MaKH)
  await pool.request()
    .input("MaMay", sql.NVarChar, MaMay)
    .query(`
      UPDATE MayTinh
      SET TrangThai=N'Trong'
      WHERE MaMay=@MaMay
    `);

  return {
    message: "Stop thành công!",
    hoaDon: {
      MaPhien: phien.MaPhien,
      MaKH: phien.MaKH,
      MaMay: phien.MaMay,
      GioLogin: phien.GioLogin,
      GioLogout: phien.GioLogout,
      SoTienTru: phien.SoTienTru,
    },
  };
}

/* ===========================
   LOGOUT THEO KHÁCH HÀNG (user logout)
=========================== */
async function userLogout(MaKH) {
  const pool = await db.getConnection();

  console.log("🔍 DEBUG userLogout: MaKH=", MaKH);

  // Tìm phiên DangChoi của khách hàng (không cần MaMay)
  const checkPhien = await pool.request()
    .input("MaKH", sql.NVarChar, MaKH)
    .query(`
      SELECT TOP 1 * FROM PhienChoi
      WHERE MaKH=@MaKH AND TrangThai=N'DangChoi'
      ORDER BY MaPhien DESC
    `);

  console.log("🔍 Found phien DangChoi:", checkPhien.recordset.length > 0);

  if (checkPhien.recordset.length === 0) {
    console.log("❌ Không tìm thấy phiên DangChoi cho MaKH:", MaKH);
    throw new Error("❌ Không tìm thấy phiên chơi đang hoạt động!");
  }

  const phien = checkPhien.recordset[0];
  const MaMay = phien.MaMay;

  console.log("✅ Phiên tìm được:", { MaPhien: phien.MaPhien, MaMay, TrangThai: phien.TrangThai, GioLogin: phien.GioLogin });

  // Update phiên + tính tiền
  await pool.request()
    .input("MaPhien", sql.NVarChar, phien.MaPhien)
    .query(`
      UPDATE PhienChoi
      SET GioLogout = SYSDATETIME(),
          TrangThai = N'KetThuc',
          SoTienTru =
            DATEDIFF(MINUTE, GioLogin, SYSDATETIME()) / 60.0 * GiaTheoGio
      WHERE MaPhien=@MaPhien
    `);

  console.log("✅ Đã update phiên thành KetThuc");

  // Lấy lại data sau khi update
  const result = await pool.request()
    .input("MaPhien", sql.NVarChar, phien.MaPhien)
    .query(`SELECT * FROM PhienChoi WHERE MaPhien=@MaPhien`);

  const phienUpdated = result.recordset[0];
  const SoTienTru = phienUpdated.SoTienTru;

  console.log("✅ Phiên sau update:", { SoTienTru, GioLogout: phienUpdated.GioLogout, TrangThai: phienUpdated.TrangThai });

  // Trừ tiền khách
  await pool.request()
    .input("MaKH", sql.NVarChar, MaKH)
    .input("SoTienTru", sql.Money, SoTienTru)
    .query(`
      UPDATE KhachHang
      SET SoDu = CASE 
        WHEN SoDu - @SoTienTru < 0 THEN 0
        ELSE SoDu - @SoTienTru
      END
      WHERE MaKH=@MaKH
    `);

  console.log("✅ Đã trừ tiền khách");

  // Cộng thời gian chơi
  await pool.request()
    .input("MaKH", sql.NVarChar, MaKH)
    .input("GioLogin", sql.DateTime, phien.GioLogin)
    .input("GioLogout", sql.DateTime, phienUpdated.GioLogout)
    .query(`
      UPDATE KhachHang
      SET TongThoiGianChoi = ISNULL(TongThoiGianChoi, 0) +
          DATEDIFF(MINUTE, @GioLogin, @GioLogout)
      WHERE MaKH = @MaKH
    `);

  console.log("✅ Đã cộng thời gian chơi");

  // Máy về trống
  await pool.request()
    .input("MaMay", sql.NVarChar, MaMay)
    .query(`
      UPDATE MayTinh
      SET TrangThai=N'Trong'
      WHERE MaMay=@MaMay
    `);

  console.log("✅ Máy về trống");

  return {
    message: "✅ Logout thành công!",
    phien: {
      MaPhien: phien.MaPhien,
      MaKH: MaKH,
      MaMay: MaMay,
      GioLogin: phien.GioLogin,
      GioLogout: phienUpdated.GioLogout,
      SoTienTru: SoTienTru,
    },
  };
}


/* ===========================
   AUTO STOP NẾU KHÁCH HẾT TIỀN
=========================== */
async function autoStopIfHetTien() {
  const pool = await db.getConnection();

  const sessions = await pool.request().query(`
    SELECT 
      pc.MaMay,
      pc.MaKH,
      pc.GiaTheoGio,
      kh.SoDu,
      DATEDIFF(MINUTE, pc.GioLogin, SYSDATETIME()) AS SoPhut
    FROM PhienChoi pc
    JOIN KhachHang kh ON pc.MaKH = kh.MaKH
    WHERE pc.TrangThai = N'DangChoi'
  `);

  for (let s of sessions.recordset) {

    const minutes = s.SoPhut;

    if (minutes <= 0) continue;

    const tienDaChay = (minutes / 60) * s.GiaTheoGio;

    if (tienDaChay >= s.SoDu) {
      console.log(`⚠️ AutoStop: ${s.MaKH} hết tiền ở máy ${s.MaMay}`);
      await stopSession(s.MaMay);
    }
  }
}

/* ===========================
   GET PHIÊN CHUAÇHOI
=========================== */
async function getPhienChuaChoi(MaKH) {
  const pool = await db.getConnection();

  const result = await pool
    .request()
    .input("MaKH", sql.NVarChar, MaKH)
    .query(`
      SELECT TOP 1 *
      FROM PhienChoi
      WHERE MaKH=@MaKH AND TrangThai=N'ChuaChoi'
      ORDER BY MaPhien DESC
    `);

  return result.recordset[0];
}

module.exports = {
  getMayTinhStatus,
  getKhachHang,
  startSession,
  beginSessionWhenLogin,
  stopSession,
  userLogout,
  autoStopIfHetTien,
  getPhienChuaChoi,
};
