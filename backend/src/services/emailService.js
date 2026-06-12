import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

let transporter = null;

const CONFIG_PATH = path.resolve('smtp-config.json');

function loadSmtpConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function getSmtpConfig() {
  const fileConfig = loadSmtpConfig();
  if (fileConfig && fileConfig.user && fileConfig.pass) {
    return {
      host: fileConfig.host,
      port: parseInt(fileConfig.port) || 587,
      user: fileConfig.user,
      pass: fileConfig.pass,
      from: fileConfig.from || fileConfig.user,
    };
  }
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
  };
}

const getTransporter = () => {
  const config = getSmtpConfig();

  // Recreate transporter if config changed
  if (transporter && transporter.options?.auth?.user !== config.user) {
    transporter = null;
  }

  if (!transporter) {
    console.log('SMTP Config:', {
      host: config.host,
      port: config.port,
      user: config.user ? config.user.substring(0, 5) + '...' : 'NO DEFINIDO',
      pass: config.pass ? '***' : 'NO DEFINIDO'
    });

    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.user,
        pass: config.pass
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
  const config = getSmtpConfig();

  const mailOptions = {
    from: config.from,
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
