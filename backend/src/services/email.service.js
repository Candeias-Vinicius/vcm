const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost';
const EMAIL_FROM = process.env.EMAIL_FROM || 'VCM <noreply@yourdomain.com>';

async function sendPasswordReset({ email, token }) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  if (process.env.RESEND_API_KEY) {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Redefinição de senha — VCM',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;">
          <h2 style="color:#FF4655;">Valorant Custom Manager</h2>
          <p>Você solicitou a redefinição de sua senha.</p>
          <p>Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#FF4655;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Redefinir Senha
          </a>
          <p style="color:#999;font-size:12px;margin-top:24px;">
            Se você não solicitou isso, ignore este e-mail.
          </p>
        </div>
      `,
    });
  } else {
    console.log(`[DEV] Reset link para ${email}: ${resetUrl}`);
  }
}

module.exports = { sendPasswordReset };
