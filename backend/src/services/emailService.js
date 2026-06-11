import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    
    console.log('SMTP Config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: user ? user.substring(0, 5) + '...' : 'NO DEFINIDO',
      pass: pass ? '***' : 'NO DEFINIDO'
    });

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      requireTLS: true,
      auth: {
        user: user,
        pass: pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
};

export const sendEmail = async (to, subject, htmlBody, attachments = []) => {
  const transport = getTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html: htmlBody,
    attachments: attachments.map(filePath => ({
      filename: filePath.split(/[/\\]/).pop(),
      path: filePath
    }))
  };

  const info = await transport.sendMail(mailOptions);
  return info;
};

export const buildEmailBody = (contratante, archivos) => {
  const fileList = archivos.map(f => {
    const fileName = f.split(/[/\\]/).pop();
    return `<li>${fileName}</li>`;
  }).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2 style="color: #2c3e50;">Estimado/a ${contratante.nombre}</h2>
      <p>Le hacemos envío de los documentos de recaudación correspondientes.</p>
      <p><strong>RUT:</strong> ${contratante.rut}</p>
      <p><strong>ID:</strong> ${contratante.id}</p>
      <hr style="border: 1px solid #eee;">
      <h3>Archivos adjuntos:</h3>
      <ul>${fileList}</ul>
      <hr style="border: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        Este es un correo automático, por favor no responda directamente.
      </p>
    </div>
  `;
};
