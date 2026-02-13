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
        N.ThoiGianNap
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
    // 1. Insert NapTien
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

    // 2. Update SoDu khách hàng
    await transaction
      .request()
      .input("MaKH", data.MaKH)
      .input("SoTien", data.SoTien)
      .query(`
        UPDATE KhachHang
        SET SoDu = ISNULL(SoDu,0) + @SoTien
        WHERE MaKH = @MaKH
      `);

    await transaction.commit();
    return { message: "✅ Nạp tiền thành công!", MaNap };
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
