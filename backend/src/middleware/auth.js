import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'recaudacion-secret-key-2026';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, nombre: user.nombre },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
};
