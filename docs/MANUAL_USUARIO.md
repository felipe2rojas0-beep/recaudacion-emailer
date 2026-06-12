# Manual de Usuario - Recaudación Emailer

## 1. Introducción

**Recaudación Emailer** es una aplicación interna para la gestión y envío de archivos Excel de recaudación a contratantes vía correo electrónico.

### Características Principales
- Envío masivo de archivos Excel de recaudación por correo electrónico
- Generador de nombres estandarizados para archivos
- Interfaz web moderna con React + Tailwind CSS
- Autenticación JWT segura
- Procesamiento de archivos Excel/CSV con manejo de encoding UTF-8

### Arquitectura
```
Frontend (React + Vite)  →  Backend (Express + Node.js)  →  SMTP (Gmail)
     Puerto 5173                  Puerto 3001
```

---

## 2. Requisitos del Sistema

| Requisito | Versión Mínima |
|-----------|----------------|
| Node.js | 18.x |
| npm | 9.x |
| Navegador web | Chrome, Firefox, Edge (últimas versiones) |
| Sistema Operativo | Windows 10/11, Linux, macOS |

### Puertos Requeridos
- **5173**: Frontend (Vite dev server)
- **3001**: Backend (Express API)

---

## 3. Instalación

### 3.1 Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/recaudacion-emailer.git
cd recaudacion-emailer
```

### 3.2 Instalar Backend
```bash
cd backend
npm install
```

### 3.3 Instalar Frontend
```bash
cd frontend
npm install
```

---

## 4. Configuración

### 4.1 Variables de Entorno

El archivo `backend/.env.local` contiene la configuración del sistema:

| Variable | Valor por Defecto | Descripción |
|----------|-------------------|-------------|
| `PORT` | `3001` | Puerto del servidor backend |
| `JWT_SECRET` | `recaudacion-secret-key-2026` | Secreto para firmar tokens JWT |
| `SMTP_HOST` | `smtp.gmail.com` | Servidor SMTP |
| `SMTP_PORT` | `587` | Puerto SMTP (STARTTLS) |
| `SMTP_USER` | `radumasoft1967@gmail.com` | Usuario SMTP |
| `SMTP_PASS` | *(ver archivo)* | Contraseña de aplicación Gmail |
| `SMTP_FROM` | `radumasoft1967@gmail.com` | Dirección del remitente |
| `CORS_ORIGIN` | `http://localhost:5173` | Origen permitido CORS |
| `RECAUDACION_PATH` | `C:\RECAUDACION` | Ruta base para archivos de recaudación |

### 4.2 Configuración SMTP (Gmail)

Para usar Gmail como servidor SMTP:
1. Habilitar verificación en 2 pasos en la cuenta de Google
2. Generar una **Contraseña de Aplicación** en: https://myaccount.google.com/apppasswords
3. Usar esa contraseña en `SMTP_PASS`

### 4.3 Estructura de Directorios del Sistema

```
C:\RECAUDACION\
├── {AÑO}\
│   ├── {MES}\
│   │   ├── CONTRATANTES\    ← Archivos de contratistas
│   │   ├── PENDIENTE\       ← Archivos pendientes de envío
│   │   └── ENVIADOS\        ← Archivos ya enviados
```

---

## 5. Inicio del Sistema

### 5.1 Iniciar Backend
```bash
cd backend
npm run dev
```
El servidor iniciarán en `http://localhost:3001`

### 5.2 Iniciar Frontend
```bash
cd frontend
npm run dev
```
El frontend estará disponible en `http://localhost:5173`

### 5.3 Verificar Funcionamiento
Abrir en el navegador: `http://localhost:5173/`

---

## 6. Autenticación

### 6.1 Credenciales por Defecto
| Campo | Valor |
|-------|-------|
| Usuario | `admin` |
| Contraseña | `admin123` |

### 6.2 Flujo de Autenticación
1. Ingresar usuario y contraseña en el formulario de login
2. El sistema genera un token JWT válido por sesión
3. El token se almacena en `localStorage` del navegador
4. Todas las peticiones API incluyen el header `Authorization: Bearer <token>`

### 6.3 Cerrar Sesión
Hacer clic en "Cerrar Sesión" en la esquina superior derecha. El token se elimina del almacenamiento local.

---

## 7. Módulo: Envío de Correos

### 7.1 Flujo de Trabajo

```
┌─────────────────────┐
│ 1. Cargar           │
│    Contratantes     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. Cargar           │
│    Recaudaciones    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. Validar          │
│    Datos            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. Procesar Envío   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 5. Ver Logs         │
└─────────────────────┘
```

### 7.2 Paso 1: Cargar Contratantes

1. Hacer clic en "Cargar Contratantes"
2. Seleccionar archivo Excel (.xlsx) o CSV
3. **Formato requerido del archivo:**

| RUT | ID | Nombre | Email |
|-----|-----|--------|-------|
| 15421369-0 | 1 | Felipe Antonio Rojas | felipe@ejemplo.com |
| 12345678-5 | 2 | María José Soto | maria@ejemplo.com |

**Columnas aceptadas (variantes):**
- RUT: `RUT`, `Rut`, `RUT CONTRATANTE`, `Rut Contratante`
- ID: `ID`, `Id`, `ID CONTRATANTE`
- Nombre: `NOMBRE`, `Nombre`, `NOMBRE CONTRATANTE`, `Nombre Contratante`
- Email: `EMAIL`, `Email`, `CORREO`, `Correo`

### 7.3 Paso 2: Cargar Recaudaciones

1. Hacer clic en "Cargar Recaudaciones"
2. Seleccionar múltiples archivos Excel
3. **Convención de nombres requerida:**
   ```
   REC_{RUT}_{ID}_{NOMBRE}.xlsx
   ```
   Ejemplo: `REC_154213690_1_FELIPE ANTONIO ROJAS.xlsx`

### 7.4 Paso 3: Validar Datos

1. Hacer clic en "Validar Contratantes"
2. El sistema verifica:
   - Todos los campos obligatorios (RUT, ID, Nombre, Email)
   - Formato de email válido
   - Sin duplicados
3. Hacer clic en "Validar Recaudaciones"
4. El sistema verifica que los archivos sean legibles

### 7.5 Paso 4: Procesar Envío

1. Hacer clic en "Procesar Envio"
2. El sistema para cada contratante:
   - Busca archivos que coincidan con RUT, ID y Nombre
   - Construye correo HTML con la información
   - Adjunta los archivos encontrados
   - Envía por SMTP
   - Mueve archivos a carpeta `ENVIADOS`
3. Se muestra resumen: Total, Enviados, Saltados, Errores

### 7.6 Paso 5: Ver Logs

- Tabla paginada con los últimos 100 registros
- Columnas: Fecha/Hora, Contratante, RUT, Estado, Mensaje
- Estados: `enviado` | `saltado` | `error`

---

## 8. Módulo: Generador de Nombres

### 8.1 Flujo de Trabajo

```
┌─────────────────────┐
│ 1. Cargar           │
│    Contratantes     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. Validar Datos    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. Generar Nombres  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. Descargar Excel  │
└─────────────────────┘
```

### 8.2 Generación de Nombres

El sistema genera nombres en formato:
```
REC_{RUT}_{ID}_{NOMBRE}.XLXS
```

Ejemplo:
```
REC_154213690_1_FELIPE ANTONIO ROJAS.XLXS
```

### 8.3 Descarga

Hacer clic en "Descargar Nombres" para obtener un archivo Excel con la lista generada.

---

## 9. Formato de Archivos

### 9.1 Archivo de Contratantes

**Formato:** Excel (.xlsx) o CSV
**Codificación:** UTF-8 (con o sin BOM)

| Columna | Obligatoria | Descripción |
|---------|-------------|-------------|
| RUT | Sí | RUT del contratante (formato: XXXXXXXX-X) |
| ID | Sí | Identificador numérico |
| Nombre | Sí | Nombre completo |
| Email | Sí (módulo envío) | Correo electrónico válido |

### 9.2 Archivos de Recaudación

**Nombre:** `REC_{RUT}_{ID}_{NOMBRE}.xlsx`
**Contenido:** Datos de recaudación en formato Excel

---

## 10. API REST

### 10.1 Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "nombre": "Administrador"
  }
}
```

### 10.2 Sistema

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Verificar estado del sistema |
| GET | `/api/smtp-test` | Sí | Probar conexión SMTP |

### 10.3 Procesamiento (Envío de Correos)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/procesamiento/upload-contratantes` | Subir archivos de contratantes |
| POST | `/api/procesamiento/upload-recaudaciones` | Subir archivos de recaudación |
| POST | `/api/procesamiento/set-recaudaciones-dir` | Establecer directorio de recaudación |
| POST | `/api/procesamiento/validate-contratantes-loaded` | Validar contratantes cargados |
| POST | `/api/procesamiento/validate-recaudaciones-loaded` | Validar recaudaciones cargadas |
| POST | `/api/procesamiento/procesar-envio` | Procesar envío de correos |
| GET | `/api/procesamiento/logs` | Obtener logs |
| DELETE | `/api/procesamiento/logs` | Limpiar logs |
| POST | `/api/procesamiento/reset` | Reiniciar sistema |

### 10.4 Generador de Nombres

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/generador/upload-contratantes` | Subir archivos de contratantes |
| POST | `/api/generador/validate-contratantes` | Validar contratantes |
| POST | `/api/generador/generate-names` | Generar nombres |
| POST | `/api/generador/download-names` | Descargar nombres como Excel |
| POST | `/api/generador/reset` | Reiniciar sistema |

**Todos los endpoints de procesamiento y generador requieren header:**
```
Authorization: Bearer <token_jwt>
```

---

## 11. Solución de Problemas

### 11.1 Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Credenciales inválidas` | Usuario o contraseña incorrectos | Usar `admin` / `admin123` |
| `Error de conexión SMTP` | Configuración SMTP incorrecta | Verificar `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| `Correo no enviado` | Autenticación SMTP fallida | Generar nueva contraseña de aplicación en Gmail |
| `Archivo no encontrado` | Nombre de archivo no coincide con RUT/ID | Verificar convención `REC_{RUT}_{ID}_{NOMBRE}.xlsx` |
| `Error de encoding` | Caracteres especiales en Excel | Asegurar que el archivo esté en UTF-8 |
| `CORS error` | Origen no permitido | Verificar `CORS_ORIGIN` en `.env.local` |

### 11.2 Puerto en Uso

Si el puerto 3001 o 5173 está ocupado:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill <PID>
```

### 11.3 Limpiar Instalación

```bash
# Backend
cd backend
rmdir /s /q node_modules
npm install

# Frontend
cd frontend
rmdir /s /q node_modules
npm install
```

---

## 12. Seguridad

### 12.1 Credenciales

- **Cambiar contraseña por defecto** en producción
- **No compartir** el archivo `.env.local`
- **Usar contraseñas de aplicación** para Gmail (no la contraseña regular)

### 12.2 JWT

- El token expira según configuración del servidor
- Almacenar en `localStorage` (no en cookies para esta aplicación interna)
- Cerrar sesión al terminar el uso

### 12.3 Archivos

- Los archivos subidos se almacenan temporalmente en `backend/temp_uploads/`
- Los archivos enviados se mueven a `ENVIADOS/`
- **No subir información sensible** en los archivos de recaudación

---

## 13. Información Técnica

### 13.1 Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 3.4 |
| Backend | Node.js, Express 4.21 |
| Email | Nodemailer 6.9 |
| Excel | xlsx (SheetJS) 0.18 |
| Auth | JWT (jsonwebtoken 9.x) + bcryptjs |

### 13.2 Dependencias Principales

**Backend:**
- `express` - Framework web
- `nodemailer` - Envío de correos
- `xlsx` - Lectura de archivos Excel
- `jsonwebtoken` - Autenticación JWT
- `bcryptjs` - Hashing de contraseñas
- `multer` - Manejo de uploads
- `dotenv` - Variables de entorno

**Frontend:**
- `react` - Framework UI
- `axios` - Cliente HTTP
- `tailwindcss` - Estilos

---

**Versión del Manual:** 1.0  
**Última Actualización:** Junio 2026  
**Autor:** Marcelo Javier Ramirez Duran