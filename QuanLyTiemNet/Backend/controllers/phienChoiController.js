const model = require("../models/phienChoiModel");

exports.getStatus = async (req, res) => {
  res.json(await model.getMayTinhStatus());
};

exports.getKhach = async (req, res) => {
  res.json(await model.getKhachHang());
};

exports.start = async (req, res) => {
  try {
    res.json(await model.startSession(req.body));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Bắt đầu phiên khi user login
exports.beginWhenLogin = async (req, res) => {
  try {
    const { MaKH } = req.body;
    if (!MaKH) {
      return res.status(400).json({ error: "❌ Thiếu MaKH" });
    }
    const phien = await model.beginSessionWhenLogin(MaKH);
    res.json({ message: "✅ Bắt đầu phiên thành công", phien });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Kết thúc phiên khi user logout  
exports.logout = async (req, res) => {
  try {
    console.log("🔍 DEBUG: /logout endpoint được gọi");
    console.log("🔍 Request body:", req.body);

    const { MaKH } = req.body;
    if (!MaKH) {
      console.log("❌ Missing MaKH in logout request");
      return res.status(400).json({ error: "❌ Thiếu MaKH" });
    }
    
    console.log("✅ Gọi model.userLogout với MaKH:", MaKH);
    const result = await model.userLogout(MaKH);
    
    console.log("✅ Logout success:", result);
    res.json(result);
  } catch (err) {
    console.error("❌ Logout error:", err.message);
    res.status(400).json({ error: err.message });
  }
};

exports.stop = async (req, res) => {
  res.json(await model.stopSession(req.params.id));
};
