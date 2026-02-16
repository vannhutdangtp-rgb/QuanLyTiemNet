const db = require("../config/db.config");

const ThongKeModel = {
  // ============================
  // DANH SÁCH HÓA ĐƠN THEO NGÀY
  // ============================
  getHoaDon: async (from, to) => {
  const pool = await db.getConnection();

  let query = `
    SELECT 
      MaHD,
      MaKH,
      MaNV,
      LoaiHoaDon,
      FORMAT(ThoiGianLap, 'dd/MM/yyyy HH:mm:ss') AS ThoiGianLap,
      TongTien
    FROM HoaDon
    WHERE 1=1
  `;

  if (from && to) {
    query += `
      AND ThoiGianLap >= @from
      AND ThoiGianLap < DATEADD(day, 1, @to)
    `;
  }

  query += ` ORDER BY ThoiGianLap DESC`;

  const request = pool.request();

  if (from && to) {
    request.input("from", from);
    request.input("to", to);
  }

  const result = await request.query(query);
  return result.recordset;
},


  // ============================
  // TỔNG DOANH THU
  // ============================
  getTongDoanhThu: async (from, to) => {
    const pool = await db.getConnection();

    let query = `
      SELECT SUM(TongTien) AS TongDoanhThu
      FROM HoaDon
      WHERE 1=1
    `;

    if (from && to) {
    query += `
        AND ThoiGianLap >= @from
        AND ThoiGianLap < DATEADD(day, 1, @to)
    `;
    }


    const request = pool.request();

    if (from && to) {
      request.input("from", from);
      request.input("to", to);
    }

    const result = await request.query(query);
    return result.recordset[0];
  },

  // ============================
  // BIỂU ĐỒ DOANH THU THEO NGÀY
  // ============================
  getChart: async (from, to) => {
  const pool = await db.getConnection();

  let query = `
    SELECT 
      CONVERT(date, ThoiGianLap) AS Ngay,
      SUM(TongTien) AS DoanhThu
    FROM HoaDon
    WHERE 1=1
  `;

  if (from && to) {
    query += `
      AND ThoiGianLap >= @from
      AND ThoiGianLap < DATEADD(day, 1, @to)
    `;
  }

  query += `
    GROUP BY CONVERT(date, ThoiGianLap)
    ORDER BY CONVERT(date, ThoiGianLap) ASC
  `;

  const request = pool.request();

  if (from && to) {
    request.input("from", from);
    request.input("to", to);
  }

  const result = await request.query(query);
  return result.recordset;
},

};

module.exports = ThongKeModel;
