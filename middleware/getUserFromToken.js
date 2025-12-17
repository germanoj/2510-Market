import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";

export default function getUserFromToken(req, res, next) {
  const auth = req.header("Authorization") || "";
  const [, token] = auth.split(" ");

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, { encoding: "base64" });
    req.user = payload;
  } catch {
    req.user = null;
  }

  next();
}
