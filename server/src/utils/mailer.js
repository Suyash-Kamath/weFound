import nodemailer from "nodemailer";

const getEnv = () => {
  const SMTP_USER = process.env.SMTP_USER;
  return {
    SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
    SMTP_PORT: Number(process.env.SMTP_PORT || 465),
    SMTP_SECURE: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : true,
    SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM || SMTP_USER || "no-reply@wefound.com",
  };
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

async function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = getEnv();

  if (!SMTP_USER || !SMTP_PASS) {
    // eslint-disable-next-line no-console
    console.warn("SMTP_USER/SMTP_PASS missing. SMTP_USER set:", Boolean(SMTP_USER), "SMTP_PASS set:", Boolean(SMTP_PASS));
    return null;
  }

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  await transport.verify();
  return transport;
}

export async function sendResetEmail({ to, name, token, resetLink }) {
  const { SMTP_FROM } = getEnv();
  let transport;
  try {
    transport = await getTransport();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("SMTP verify failed:", error);
    return false;
  }
  if (!transport) {
    // eslint-disable-next-line no-console
    console.warn("SMTP not configured. Skipping email send.");
    // Handy for local development only; a reset link in production logs would
    // let anyone with log access take over the account.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log(`Reset link for ${to}: ${resetLink}`);
    }
    return false;
  }
  const displayName = name || "there";
  const subject = "Reset your weFound password";
  const text = `Hi ${displayName},\n\nReset your password using this link:\n${resetLink}\n\nOr use this reset token:\n${token}\n\nIf you did not request this, you can ignore this email.\n\n- weFound`;
  const safeLink = escapeHtml(resetLink);
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2>Password Reset Request</h2>
      <p>Hi ${escapeHtml(displayName)},</p>
      <p>Click the button below to reset your password:</p>
      <p>
        <a href="${safeLink}" style="display:inline-block;background:#0fb5a0;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
          Reset Password
        </a>
      </p>
      <p>If the button doesn't work, use this link:</p>
      <p><a href="${safeLink}">${safeLink}</a></p>
      <p>Reset token (if prompted): <strong>${escapeHtml(token)}</strong></p>
      <p>If you did not request this, you can ignore this email.</p>
      <p>— weFound</p>
    </div>
  `;

  try {
    await transport.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Sending reset email failed:", error);
    return false;
  }
  return true;
}
