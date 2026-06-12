import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

const CONFIG_PATH = path.resolve('smtp-config.json');

const DEFAULT_CONFIG = {
  provider: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  user: '',
  pass: '',
  from: '',
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading SMTP config:', e.message);
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

router.get('/', (req, res) => {
  const config = loadConfig();
  res.json(config);
});

router.put('/', (req, res) => {
  try {
    const { provider, host, port, user, pass, from } = req.body;

    if (!host || !port || !user || !pass) {
      return res.status(400).json({ error: 'Faltan campos requeridos (host, port, user, pass)' });
    }

    const config = {
      provider: provider || 'gmail',
      host,
      port: parseInt(port) || 587,
      user,
      pass,
      from: from || user,
    };

    saveConfig(config);

    // Reload env vars so emailService picks up new config
    process.env.SMTP_HOST = config.host;
    process.env.SMTP_PORT = String(config.port);
    process.env.SMTP_USER = config.user;
    process.env.SMTP_PASS = config.pass;
    process.env.SMTP_FROM = config.from;

    res.json({ success: true, message: 'Configuracion guardada', config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/test', async (req, res) => {
  try {
    const { host, port, user, pass } = req.body;

    if (!host || !port || !user || !pass) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
    }

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host,
      port: parseInt(port) || 587,
      secure: false,
      requireTLS: true,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });

    await transporter.verify();
    res.json({ success: true, message: 'Conexion SMTP exitosa' });
  } catch (error) {
    res.json({ success: false, error: error.message, code: error.code });
  }
});

export default router;
