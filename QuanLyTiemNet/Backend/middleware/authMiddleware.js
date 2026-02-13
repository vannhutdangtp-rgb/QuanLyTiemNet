const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // Node.js automatically lowercases header names
  let token = req.headers.authorization;

  if (!token) return res.status(401).json({ message: "❌ Chưa đăng nhập" });

  // Support `Bearer <token>` format
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  }

  const secret = process.env.JWT_SECRET || 'your-secret-key';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) return res.status(403).json({ message: "❌ Token không hợp lệ" });

    req.user = decoded;
    next();
  });
};
