const KhachHangModel = require("../models/KhachHangModel");
const jwt = require("jsonwebtoken");
const PhienChoiModel = require("../models/phienChoiModel");

const KhachHangController = {

  // GET ALL
  async getAll(req, res) {
    try {
      const data = await KhachHangModel.getAll();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET BY ID
  async getById(req, res) {
    try {
      const kh = await KhachHangModel.getById(req.params.id);
      res.json(kh);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // SEARCH
  async search(req, res) {
    try {
      const keyword = req.query.q || "";
      const data = await KhachHangModel.search(keyword);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // CREATE
  async create(req, res) {
    try {
      const result = await KhachHangModel.create(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // UPDATE
  async update(req, res) {
    try {
      const result = await KhachHangModel.update(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE
  async delete(req, res) {
    try {
      const result = await KhachHangModel.delete(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // LOGIN
  async login(req, res) {
    const TenDangNhap = req.body.TenDangNhap || req.body.tenDangNhap;
    const MatKhau = req.body.MatKhau || req.body.matKhau;

    if (!TenDangNhap || !MatKhau) {
      return res.status(400).json({
        message: "❌ Vui lòng cung cấp tên đăng nhập và mật khẩu",
      });
    }

    try {
      console.log("🔍 Login attempt:", TenDangNhap);

      // 1. Check user
      const result = await KhachHangModel.login(TenDangNhap);
      const user = result?.recordset?.[0];

      if (!user) {
        console.log("❌ User not found:", TenDangNhap);
        return res.status(400).json({ message: "❌ Sai tài khoản" });
      }

      if (MatKhau !== user.MatKhauHash) {
        console.log("❌ Wrong password for:", TenDangNhap);
        return res.status(400).json({ message: "❌ Sai mật khẩu" });
      }

      console.log("✅ Password correct for:", TenDangNhap);

      // 2. Begin session when login
      let phienChoi = null;

      try {
        console.log("📞 Calling beginSessionWhenLogin for MaKH:", user.MaKH);
        phienChoi = await PhienChoiModel.beginSessionWhenLogin(user.MaKH);
        console.log("✅ Session started successfully:", phienChoi?.MaPhien);
      } catch (err) {
        console.error("❌ Begin session error:", err.message);
        return res.status(403).json({
          message: err.message,
        });
      }

      // 3. JWT token
      const secret = process.env.JWT_SECRET || "your-secret-key";

      const token = jwt.sign(
        { MaKH: user.MaKH, VaiTro: "KhachHang" },
        secret,
        { expiresIn: "2h" }
      );

      // 4. Response user
      const userResponse = {
        MaKH: user.MaKH,
        TenKH: user.TenKH,
        TenDangNhap: user.TenDangNhap,
        SoDu: user.SoDu,
        VaiTro: "KhachHang",
      };

      // ✅ TRẢ THÊM PHIÊN CHƠI ĐỂ LOGOUT STOP ĐƯỢC
      console.log("✅ Login success, returning phienChoi:", phienChoi?.MaPhien);
      res.json({
        token,
        user: userResponse,
        phienChoi, // 🔥 quan trọng
      });

    } catch (err) {
      console.error("Error in login controller:", err);
      res.status(500).json({
        message: "❌ Lỗi server khi đăng nhập",
        error: err.message,
      });
    }
  },
};

module.exports = KhachHangController;
