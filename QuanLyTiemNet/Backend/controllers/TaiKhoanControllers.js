const TaiKhoanModel = require("../models/TaiKhoanModel");
const jwt = require("jsonwebtoken");

// GET ALL
exports.getAll = async (req, res) => {
  const result = await TaiKhoanModel.getAll();
  res.json(result.recordset);
};

// CREATE (Không hash)
exports.create = async (req, res) => {
  const { MaTK, TenTK, TenDangNhap, MatKhau, VaiTro } = req.body;

  await TaiKhoanModel.create({
    MaTK,
    TenTK,
    TenDangNhap,
    MatKhauHash: MatKhau, // ✅ lưu plain text luôn
    VaiTro
  });

  res.json({ message: "✅ Thêm tài khoản thành công" });
};

// UPDATE
exports.update = async (req, res) => {
  await TaiKhoanModel.update(req.params.id, req.body);
  res.json({ message: "✅ Cập nhật thành công" });
};

// DELETE
exports.delete = async (req, res) => {
  await TaiKhoanModel.delete(req.params.id);
  res.json({ message: "✅ Xóa thành công" });
};

// LOGIN (So sánh thường)
exports.login = async (req, res) => {
  // Accept both PascalCase (backend) and camelCase (frontend) keys
  const TenDangNhap = req.body.TenDangNhap || req.body.tenDangNhap;
  const MatKhau = req.body.MatKhau || req.body.matKhau;

  if (!TenDangNhap || !MatKhau) {
    return res.status(400).json({ message: "❌ Vui lòng cung cấp tên đăng nhập và mật khẩu" });
  }

  try {
    const result = await TaiKhoanModel.login(TenDangNhap);
    const user = result && result.recordset && result.recordset[0];

    if (!user) {
      return res.status(400).json({ message: "❌ Sai tài khoản" });
    }

    // Compare plain text (current DB stores plain text in MatKhauHash)
    if (MatKhau !== user.MatKhauHash) {
      return res.status(400).json({ message: "❌ Sai mật khẩu" });
    }

    // Token - use fallback secret if env missing to avoid crash
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { id: user.MaTK, role: user.VaiTro },
      secret,
      { expiresIn: "2h" }
    );

    res.json({ token, user });
  } catch (err) {
    console.error('Error in login controller:', err);
    res.status(500).json({ message: '❌ Lỗi server khi đăng nhập', error: err.message });
  }
};
