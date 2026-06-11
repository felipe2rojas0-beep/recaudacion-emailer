import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { paths } from '../config/paths.js';

export const readContratantes = (year, month) => {
  const dir = paths.contratantes(year, month);
  
  if (!fs.existsSync(dir)) {
    throw new Error(`Directorio no encontrado: ${dir}`);
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
  
  if (files.length === 0) {
    throw new Error(`No se encontraron archivos Excel en: ${dir}`);
  }

  const contratantes = [];
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    for (const row of data) {
      const rut = row['RUT'] || row['Rut'] || row['rut'];
      const id = row['ID'] || row['Id'] || row['id'];
      const nombre = row['NOMBRE'] || row['Nombre'] || row['nombre'] || row['CONTRATANTE'];
      const email = row['EMAIL'] || row['Email'] || row['email'] || row['CORREO'];
      
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

  return contratantes;
};

export const readPendienteFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet);
};

export const findRecaudacionFiles = (year, month, rut, id) => {
  const dir = paths.pendiente(year, month);
  
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs.readdirSync(dir).filter(f => 
    (f.endsWith('.xlsx') || f.endsWith('.xls')) &&
    f.toUpperCase().includes(rut.toUpperCase()) &&
    f.toUpperCase().includes(id.toUpperCase())
  );

  return files.map(f => path.join(dir, f));
};
