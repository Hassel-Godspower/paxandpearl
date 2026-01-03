import crypto from "crypto";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false });
  }

  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    const token = crypto.randomBytes(32).toString("hex");

    return res.status(200).json({
      success: true,
      token
    });
  }

  return res.status(401).json({ success: false });
}
