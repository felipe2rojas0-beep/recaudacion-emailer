import path from 'path';

const BASE_PATH = process.env.RECAUDACION_PATH || 'C:\\RECAUDACION';

export const paths = {
  base: BASE_PATH,
  contratantes: (year, month) => path.join(BASE_PATH, String(year), month, 'CONTRATANTES'),
  pendiente: (year, month) => path.join(BASE_PATH, String(year), month, 'PENDIENTE'),
  enviados: (year, month) => path.join(BASE_PATH, String(year), month, 'ENVIADOS'),
};

export const months = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
];
