const db = require("../config/db.config");

/* ============================
   AUTO ID: N01, N02,...
============================ */
async function generateMaNap() {
  const pool = await db.getConnection();

  const result = await pool.request().query(`
    SELECT TOP 1 MaNap FROM NapTien ORDER BY MaNap DESC
  `);

  if (result.recordset.length === 0) return "N01";

  let last = result.recordset[0].MaNap;
  let num = parseInt(last.substring(1)) + 1;

  return "N" + num.toString().padStart(2, "0");
}

/* ============================
   GET ALL (JOIN KH + JOIN NV)
============================ */
async function getAll() {
  const pool = await db.getConnection();

  const result = await pool.request().query(`
    SELECT 
        N.MaNap,
        N.MaKH,
        KH.TenKH,
        N.MaNV,
        TK.TenTK AS TenNV,
        N.SoTien,
        CONVERT(varchar, N.ThoiGianNap, 120) AS ThoiGianNap
    FROM NapTien N
    LEFT JOIN KhachHang KH ON N.MaKH = KH.MaKH
    LEFT JOIN TaiKhoanHeThong TK ON N.MaNV = TK.MaTK
    ORDER BY N.ThoiGianNap DESC
  `);

  return result.recordset;
}

/* ============================
   CREATE (NẠP + CỘNG SỐ DƯ)
============================ */
async function create(data) {
  const pool = await db.getConnection();
  const MaNap = await generateMaNap();

  const transaction = pool.transaction();
  await transaction.begin();

  try {
     // ÉP KIỂU SỐ TIỀN (FIX BUG STRING)
  data.SoTien = Number(data.SoTien);
        // ==========================
    // 0. CHECK KHUYẾN MÃI (VanCon)
    // ==========================
    let bonus = 0;

    const kmResult = await transaction.request().query(`
      SELECT TOP 1 *
      FROM KhuyenMai
      WHERE TrangThai = N'VanCon'
        AND GETDATE() BETWEEN NgayBatDau AND NgayKetThuc
    `);

    if (kmResult.recordset.length > 0) {
      const km = kmResult.recordset[0];
      bonus = Math.floor((data.SoTien * km.PhanTramTang) / 100);
    }

    // Tổng tiền cộng vào số dư
    const tongTienCong = data.SoTien + bonus;

    // ==========================
    // 1. Insert NapTien
    // ==========================
    await transaction
      .request()
      .input("MaNap", MaNap)
      .input("MaKH", data.MaKH)
      .input("MaNV", data.MaNV)
      .input("SoTien", data.SoTien)
      .query(`
        INSERT INTO NapTien(MaNap, MaKH, MaNV, SoTien, ThoiGianNap)
        VALUES(@MaNap, @MaKH, @MaNV, @SoTien, GETDATE())
      `);

    // ==========================
    // 2. Update số dư khách hàng
    // ==========================
      await transaction
      .request()
      .input("MaKH", data.MaKH)
      .input("TongTien", tongTienCong)
      .query(`
        UPDATE KhachHang
        SET SoDu = ISNULL(SoDu,0) + @TongTien
        WHERE MaKH = @MaKH
      `);


    // ==================================================
    // 3. AUTO TẠO HÓA ĐƠN (HoaDon)
    // ==================================================

    // Lấy mã HD mới
    const hdResult = await transaction.request().query(`
      SELECT TOP 1 MaHD FROM HoaDon ORDER BY MaHD DESC
    `);

    let MaHD = "HD01";
    if (hdResult.recordset.length > 0) {
      let last = hdResult.recordset[0].MaHD;
      let num = parseInt(last.substring(2)) + 1;
      MaHD = "HD" + num.toString().padStart(2, "0");
    }

    // Insert HoaDon
    await transaction
      .request()
      .input("MaHD", MaHD)
      .input("MaKH", data.MaKH)
      .input("MaNV", data.MaNV)
      .input("LoaiHoaDon", "NapTien")
      .input("TongTien", tongTienCong)
      .query(`
        INSERT INTO HoaDon(MaHD, MaKH, MaNV, LoaiHoaDon, ThoiGianLap, TongTien)
        VALUES(@MaHD, @MaKH, @MaNV, @LoaiHoaDon, GETDATE(), @TongTien)
      `);

    // ==================================================
    // 4. AUTO TẠO CHI TIẾT HÓA ĐƠN (ChiTietHoaDon)
    // ==================================================

    // Lấy mã CTHD mới
    const ctResult = await transaction.request().query(`
      SELECT TOP 1 MaCTHD FROM ChiTietHoaDon ORDER BY MaCTHD DESC
    `);

    let MaCTHD = "CT01";
    if (ctResult.recordset.length > 0) {
      let last = ctResult.recordset[0].MaCTHD;
      let num = parseInt(last.substring(2)) + 1;
      MaCTHD = "CT" + num.toString().padStart(2, "0");
    }

    // Insert ChiTietHoaDon
    await transaction
      .request()
      .input("MaCTHD", MaCTHD)
      .input("MaHD", MaHD)
      .input("LoaiChiTiet", "NapTien")
      .input("SoLuong", 1)
      .input("ThanhTien", tongTienCong)
      .query(`
        INSERT INTO ChiTietHoaDon(MaCTHD, MaHD, LoaiChiTiet, SoLuong, ThanhTien)
        VALUES(@MaCTHD, @MaHD, @LoaiChiTiet, @SoLuong, @ThanhTien)
      `);

    // ==========================
    // DONE
    // ==========================
    await transaction.commit();

        return {
      message:
        bonus > 0
          ? `✅ Nạp ${data.SoTien} + thưởng thêm ${bonus} từ khuyến mãi!`
          : "✅ Nạp tiền thành công + đã tạo hóa đơn!",
      MaNap,
      MaHD,
      bonus,
      tongTienCong,
    };

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}


/* ============================
   UPDATE (TRỪ TIỀN CŨ + CỘNG TIỀN MỚI)
============================ */
async function update(MaNap, newSoTien) {
  const pool = await db.getConnection();
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    // 1. Lấy giao dịch cũ
    const oldData = await transaction
      .request()
      .input("MaNap", MaNap)
      .query(`SELECT * FROM NapTien WHERE MaNap = @MaNap`);

    if (oldData.recordset.length === 0)
      throw new Error("❌ Không tìm thấy giao dịch!");

    const oldNap = oldData.recordset[0];
    const MaKH = oldNap.MaKH;
    const oldSoTien = oldNap.SoTien;

    // 2. Thu hồi tiền cũ
    await transaction
      .request()
      .input("MaKH", MaKH)
      .input("oldSoTien", oldSoTien)
      .query(`
        UPDATE KhachHang
        SET SoDu = SoDu - @oldSoTien
        WHERE MaKH = @MaKH
      `);

    // 3. Update NapTien số tiền mới
    await transaction
      .request()
      .input("MaNap", MaNap)
      .input("newSoTien", newSoTien)
      .query(`
        UPDATE NapTien
        SET SoTien = @newSoTien
        WHERE MaNap = @MaNap
      `);

    // 4. Cộng tiền mới
    await transaction
      .request()
      .input("MaKH", MaKH)
      .input("newSoTien", newSoTien)
      .query(`
        UPDATE KhachHang
        SET SoDu = SoDu + @newSoTien
        WHERE MaKH = @MaKH
      `);

    await transaction.commit();
    return { message: "✅ Cập nhật nạp tiền thành công!" };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/* ============================
   DELETE (XÓA + TRỪ SỐ DƯ)
============================ */
async function remove(MaNap) {
  const pool = await db.getConnection();
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    // 1. Lấy giao dịch
    const oldData = await transaction
      .request()
      .input("MaNap", MaNap)
      .query(`SELECT * FROM NapTien WHERE MaNap = @MaNap`);

    if (oldData.recordset.length === 0)
      throw new Error("❌ Không tìm thấy giao dịch!");

    const nap = oldData.recordset[0];

    // 2. Trừ SoDu khách hàng
    await transaction
      .request()
      .input("MaKH", nap.MaKH)
      .input("SoTien", nap.SoTien)
      .query(`
        UPDATE KhachHang
        SET SoDu = SoDu - @SoTien
        WHERE MaKH = @MaKH
      `);

    // 3. Xóa giao dịch
    await transaction
      .request()
      .input("MaNap", MaNap)
      .query(`DELETE FROM NapTien WHERE MaNap = @MaNap`);

    await transaction.commit();
    return { message: "🗑 Xóa nạp tiền thành công!" };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = {
  getAll,
  create,
  update,
  remove,
};
