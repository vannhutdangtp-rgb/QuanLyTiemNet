const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/taikhoan", require("./routes/TaiKhoanRoutes"));
// Khách hàng
app.use("/api/khachhang", require("./routes/KhachHangRoutes"));
// Máy tính
app.use("/api/maytinh", require("./routes/mayTinhRoutes"));
// Phiên chơi
app.use("/api/phienchoi", require("./routes/phienChoiRoutes"));
// Lịch sử phiên chơi
app.use("/api/lichsuphienchoi", require("./routes/lichSuPhienChoiRoutes"));
// Nạp tiền 
app.use("/api/naptien", require("./routes/napTienRoutes"));
// Ca làm việc
app.use("/api/calamviec", require("./routes/caLamViecRoutes"));
// Dịch vụ
app.use("/api/dichvu", require("./routes/dichVuRoutes"));
//image
app.use("/images", express.static(__dirname + "/images"));

// Gọi dịch vụ
app.use("/api/goidichvu", require("./routes/goiDichVuRoutes"));
//Khuyến Mãi
app.use("/api/khuyenmai", require("./routes/khuyenMaiRoutes"));
// Hóa Đơn
app.use("/api/hoadon", require("./routes/hoaDonRoutes"));
// Chi Tiết Hóa Đơn
app.use("/api/chitiethoadon", require("./routes/chiTietHoaDonRoutes"));
//Thống kê
app.use("/api/thongke", require("./routes/thongKeRoutes"));
// Gọi dịch vụ của user
app.use("/api/goidichvuuser", require("./routes/goiDichVuUserRoutes"));
module.exports = app;
