import { useState, useRef } from 'react';
import { procesamientoAPI } from '../services/api';

interface DashboardPageProps {
  onLogout: () => void;
}

interface LogEntry {
  contratante: string;
  rut: string;
  id: string;
  email: string;
  timestamp: string;
  status: string;
  archivos: string[];
  mensaje: string;
}

export default function DashboardPage({ onLogout }: DashboardPageProps) {
  const fileContratantesRef = useRef<HTMLInputElement>(null);
  const fileRecaudacionesRef = useRef<HTMLInputElement>(null);
  const [contratantesFileName, setContratantesFileName] = useState('');
  const [recaudacionesDirName, setRecaudacionesDirName] = useState('');
  const [recaudacionesFileCount, setRecaudacionesFileCount] = useState(0);
  const [recaudacionesFileList, setRecaudacionesFileList] = useState<string[]>([]);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [showContratantesModal, setShowContratantesModal] = useState(false);

  const [contratantes, setContratantes] = useState<any[]>([]);
  const [validContratantes, setValidContratantes] = useState(false);
  const [validRecaudaciones, setValidRecaudaciones] = useState(false);
  const [validatedContratantes, setValidatedContratantes] = useState(false);
  const [validatedRecaudaciones, setValidatedRecaudaciones] = useState(false);
  const [clickedValidarContratantes, setClickedValidarContratantes] = useState(false);
  const [clickedValidarRecaudaciones, setClickedValidarRecaudaciones] = useState(false);
  const [clickedEnviarMail, setClickedEnviarMail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleSelectContratantes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError('');
    setStatusMsg('Cargando archivo de contratantes...');

    try {
      const response = await procesamientoAPI.uploadContratantes(files);
      setContratantes(response.data.contratantes);
      setContratantesFileName(files[0].name);
      setValidContratantes(true);
      setStatusMsg(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar contratantes');
      setContratantes([]);
      setValidContratantes(false);
    } finally {
      setLoading(false);
      if (fileContratantesRef.current) fileContratantesRef.current.value = '';
    }
  };

  const handleSelectRecaudacionesDir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError('');
    setStatusMsg('Cargando archivos de recaudaciones...');

    try {
      const response = await procesamientoAPI.uploadRecaudaciones(files);
      setRecaudacionesDirName(response.data.directoryName);
      setRecaudacionesFileCount(response.data.count);
      setRecaudacionesFileList(response.data.fileNames ? response.data.fileNames.split(', ') : []);

      const relativePath = (files[0] as any).webkitRelativePath || '';
      const dirParts = relativePath.split('/');
      dirParts.pop();
      const dirPath = dirParts.join('/');

      await procesamientoAPI.setRecaudacionesDir(dirPath);

      setValidRecaudaciones(true);
      setStatusMsg(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar recaudaciones');
      setValidRecaudaciones(false);
    } finally {
      setLoading(false);
      if (fileRecaudacionesRef.current) fileRecaudacionesRef.current.value = '';
    }
  };

  const handleValidarContratantes = async () => {
    if (!validContratantes) {
      setError('Primero cargue el archivo de contratantes');
      return;
    }
    setClickedValidarContratantes(true);
    setLoading(true);
    setError('');
    setStatusMsg('Validando archivos Excel de contratantes...');
    try {
      const response = await procesamientoAPI.validateContratantesLoaded();
      setStatusMsg(response.data.message);
      if (response.data.contratantes) {
        setContratantes(response.data.contratantes);
      }
      setValidatedContratantes(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al validar contratantes');
      setValidatedContratantes(false);
    } finally {
      setLoading(false);
    }
  };

  const handleValidarRecaudaciones = async () => {
    if (!validRecaudaciones) {
      setError('Primero cargue el directorio de recaudaciones');
      return;
    }
    setClickedValidarRecaudaciones(true);
    setLoading(true);
    setError('');
    setStatusMsg('Validando archivos Excel de recaudaciones...');
    try {
      const response = await procesamientoAPI.validateRecaudacionesLoaded();
      setStatusMsg(response.data.message);
      setValidatedRecaudaciones(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al validar recaudaciones');
      setValidatedRecaudaciones(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarMail = async () => {
    if (!validContratantes || !validRecaudaciones) {
      setError('Primero cargue y valide ambos directorios');
      return;
    }
    if (contratantes.length === 0) {
      setError('No hay contratantes cargados para procesar');
      return;
    }
    if (!confirm('¿Está seguro de procesar el envío de correos a todos los contratantes?')) return;

    setClickedEnviarMail(true);
    setProcessing(true);
    setResult(null);
    setError('');
    setStatusMsg('Procesando envíos...');

    try {
      const response = await procesamientoAPI.procesarEnvio();
      setResult(response.data);
      setLogs(response.data.results || []);
      setStatusMsg('Proceso completado');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar envíos');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('¿Está seguro de reiniciar el sistema?')) return;
    try {
      await procesamientoAPI.reset();
      setContratantes([]);
      setContratantesFileName('');
      setRecaudacionesDirName('');
      setRecaudacionesFileCount(0);
      setRecaudacionesFileList([]);
      setValidContratantes(false);
      setValidRecaudaciones(false);
      setValidatedContratantes(false);
      setValidatedRecaudaciones(false);
      setClickedValidarContratantes(false);
      setClickedValidarRecaudaciones(false);
      setClickedEnviarMail(false);
      setResult(null);
      setLogs([]);
      setStatusMsg('Sistema reiniciado');
    } catch (err: any) {
      setError('Error al reiniciar sistema');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enviado': return 'bg-green-100 text-green-800 border border-green-300';
      case 'saltado': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'error': return 'bg-red-100 text-red-800 border border-red-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-4">
        <div className="border border-gray-600 rounded-lg p-6 mb-6">
          <h1 className="text-center text-lg font-bold mb-6 border-b border-gray-600 pb-4">
            Sitio Web Gestion Archivos Excel Recaudacion por Contratante
          </h1>

          <div className="border border-gray-600 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 bg-gray-600 rounded-sm"></span>
            </div>
            <div className="flex items-center gap-4">
              <label className="whitespace-nowrap font-medium min-w-[280px]">
                Directorio del Archivo Excel Datos Contratantes :
              </label>
              <input
                type="text"
                value={contratantesFileName || ''}
                readOnly
                placeholder="Seleccione archivo..."
                className="flex-1 px-3 py-2 bg-white text-black border border-gray-400 rounded"
              />
              <input
                ref={fileContratantesRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleSelectContratantes}
                className="hidden"
              />
              <button
                onClick={() => fileContratantesRef.current?.click()}
                disabled={loading}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded font-medium disabled:opacity-50 whitespace-nowrap"
              >
                Boton Carga Archivo excel
              </button>
              <button
                onClick={() => setShowContratantesModal(true)}
                disabled={contratantes.length === 0}
                className="px-6 py-2 bg-blue-700 hover:bg-blue-600 border border-blue-500 rounded font-medium disabled:opacity-50 whitespace-nowrap"
              >
                Ver Contratantes ({contratantes.length})
              </button>
            </div>
          </div>

          <div className="border border-gray-600 rounded-lg p-4 mb-4 relative">
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-center items-center w-8">
              <div className="text-blue-400 text-xs font-bold">▲</div>
              <div className="text-blue-400 text-[10px] leading-tight">XXX</div>
              <div className="text-blue-400 text-[10px] leading-tight">XXX</div>
              <div className="text-blue-400 text-[10px] leading-tight">XXX</div>
              <div className="text-blue-400 text-xs font-bold">▼</div>
            </div>
            <div className="flex items-center gap-2 mb-4 ml-8">
              <span className="w-3 h-3 bg-gray-600 rounded-sm"></span>
            </div>
            <div className="flex items-center gap-4 ml-8">
              <label className="whitespace-nowrap font-medium min-w-[280px]">
                Directorio de los Archivos Excel recaudaciones :
              </label>
              <input
                type="text"
                value={recaudacionesDirName ? `${recaudacionesDirName} (${recaudacionesFileCount} archivos)` : ''}
                readOnly
                placeholder="Seleccione directorio..."
                className="flex-1 px-3 py-2 bg-white text-black border border-gray-400 rounded"
              />
              <input
                ref={fileRecaudacionesRef}
                type="file"
                // @ts-ignore - webkitdirectory is supported by browsers
                webkitdirectory=""
                // @ts-ignore
                directory=""
                multiple
                onChange={handleSelectRecaudacionesDir}
                className="hidden"
              />
              <button
                onClick={() => fileRecaudacionesRef.current?.click()}
                disabled={loading}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded font-medium disabled:opacity-50 whitespace-nowrap"
              >
                Boton Carga Directorio
              </button>
              {recaudacionesFileList.length > 0 && (
                <button
                  onClick={() => setShowFilesModal(true)}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 border border-blue-500 rounded font-medium whitespace-nowrap"
                >
                  Ver Archivos ({recaudacionesFileCount})
                </button>
              )}
            </div>
          </div>

          <div className="border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 bg-gray-600 rounded-sm"></span>
            </div>
            <div className="flex justify-center gap-6">
              <button
                onClick={handleValidarContratantes}
                disabled={loading || !validContratantes}
                className={`px-6 py-3 border rounded font-medium disabled:opacity-50 ${clickedValidarContratantes ? 'bg-green-800 border-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 border-gray-500'}`}
              >
                Boton Valida Archivos Excel Contratantes
              </button>
              <button
                onClick={handleValidarRecaudaciones}
                disabled={loading || !validRecaudaciones}
                className={`px-6 py-3 border rounded font-medium disabled:opacity-50 ${clickedValidarRecaudaciones ? 'bg-green-800 border-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 border-gray-500'}`}
              >
                Boton Valida Archivos Excel Recaudaciones
              </button>
              <button
                onClick={handleEnviarMail}
                disabled={processing || !validatedContratantes || !validatedRecaudaciones || contratantes.length === 0}
                className={`px-6 py-3 border rounded font-medium disabled:opacity-50 ${clickedEnviarMail ? 'bg-green-800 border-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 border-gray-500'}`}
              >
                {processing ? 'Procesando...' : 'Boton Envio Mail Excel Recaudacion por Contratante'}
              </button>
            </div>
          </div>
        </div>

        {statusMsg && (
          <div className="bg-blue-900 border border-blue-600 rounded p-3 mb-4 text-center">
            {statusMsg}
          </div>
        )}

        {error && (
          <div className="bg-red-900 border border-red-600 rounded p-3 mb-4 text-center">
            {error}
            <button onClick={() => setError('')} className="ml-4 underline">Cerrar</button>
          </div>
        )}

        {result && (
          <div className="border border-gray-600 rounded-lg p-4 mb-4">
            <h2 className="font-bold mb-3 border-b border-gray-600 pb-2">Resultado del Proceso</h2>
            <div className="grid grid-cols-4 gap-4 text-center mb-4">
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-2xl font-bold">{result.total}</div>
                <div className="text-gray-400 text-sm">Total</div>
              </div>
              <div className="bg-green-900 p-3 rounded">
                <div className="text-2xl font-bold text-green-400">{result.procesados}</div>
                <div className="text-green-300 text-sm">Enviados</div>
              </div>
              <div className="bg-yellow-900 p-3 rounded">
                <div className="text-2xl font-bold text-yellow-400">{result.saltados}</div>
                <div className="text-yellow-300 text-sm">Saltados</div>
              </div>
              <div className="bg-red-900 p-3 rounded">
                <div className="text-2xl font-bold text-red-400">{result.errores}</div>
                <div className="text-red-300 text-sm">Errores</div>
              </div>
            </div>
          </div>
        )}

        {logs.length > 0 && (
          <div className="border border-gray-600 rounded-lg p-4">
            <h2 className="font-bold mb-3 border-b border-gray-600 pb-2">Historial de Envíos</h2>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-2 px-2">Fecha</th>
                    <th className="text-left py-2 px-2">Contratante</th>
                    <th className="text-left py-2 px-2">RUT</th>
                    <th className="text-left py-2 px-2">Estado</th>
                    <th className="text-left py-2 px-2">Mensaje</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={i} className="border-b border-gray-700 hover:bg-gray-800">
                      <td className="py-1 px-2">
                        {new Date(log.timestamp).toLocaleString('es-CL')}
                      </td>
                      <td className="py-1 px-2">{log.contratante}</td>
                      <td className="py-1 px-2">{log.rut}</td>
                      <td className="py-1 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-1 px-2 text-gray-400">{log.mensaje}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-between">
          <button
            onClick={handleReset}
            className="text-sm text-yellow-400 hover:text-yellow-300"
          >
            Reiniciar Sistema
          </button>
          <button
            onClick={onLogout}
            className="text-sm text-gray-400 hover:text-white"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {showFilesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-3">
              <h2 className="text-lg font-bold">Archivos en Carpeta Pendiente</h2>
              <button
                onClick={() => setShowFilesModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {recaudacionesFileList.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No hay archivos cargados</p>
              ) : (
                <ul className="space-y-2">
                  {recaudacionesFileList.map((fileName, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 p-3 bg-gray-800 rounded border border-gray-700"
                    >
                      <span className="text-blue-400">📄</span>
                      <span className="text-sm">{fileName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4 text-center text-sm text-gray-400">
              Total: {recaudacionesFileCount} archivo(s)
            </div>
            <button
              onClick={() => setShowFilesModal(false)}
              className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {showContratantesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-3">
              <h2 className="text-lg font-bold">Contratantes Cargados ({contratantes.length})</h2>
              <button
                onClick={() => setShowContratantesModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {contratantes.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No hay contratantes cargados</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-2 px-2">Nombre</th>
                      <th className="text-left py-2 px-2">RUT</th>
                      <th className="text-left py-2 px-2">ID</th>
                      <th className="text-left py-2 px-2">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contratantes.map((c, i) => (
                      <tr key={i} className="border-b border-gray-700 hover:bg-gray-800">
                        <td className="py-1 px-2">{c.nombre}</td>
                        <td className="py-1 px-2">{c.rut}</td>
                        <td className="py-1 px-2">{c.id}</td>
                        <td className="py-1 px-2">{c.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="mt-4 text-center text-sm text-gray-400">
              Total: {contratantes.length} contratante(s)
            </div>
            <button
              onClick={() => setShowContratantesModal(false)}
              className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
