import { useState, useRef } from 'react';
import { procesamientoAPI } from '../services/api';

const cleanBOM = (str: string): string => {
  if (!str) return str;
  return str
    .replace(/\uFEFF/g, '')
    .replace(/\uFFFD/g, '')
    .replace(/[\u200B-\u200F\u2028-\u202F\u2060-\u206F\u00A0]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .trim();
};

const cleanContratantes = (arr: any[]) =>
  arr.map(c => ({
    ...c,
    rut: cleanBOM(c.rut),
    id: cleanBOM(c.id),
    nombre: cleanBOM(c.nombre),
    email: cleanBOM(c.email)
  }));

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

export default function DashboardPage() {
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
  const [clickedCargarContratantes, setClickedCargarContratantes] = useState(false);
  const [clickedCargarRecaudaciones, setClickedCargarRecaudaciones] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleSelectContratantes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setClickedCargarContratantes(true);
    setLoading(true);
    setError('');
    setStatusMsg('Cargando archivo de contratantes...');

    try {
      const response = await procesamientoAPI.uploadContratantes(files);
      setContratantes(cleanContratantes(response.data.contratantes));
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

    setClickedCargarRecaudaciones(true);
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
        setContratantes(cleanContratantes(response.data.contratantes));
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
      setClickedCargarContratantes(false);
      setClickedCargarRecaudaciones(false);
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
    <div className="min-h-full bg-gray-100 text-gray-800">
      <div className="max-w-6xl mx-auto p-2 sm:p-4">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-center text-lg font-bold mb-6 border-b border-blue-200 pb-4 text-blue-800">
            Sitio Web Gestion Archivos Excel Recaudacion por Contratante
          </h1>

          <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 bg-blue-600 rounded-sm"></span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <label className="whitespace-nowrap font-medium min-w-0 sm:min-w-[280px] text-blue-800">
                Directorio del Archivo Excel Datos Contratantes :
              </label>
              <input
                type="text"
                value={contratantesFileName || ''}
                readOnly
                placeholder="Seleccione archivo..."
                className="flex-1 px-3 py-2 bg-white text-gray-800 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                ref={fileContratantesRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleSelectContratantes}
                className="hidden"
              />
              <button
                onClick={() => fileContratantesRef.current?.click()}
                disabled={loading}
                className={`px-6 py-2 border rounded-lg font-medium disabled:opacity-50 whitespace-nowrap ${clickedCargarContratantes ? 'bg-blue-700 border-blue-600 text-white' : 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800'}`}
              >
                Boton Carga Archivo excel
              </button>
              <button
                onClick={() => setShowContratantesModal(true)}
                disabled={contratantes.length === 0}
                className="px-6 py-2 bg-blue-700 hover:bg-blue-800 border border-blue-600 rounded-lg font-medium disabled:opacity-50 whitespace-nowrap text-white"
              >
                Ver Contratantes ({contratantes.length})
              </button>
            </div>
          </div>

          <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4 relative">
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-center items-center w-8">
              <div className="text-blue-500 text-xs font-bold">▲</div>
              <div className="text-blue-500 text-[10px] leading-tight">XXX</div>
              <div className="text-blue-500 text-[10px] leading-tight">XXX</div>
              <div className="text-blue-500 text-[10px] leading-tight">XXX</div>
              <div className="text-blue-500 text-xs font-bold">▼</div>
            </div>
            <div className="flex items-center gap-2 mb-4 ml-8">
              <span className="w-3 h-3 bg-blue-600 rounded-sm"></span>
            </div>
            <div className="flex items-center gap-4 ml-8">
              <label className="whitespace-nowrap font-medium min-w-[280px] text-blue-800">
                Directorio de los Archivos Excel recaudaciones :
              </label>
              <input
                type="text"
                value={recaudacionesDirName ? `${recaudacionesDirName} (${recaudacionesFileCount} archivos)` : ''}
                readOnly
                placeholder="Seleccione directorio..."
                className="flex-1 px-3 py-2 bg-white text-gray-800 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className={`px-6 py-2 border rounded-lg font-medium disabled:opacity-50 whitespace-nowrap ${clickedCargarRecaudaciones ? 'bg-blue-700 border-blue-600 text-white' : 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800'}`}
              >
                Boton Carga Directorio
              </button>
              {recaudacionesFileList.length > 0 && (
                <button
                  onClick={() => setShowFilesModal(true)}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 border border-blue-600 rounded-lg font-medium whitespace-nowrap text-white"
                >
                  Ver Archivos ({recaudacionesFileCount})
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 bg-blue-600 rounded-sm"></span>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6">
              <button
                onClick={handleValidarContratantes}
                disabled={loading || !validContratantes}
                className={`px-6 py-3 border rounded-lg font-medium disabled:opacity-50 ${clickedValidarContratantes ? 'bg-green-700 border-green-600 text-white' : 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800'}`}
              >
                Boton Valida Archivos Excel Contratantes
              </button>
              <button
                onClick={handleValidarRecaudaciones}
                disabled={loading || !validRecaudaciones}
                className={`px-6 py-3 border rounded-lg font-medium disabled:opacity-50 ${clickedValidarRecaudaciones ? 'bg-green-700 border-green-600 text-white' : 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800'}`}
              >
                Boton Valida Archivos Excel Recaudaciones
              </button>
              <button
                onClick={handleEnviarMail}
                disabled={processing || !validatedContratantes || !validatedRecaudaciones || contratantes.length === 0}
                className={`px-6 py-3 border rounded-lg font-medium disabled:opacity-50 ${clickedEnviarMail ? 'bg-green-700 border-green-600 text-white' : 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800'}`}
              >
                {processing ? 'Procesando...' : 'Boton Envio Mail Excel Recaudacion por Contratante'}
              </button>
            </div>
          </div>
        </div>

        {statusMsg && (
          <div className="bg-blue-100 border border-blue-400 text-blue-800 rounded-lg p-3 mb-4 text-center">
            {statusMsg}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 rounded-lg p-3 mb-4 text-center">
            {error}
            <button onClick={() => setError('')} className="ml-4 underline">Cerrar</button>
          </div>
        )}

        {result && (
          <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4 shadow-md">
            <h2 className="font-bold mb-3 border-b border-blue-200 pb-2 text-blue-800">Resultado del Proceso</h2>
            <div className="grid grid-cols-4 gap-4 text-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-800">{result.total}</div>
                <div className="text-blue-600 text-sm">Total</div>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{result.procesados}</div>
                <div className="text-green-600 text-sm">Enviados</div>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{result.saltados}</div>
                <div className="text-yellow-600 text-sm">Saltados</div>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{result.errores}</div>
                <div className="text-red-600 text-sm">Errores</div>
              </div>
            </div>
          </div>
        )}

        {logs.length > 0 && (() => {
          const totalPages = Math.ceil(logs.length / rowsPerPage);
          const startIdx = (currentPage - 1) * rowsPerPage;
          const paginatedLogs = logs.slice(startIdx, startIdx + rowsPerPage);

          return (
            <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-md">
              <div className="flex justify-between items-center mb-3 border-b border-blue-200 pb-3">
                <h2 className="font-bold text-blue-800">Historial de Envíos</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-blue-600">Filas por página:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-blue-300 rounded-lg px-2 py-1 text-sm text-gray-800"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-blue-600">
                    Mostrando {startIdx + 1}-{Math.min(startIdx + rowsPerPage, logs.length)} de {logs.length}
                  </span>
                </div>
              </div>
              <div className="overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-800 text-white">
                      <th className="text-left py-2 px-2">Fecha</th>
                      <th className="text-left py-2 px-2">Contratante</th>
                      <th className="text-left py-2 px-2">RUT</th>
                      <th className="text-left py-2 px-2">Estado</th>
                      <th className="text-left py-2 px-2">Mensaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.map((log, i) => (
                      <tr key={startIdx + i} className={`border-b border-blue-100 ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50`}>
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
                        <td className="py-1 px-2 text-gray-600">{log.mensaje}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-3 pt-3 border-t border-blue-200">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-lg text-sm text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded-lg text-sm ${
                        currentPage === page
                          ? 'bg-blue-700 border-blue-600 text-white'
                          : 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-lg text-sm text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        <div className="mt-4 flex justify-start">
          <button
            onClick={handleReset}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Reiniciar Sistema
          </button>
        </div>
      </div>

      {showFilesModal && (() => {
        const totalFilesPages = Math.ceil(recaudacionesFileList.length / rowsPerPage);
        const startFileIdx = (currentPage - 1) * rowsPerPage;
        const paginatedFiles = recaudacionesFileList.slice(startFileIdx, startFileIdx + rowsPerPage);

        return (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white border border-blue-200 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex justify-between items-center mb-4 border-b border-blue-200 pb-3">
                <h2 className="text-lg font-bold text-blue-800">Archivos en Carpeta Pendiente</h2>
                <button
                  onClick={() => setShowFilesModal(false)}
                  className="text-gray-400 hover:text-red-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-blue-600">Filas por página:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-blue-300 rounded-lg px-2 py-1 text-sm text-gray-800"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <span className="text-sm text-blue-600">
                  Mostrando {startFileIdx + 1}-{Math.min(startFileIdx + rowsPerPage, recaudacionesFileList.length)} de {recaudacionesFileList.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {recaudacionesFileList.length === 0 ? (
                  <p className="text-blue-400 text-center py-4">No hay archivos cargados</p>
                ) : (
                  <ul className="space-y-2">
                    {paginatedFiles.map((fileName, i) => (
                      <li
                        key={startFileIdx + i}
                        className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <span className="text-blue-600">📄</span>
                        <span className="text-sm text-gray-800">{fileName}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {totalFilesPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-3 pt-3 border-t border-blue-200">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-lg text-sm text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Anterior
                  </button>
                  {Array.from({ length: totalFilesPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded-lg text-sm ${
                        currentPage === page
                          ? 'bg-blue-700 border-blue-600 text-white'
                          : 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalFilesPages, p + 1))}
                    disabled={currentPage === totalFilesPages}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-lg text-sm text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
              <div className="mt-4 text-center text-sm text-blue-600">
                Total: {recaudacionesFileCount} archivo(s)
              </div>
              <button
                onClick={() => setShowFilesModal(false)}
                className="mt-4 w-full py-2 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-lg font-medium text-blue-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        );
      })()}

      {showContratantesModal && (() => {
        const totalContratantesPages = Math.ceil(contratantes.length / rowsPerPage);
        const startContratanteIdx = (currentPage - 1) * rowsPerPage;
        const paginatedContratantes = contratantes.slice(startContratanteIdx, startContratanteIdx + rowsPerPage);

        return (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white border border-blue-200 rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex justify-between items-center mb-4 border-b border-blue-200 pb-3">
                <h2 className="text-lg font-bold text-blue-800">Contratantes Cargados ({contratantes.length})</h2>
                <button
                  onClick={() => setShowContratantesModal(false)}
                  className="text-gray-400 hover:text-red-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-blue-600">Filas por página:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-blue-300 rounded-lg px-2 py-1 text-sm text-gray-800"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <span className="text-sm text-blue-600">
                  Mostrando {startContratanteIdx + 1}-{Math.min(startContratanteIdx + rowsPerPage, contratantes.length)} de {contratantes.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {contratantes.length === 0 ? (
                  <p className="text-blue-400 text-center py-4">No hay contratantes cargados</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-blue-800 text-white">
                        <th className="text-left py-2 px-2">Nombre</th>
                        <th className="text-left py-2 px-2">RUT</th>
                        <th className="text-left py-2 px-2">ID</th>
                        <th className="text-left py-2 px-2">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedContratantes.map((c, i) => (
                        <tr key={startContratanteIdx + i} className={`border-b border-blue-100 ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50`}>
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
              {totalContratantesPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-3 pt-3 border-t border-blue-200">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-lg text-sm text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Anterior
                  </button>
                  {Array.from({ length: totalContratantesPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded-lg text-sm ${
                        currentPage === page
                          ? 'bg-blue-700 border-blue-600 text-white'
                          : 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalContratantesPages, p + 1))}
                    disabled={currentPage === totalContratantesPages}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-lg text-sm text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
              <div className="mt-4 text-center text-sm text-blue-600">
                Total: {contratantes.length} contratante(s)
              </div>
              <button
                onClick={() => setShowContratantesModal(false)}
                className="mt-4 w-full py-2 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-lg font-medium text-blue-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
