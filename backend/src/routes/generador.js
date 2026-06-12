import { Router } from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

let loadedContratantes = [];
let generatedNames = [];

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

const parseExcelFile = (buffer, originalname) => {
  const ext = path.extname(originalname).toLowerCase();

  if (ext === '.csv') {
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
  } else {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return xlsx.utils.sheet_to_json(sheet);
  }
};

const cleanForFilename = (str) => {
  return str
    .replace(/[\/\\:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
};

router.post('/upload-contratantes', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se seleccionó archivo' });
    }

    const contratantes = [];

    for (const file of req.files) {
      const data = parseExcelFile(file.buffer, file.originalname);

      for (const row of data) {
        const rut = row['RUT'] || row['Rut'] || row['rut'] || row['RUT CONTRATANTE'] || row['Rut Contratante'];
        const id = row['ID'] || row['Id'] || row['id'] || row['ID CONTRATANTE'] || row['Id Contratante'];
        const nombre = row['NOMBRE'] || row['Nombre'] || row['nombre'] || row['CONTRATANTE'] || row['Contratante'] || row['contratante'] || row['NOMBRE CONTRATANTE'] || row['Nombre Contratante'];

        if (rut && id && nombre) {
          contratantes.push({
            rut: String(rut).trim(),
            id: String(id).trim(),
            nombre: String(nombre).trim()
          });
        }
      }
    }

    loadedContratantes = contratantes;
    generatedNames = [];

    res.json({
      success: true,
      contratantes,
      message: `Se cargaron ${contratantes.length} contratantes desde ${req.files.length} archivo(s)`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/validate-contratantes', (req, res) => {
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
        : `Validación con ${errors.length} advertencia(s): ${validated.length} válidos`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-names', (req, res) => {
  try {
    if (loadedContratantes.length === 0) {
      return res.status(400).json({ error: 'No hay contratantes cargados' });
    }

    generatedNames = loadedContratantes.map(c => {
      const rutClean = cleanForFilename(c.rut);
      const idClean = cleanForFilename(c.id);
      const nombreClean = cleanForFilename(c.nombre);
      return `REC_${rutClean}_${idClean}_${nombreClean}.XLXS`;
    });

    res.json({
      success: true,
      names: generatedNames,
      count: generatedNames.length,
      message: `Se generaron ${generatedNames.length} nombres de archivos`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/download-names', (req, res) => {
  try {
    if (generatedNames.length === 0) {
      return res.status(400).json({ error: 'No hay nombres generados para descargar' });
    }

    const wsData = [['N°', 'Nombre Archivo']];
    generatedNames.forEach((name, i) => {
      wsData.push([i + 1, name]);
    });

    const ws = xlsx.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 5 }, { wch: 60 }];

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Nombres Generados');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=Nombres_Generados.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reset', (req, res) => {
  try {
    loadedContratantes = [];
    generatedNames = [];
    res.json({ success: true, message: 'Sistema reiniciado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
