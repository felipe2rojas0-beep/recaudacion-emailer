import fs from 'fs';
import path from 'path';
import { paths } from '../config/paths.js';

export const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

export const moveFileToEnviados = (filePath, year, month) => {
  const enviadosDir = paths.enviados(year, month);
  
  if (!fs.existsSync(enviadosDir)) {
    fs.mkdirSync(enviadosDir, { recursive: true });
  }

  const fileName = path.basename(filePath);
  const destPath = path.join(enviadosDir, fileName);
  
  fs.renameSync(filePath, destPath);
  return destPath;
};

export const buildPendientePath = (year, month, rut, id, nombre) => {
  const dir = paths.pendiente(year, month);
  const cleanNombre = nombre.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const fileName = `REC_${rut}_${id}_${cleanNombre}.XLSX`;
  return path.join(dir, fileName);
};
