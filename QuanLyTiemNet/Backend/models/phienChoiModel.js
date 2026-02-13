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

  if (checkKH.recordset[0].SoDu <= 0) {
    throw new Error("Khách đã hết tiền!");
  }
  const checkkKH = await pool.request()
    .input("MaKH", sql.NVarChar, MaKH)
    .query(`
      SELECT * FROM PhienChoi
      WHERE MaKH=@MaKH AND TrangThai=N'DangChoi'
    `);

  if (checkkKH.recordset.length > 0) {
    throw new Error("❌ Khách này đang chơi máy khác rồi!");
  }

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

  // Insert phiên chơi
  await pool.request()
    .input("MaPhien", sql.NVarChar, MaPhien)
    .input("MaKH", sql.NVarChar, MaKH)
    .input("MaMay", sql.NVarChar, MaMay)
    .query(`
      INSERT INTO PhienChoi
      (MaPhien, MaKH, MaMay, GioLogin, GiaTheoGio, TrangThai)
      VALUES
      (@MaPhien, @MaKH, @MaMay, SYSDATETIME(), 6000, N'DangChoi')
    `);

  // Update máy sang ĐangChoi
  await pool.request()
    .input("MaMay", sql.NVarChar, MaMay)
    .query(`
      UPDATE MayTinh
      SET TrangThai = N'DangSuDung'
      WHERE MaMay=@MaMay
    `);

  return { message: "Start phiên thành công!", MaPhien };
}

/* ===========================
   STOP PHIÊN + TRỪ TIỀN + HÓA ĐƠN
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



module.exports = {
  getMayTinhStatus,
  getKhachHang,
  startSession,
  stopSession,
  autoStopIfHetTien,
};
