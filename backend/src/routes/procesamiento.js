import { Router } from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { sendEmail, buildEmailBody } from '../services/emailService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${ext}`));
    }
  }
});

const logs = [];
let loadedContratantes = [];
let uploadedRecaudacionesFiles = [];
let uploadedRecaudacionesDirName = '';
let recaudacionesDir = '';

const TEMP_DIR = path.join(process.cwd(), 'temp_uploads');

const ensureTempDir = () => {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
};

const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',' || ch === ';') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
};

const parseExcelBuffer = (buffer, originalname) => {
  if (originalname && originalname.toLowerCase().endsWith('.csv')) {
    let content = buffer.toString('utf-8');
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    const headerLine = parseCSVLine(lines[0]);
    const delimiter = headerLine.length > 1 ? (lines[0].includes(';') ? ';' : ',') : ',';
    const headers = headerLine.length > 1 ? headerLine : lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = delimiter === ';'
        ? parseCSVLine(lines[i])
        : lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
      data.push(row);
    }
    return data;
  }
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet);
};

router.post('/upload-contratantes', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron archivos' });
    }

    const contratantes = [];

    for (const file of req.files) {
      const data = parseExcelBuffer(file.buffer, file.originalname);

      for (const row of data) {
        const rut = row['RUT'] || row['Rut'] || row['rut'] || row['RUT CONTRATANTE'] || row['Rut Contratante'];
        const id = row['ID'] || row['Id'] || row['id'] || row['ID CONTRATANTE'] || row['Id Contratante'];
        const nombre = row['NOMBRE'] || row['Nombre'] || row['nombre'] || row['CONTRATANTE'] || row['Contratante'] || row['contratante'] || row['NOMBRE CONTRATANTE'] || row['Nombre Contratante'];
        const email = row['EMAIL'] || row['Email'] || row['email'] || row['CORREO'] || row['Correo'] || row['correo'] || row['E-MAIL'] || row['E-mail'];

        if (rut && id && nombre && email) {
          contratantes.push({
            rut: String(rut).trim(),
            id: String(id).trim(),
            nombre: String(nombre).trim(),
            email: String(email).trim()
          });
        }
      }
    }

    loadedContratantes = contratantes;

    res.json({
      success: true,
      contratantes,
      message: `Se cargaron ${contratantes.length} contratantes desde ${req.files.length} archivo(s)`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/upload-recaudaciones', upload.array('files', 100), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron archivos' });
    }

    const directoryName = req.body.directoryName || 'DIRECTORIO';

    ensureTempDir();

    const excelFiles = req.files.filter(f =>
      f.originalname.endsWith('.xlsx') || f.originalname.endsWith('.xls') || f.originalname.endsWith('.csv')
    );

    for (const file of excelFiles) {
      const destPath = path.join(TEMP_DIR, file.originalname);
      fs.writeFileSync(destPath, file.buffer);
    }

    uploadedRecaudacionesFiles = excelFiles.map(f => f.originalname);
    uploadedRecaudacionesDirName = directoryName;

    const fileNames = excelFiles.map(f => f.originalname).join(', ');

    res.json({
      success: true,
      directoryName,
      count: excelFiles.length,
      fileNames,
      message: `Directorio "${directoryName}": ${excelFiles.length} archivos cargados`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/set-recaudaciones-dir', (req, res) => {
  try {
    const { directory } = req.body;

    if (!directory) {
      return res.status(400).json({ error: 'Directorio requerido' });
    }

    recaudacionesDir = directory;

    res.json({
      success: true,
      directory,
      message: `Directorio configurado: ${directory}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/validate-contratantes-loaded', (req, res) => {
  try {
    if (loadedContratantes.length === 0) {
      return res.status(400).json({ error: 'No hay contratantes cargados' });
    }

    const errors = [];
    const validated = [];

    for (const c of loadedContratantes) {
      const cErrors = [];
      if (!c.rut) cErrors.push('Falta RUT');
      if (!c.id) cErrors.push('Falta ID');
      if (!c.nombre) cErrors.push('Falta Nombre');
      if (!c.email) cErrors.push('Falta Email');
      if (c.email && !c.email.includes('@')) cErrors.push('Email inválido');

      if (cErrors.length > 0) {
        errors.push(`${c.nombre || 'Sin nombre'}: ${cErrors.join(', ')}`);
      } else {
        validated.push(c);
      }
    }

    loadedContratantes = validated;

    res.json({
      success: true,
      contratantes: validated,
      errors,
      message: errors.length === 0
        ? `Validación exitosa: ${validated.length} contratantes`
        : `Validación con ${errors.length} advertencia(s): ${validated.length} contratantes válidos`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/validate-recaudaciones-loaded', (req, res) => {
  try {
    if (uploadedRecaudacionesFiles.length === 0) {
      return res.status(400).json({ error: 'No hay archivos de recaudaciones cargados' });
    }

    const validFiles = [];
    const invalidFiles = [];

    for (const fileName of uploadedRecaudacionesFiles) {
      const filePath = path.join(TEMP_DIR, fileName);
      try {
        if (fileName.endsWith('.csv')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          if (content.trim().length > 0) {
            validFiles.push(fileName);
          } else {
            invalidFiles.push(fileName);
          }
        } else {
          const buffer = fs.readFileSync(filePath);
          const workbook = xlsx.read(buffer, { type: 'buffer' });
          if (workbook.SheetNames.length > 0) {
            validFiles.push(fileName);
          } else {
            invalidFiles.push(fileName);
          }
        }
      } catch (err) {
        invalidFiles.push(fileName);
      }
    }

    res.json({
      success: true,
      validFiles: validFiles.length,
      invalidFiles: invalidFiles.length,
      fileNames: validFiles.join(', '),
      message: `Archivos válidos: ${validFiles.length}, inválidos: ${invalidFiles.length}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/procesar-envio', async (req, res) => {
  try {
    if (!loadedContratantes || loadedContratantes.length === 0) {
      return res.status(400).json({ error: 'No hay contratantes cargados' });
    }

    if (uploadedRecaudacionesFiles.length === 0) {
      return res.status(400).json({ error: 'No hay archivos de recaudaciones cargados' });
    }

    const enviadosDir = path.join(TEMP_DIR, 'ENVIADOS');
    if (!fs.existsSync(enviadosDir)) {
      fs.mkdirSync(enviadosDir, { recursive: true });
    }

    let enviadosDirReal = null;
    if (recaudacionesDir) {
      const parentDir = path.dirname(recaudacionesDir);
      enviadosDirReal = path.join(parentDir, 'ENVIADOS');
      if (!fs.existsSync(enviadosDirReal)) {
        fs.mkdirSync(enviadosDirReal, { recursive: true });
      }
    }

    const results = [];

    for (const contratante of loadedContratantes) {
      const logEntry = {
        contratante: contratante.nombre,
        rut: contratante.rut,
        id: contratante.id,
        email: contratante.email,
        timestamp: new Date().toISOString(),
        status: 'procesando',
        archivos: [],
        mensaje: ''
      };

      try {
        const rutLimpio = contratante.rut.replace(/[.\-\s]/g, '').toUpperCase();
        const idLimpio = contratante.id.replace(/[.\-\s]/g, '').toUpperCase();
        const nombreLimpio = contratante.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.\-\s]/g, '').toUpperCase();

        const matchedFileNames = uploadedRecaudacionesFiles.filter(f => {
          const upperFile = f.toUpperCase().replace(/[.\-\s]/g, '');
          return upperFile.includes(rutLimpio) && upperFile.includes(idLimpio) && upperFile.includes(nombreLimpio);
        });

        if (matchedFileNames.length === 0) {
          logEntry.status = 'saltado';
          logEntry.mensaje = `No se encontró archivo para ${contratante.nombre}`;
          results.push(logEntry);
          logs.push({ ...logEntry });
          continue;
        }

        const filePaths = matchedFileNames.map(f => path.join(TEMP_DIR, f));
        logEntry.archivos = matchedFileNames;

        const emailBody = buildEmailBody(contratante, filePaths);
        await sendEmail(contratante.email, 'Archivos de Recaudación', emailBody, filePaths);

        for (const file of matchedFileNames) {
          const src = path.join(TEMP_DIR, file);
          const dest = path.join(enviadosDir, file);
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
          }

          if (enviadosDirReal) {
            const destReal = path.join(enviadosDirReal, file);
            if (!fs.existsSync(enviadosDirReal)) {
              fs.mkdirSync(enviadosDirReal, { recursive: true });
            }
            if (fs.existsSync(src)) {
              fs.copyFileSync(src, destReal);
            }
          }

          if (fs.existsSync(src)) {
            fs.unlinkSync(src);
          }
        }

        uploadedRecaudacionesFiles = uploadedRecaudacionesFiles.filter(f => !matchedFileNames.includes(f));

        logEntry.status = 'enviado';
        logEntry.mensaje = `Correo enviado. ${matchedFileNames.length} archivo(s) movido(s) a ENVIADOS`;
        results.push(logEntry);
        logs.push({ ...logEntry });

      } catch (error) {
        logEntry.status = 'error';
        logEntry.mensaje = error.message;
        results.push(logEntry);
        logs.push({ ...logEntry });
      }
    }

    res.json({
      success: true,
      total: loadedContratantes.length,
      procesados: results.filter(r => r.status === 'enviado').length,
      saltados: results.filter(r => r.status === 'saltado').length,
      errores: results.filter(r => r.status === 'error').length,
      results
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/logs', (req, res) => {
  res.json({ logs: logs.slice(-100) });
});

router.delete('/logs', (req, res) => {
  logs.length = 0;
  res.json({ success: true });
});

router.post('/reset', (req, res) => {
  try {
    loadedContratantes = [];
    uploadedRecaudacionesFiles = [];
    uploadedRecaudacionesDirName = '';
    recaudacionesDir = '';
    logs.length = 0;

    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }

    res.json({ success: true, message: 'Sistema reiniciado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
