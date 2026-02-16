require("dotenv").config();
const app = require("./app");
const { getConnection } = require("./config/db.config");

const { autoStopIfHetTien } = require("./models/phienChoiModel");
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // ✅ Test DB trước
    await getConnection();
    console.log("✅ Kết nối SQL Server thành công!");

    // ✅ ROUTES
    app.use("/api/taikhoan", require("./routes/TaiKhoanRoutes"));
    app.use("/api/khachhang", require("./routes/KhachHangRoutes"));
    app.use("/api/maytinh", require("./routes/mayTinhRoutes"));
    app.use("/api/phienchoi", require("./routes/phienChoiRoutes"));
    app.use("/api/lichsuphienchoi", require("./routes/lichSuPhienChoiRoutes"));
    app.use("/api/naptien", require("./routes/napTienRoutes"));
    app.use("/api/calamviec", require("./routes/caLamViecRoutes"));
    app.use("/api/dichvu", require("./routes/dichVuRoutes"));
    app.use("/api/goidichvu", require("./routes/goiDichVuRoutes"));
    app.use("/api/khuyenmai", require("./routes/khuyenMaiRoutes"));
    app.use("/api/hoadon", require("./routes/hoaDonRoutes"));
    app.use("/api/chitiethoadon", require("./routes/chiTietHoaDonRoutes"));
    app.use("/api/thongke", require("./routes/thongKeRoutes"));
    app.use("/api/goidichvuuser", require("./routes/goiDichVuUserRoutes"));

    // ✅ AUTO STOP mỗi phút
    setInterval(() => {
    autoStopIfHetTien();
    }, 10000); // mỗi 10 giây check 1 lần

    // ✅ RUN SERVER
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("❌ Server không chạy vì lỗi DB:", err.message);
  }
}

startServer();
