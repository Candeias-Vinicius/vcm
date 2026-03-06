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

async function sendEmailVerification({ email, token }) {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  if (process.env.RESEND_API_KEY) {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Confirme seu e-mail — VCM',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;">
          <h2 style="color:#FF4655;">Valorant Custom Manager</h2>
          <p>Bem-vindo! Confirme seu e-mail para garantir a recuperação de conta.</p>
          <p>O link expira em <strong>24 horas</strong>.</p>
          <a href="${verifyUrl}"
             style="display:inline-block;background:#FF4655;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Confirmar E-mail
          </a>
          <p style="color:#999;font-size:12px;margin-top:24px;">
            Se você não criou uma conta no VCM, ignore este e-mail.
          </p>
        </div>
      `,
    });
  } else {
    console.log(`[DEV] Verify link para ${email}: ${verifyUrl}`);
  }
}

async function sendEmailChangeConfirmation({ email, token }) {
  const confirmUrl = `${FRONTEND_URL}/verify-email?type=email-change&token=${token}&email=${encodeURIComponent(email)}`;

  if (process.env.RESEND_API_KEY) {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Confirme a troca de e-mail — VCM',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;">
          <h2 style="color:#FF4655;">Valorant Custom Manager</h2>
          <p>Uma solicitação de troca de e-mail foi feita para esta conta.</p>
          <p>Clique no botão abaixo para confirmar. O link expira em <strong>24 horas</strong>.</p>
          <a href="${confirmUrl}"
             style="display:inline-block;background:#FF4655;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Confirmar novo e-mail
          </a>
          <p style="color:#999;font-size:12px;margin-top:24px;">
            Se você não solicitou isso, ignore este e-mail.
          </p>
        </div>
      `,
    });
  } else {
    console.log(`[DEV] Email change confirm link para ${email}: ${confirmUrl}`);
  }
}

module.exports = { sendPasswordReset, sendEmailVerification, sendEmailChangeConfirmation };
