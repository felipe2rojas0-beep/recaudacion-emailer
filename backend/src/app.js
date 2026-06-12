import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import procesamientoRoutes from './routes/procesamiento.js';
import generadorRoutes from './routes/generador.js';
import configRoutes from './routes/config.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/procesamiento', procesamientoRoutes);
app.use('/api/generador', generadorRoutes);
app.use('/api/config', authenticateToken, configRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/smtp-test', authenticateToken, async (req, res) => {
  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    await transporter.verify();
    res.json({ success: true, message: 'SMTP connection successful' });
  } catch (error) {
    res.json({ success: false, error: error.message, code: error.code });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER || 'NO DEFINIDO'}`);
  console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? '***' : 'NO DEFINIDO'}`);
});
