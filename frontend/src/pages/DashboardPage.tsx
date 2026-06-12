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
      case 'enviado': return 'bg-green-500/20 text-green-400';
      case 'saltado': return 'bg-yellow-500/20 text-yellow-400';
      case 'error': return 'bg-red-500/20 text-red-400';
      default: return 'tbl-even-alt/50 c-theme-muted';
    }
  };

  return (
    <div className="min-h-full bg-theme c-theme font-body transition-colors duration-300">
      <div className="max-w-6xl mx-auto p-2 sm:p-4">
        <div className="card-solid rounded-2xl p-6 mb-6 shadow-md">
          <h1 className="text-center text-lg font-bold font-headline mb-6 border-b bd-theme pb-4 c-theme">
            Sitio Web Gestion Archivos Excel Recaudacion por Contratante
          </h1>

          <div className="card-solid rounded-2xl p-4 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <label className="whitespace-nowrap font-medium font-label min-w-0 sm:min-w-[280px] c-theme-muted">
                Directorio del Archivo Excel Datos Contratantes :
              </label>
              <input
                type="text"
                value={contratantesFileName || ''}
                readOnly
                placeholder="Seleccione archivo..."
                className="flex-1 px-3 py-2 input-solid rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9C562]"
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
                className={`px-6 py-3 rounded-xl font-headline font-semibold text-sm disabled:opacity-50 whitespace-nowrap transition-all shadow-lg ${clickedCargarContratantes ? 'bg-[#D9C562] text-[#1A1A1B] shadow-[#D9C562]/50 ring-2 ring-[#D9C562] ring-offset-2 ring-offset-theme' : 'bg-[#D9C562] text-[#1A1A1B] hover:bg-yellow-500 shadow-[#D9C562]/30 hover:shadow-[#D9C562]/40 hover:scale-[1.02] active:scale-95'}`}
              >
                Boton Carga Archivo excel
              </button>
              <button
                onClick={() => setShowContratantesModal(true)}
                disabled={contratantes.length === 0}
                className={`px-6 py-3 rounded-xl font-headline font-semibold text-sm disabled:opacity-50 whitespace-nowrap text-white shadow-lg transition-all ${contratantes.length > 0 ? 'bg-[#7A8D6E] hover:bg-green-600 shadow-[#7A8D6E]/40 ring-2 ring-[#7A8D6E] ring-offset-2 ring-offset-theme' : 'bg-[#7A8D6E] shadow-[#7A8D6E]/30 hover:shadow-[#7A8D6E]/40 hover:scale-[1.02] active:scale-95'}`}
              >
                Ver Contratantes ({contratantes.length})
              </button>
            </div>
          </div>

          <div className="card-solid rounded-2xl p-4 mb-4 relative">
            <div className="flex items-center gap-4">
              <label className="whitespace-nowrap font-medium font-label min-w-[280px] c-theme-muted">
                Directorio de los Archivos Excel recaudaciones :
              </label>
              <input
                type="text"
                value={recaudacionesDirName ? `${recaudacionesDirName} (${recaudacionesFileCount} archivos)` : ''}
                readOnly
                placeholder="Seleccione directorio..."
                className="flex-1 px-3 py-2 input-solid rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9C562]"
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
                className={`px-6 py-3 rounded-xl font-headline font-semibold text-sm disabled:opacity-50 whitespace-nowrap transition-all shadow-lg ${clickedCargarRecaudaciones ? 'bg-[#D9C562] text-[#1A1A1B] shadow-[#D9C562]/50 ring-2 ring-[#D9C562] ring-offset-2 ring-offset-theme' : 'bg-[#D9C562] text-[#1A1A1B] hover:bg-yellow-500 shadow-[#D9C562]/30 hover:shadow-[#D9C562]/40 hover:scale-[1.02] active:scale-95'}`}
              >
                Boton Carga Directorio
              </button>
              {recaudacionesFileList.length > 0 && (
                <button
                  onClick={() => setShowFilesModal(true)}
                  className="px-6 py-3 bg-[#7A8D6E] hover:bg-green-600 rounded-xl font-headline font-semibold text-sm whitespace-nowrap text-white shadow-lg shadow-[#7A8D6E]/40 ring-2 ring-[#7A8D6E] ring-offset-2 ring-offset-theme transition-all"
                >
                  Ver Archivos ({recaudacionesFileCount})
                </button>
              )}
            </div>
          </div>

          <div className="card-solid rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6">
              <button
                onClick={handleValidarContratantes}
                disabled={loading || !validContratantes}
                className={`px-6 py-3.5 rounded-xl font-headline font-semibold text-sm disabled:opacity-50 transition-all shadow-lg ${clickedValidarContratantes ? 'bg-[#7A8D6E] text-white shadow-[#7A8D6E]/50 ring-2 ring-[#7A8D6E] ring-offset-2 ring-offset-theme' : 'bg-[#7A8D6E] text-white hover:bg-green-600 shadow-[#7A8D6E]/30 hover:shadow-[#7A8D6E]/40 hover:scale-[1.02] active:scale-95'}`}
              >
                Boton Valida Archivos Excel Contratantes
              </button>
              <button
                onClick={handleValidarRecaudaciones}
                disabled={loading || !validRecaudaciones}
                className={`px-6 py-3.5 rounded-xl font-headline font-semibold text-sm disabled:opacity-50 transition-all shadow-lg ${clickedValidarRecaudaciones ? 'bg-[#7A8D6E] text-white shadow-[#7A8D6E]/50 ring-2 ring-[#7A8D6E] ring-offset-2 ring-offset-theme' : 'bg-[#7A8D6E] text-white hover:bg-green-600 shadow-[#7A8D6E]/30 hover:shadow-[#7A8D6E]/40 hover:scale-[1.02] active:scale-95'}`}
              >
                Boton Valida Archivos Excel Recaudaciones
              </button>
              <button
                onClick={handleEnviarMail}
                disabled={processing || !validatedContratantes || !validatedRecaudaciones || contratantes.length === 0}
                className={`px-6 py-3.5 rounded-xl font-headline font-bold text-sm disabled:opacity-50 transition-all shadow-lg ${clickedEnviarMail ? 'bg-[#D9C562] text-[#1A1A1B] shadow-[#D9C562]/50 ring-2 ring-[#D9C562] ring-offset-2 ring-offset-theme' : 'bg-[#D9C562] text-[#1A1A1B] hover:bg-yellow-500 shadow-[#D9C562]/30 hover:shadow-[#D9C562]/40 hover:scale-[1.02] active:scale-95'}`}
              >
                {processing ? 'Procesando...' : 'Boton Envio Mail Excel Recaudacion por Contratante'}
              </button>
            </div>
          </div>
        </div>

        {statusMsg && (
          <div className="bg-[#D9C562]/20 border border-[#D9C562]/50 text-yellow-300 rounded-2xl p-3 mb-4 text-center">
            {statusMsg}
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 rounded-2xl p-3 mb-4 text-center">
            {error}
            <button onClick={() => setError('')} className="ml-4 underline">Cerrar</button>
          </div>
        )}

        {result && (
          <div className="card-solid rounded-2xl p-4 mb-4 shadow-md">
            <h2 className="font-bold font-headline mb-3 border-b bd-theme pb-2 c-theme">Resultado del Proceso</h2>
            <div className="grid grid-cols-4 gap-4 text-center mb-4">
              <div className="bg-[#D9C562]/20 p-3 rounded-2xl">
                <div className="text-2xl font-bold font-headline text-yellow-400">{result.total}</div>
                <div className="text-[#D9C562] text-sm font-label">Total</div>
              </div>
              <div className="bg-green-500/20 p-3 rounded-2xl">
                <div className="text-2xl font-bold font-headline text-green-400">{result.procesados}</div>
                <div className="text-green-400 text-sm font-label">Enviados</div>
              </div>
              <div className="bg-yellow-500/20 p-3 rounded-2xl">
                <div className="text-2xl font-bold font-headline text-yellow-400">{result.saltados}</div>
                <div className="text-yellow-400 text-sm font-label">Saltados</div>
              </div>
              <div className="bg-red-500/20 p-3 rounded-2xl">
                <div className="text-2xl font-bold font-headline text-red-400">{result.errores}</div>
                <div className="text-red-400 text-sm font-label">Errores</div>
              </div>
            </div>
          </div>
        )}

        {logs.length > 0 && (() => {
          const totalPages = Math.ceil(logs.length / rowsPerPage);
          const startIdx = (currentPage - 1) * rowsPerPage;
          const paginatedLogs = logs.slice(startIdx, startIdx + rowsPerPage);

          return (
            <div className="card-solid rounded-2xl p-4 shadow-md">
              <div className="flex justify-between items-center mb-3 border-b bd-theme pb-3">
                <h2 className="font-bold font-headline c-theme">Historial de Envíos</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-label c-theme-muted">Filas por página:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="tbl-even-alt border bd-theme-light rounded-xl px-2 py-1 text-sm c-theme"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm font-label c-theme-muted">
                    Mostrando {startIdx + 1}-{Math.min(startIdx + rowsPerPage, logs.length)} de {logs.length}
                  </span>
                </div>
              </div>
              <div className="overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="tbl-th">
                      <th className="text-left py-2 px-2">Fecha</th>
                      <th className="text-left py-2 px-2">Contratante</th>
                      <th className="text-left py-2 px-2">RUT</th>
                      <th className="text-left py-2 px-2">Estado</th>
                      <th className="text-left py-2 px-2">Mensaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.map((log, i) => (
                      <tr key={startIdx + i} className={`border-b bd-theme ${i % 2 === 0 ? 'tbl-even' : 'tbl-even-alt/50'} hover:tbl-even-alt`}>
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
                        <td className="py-1 px-2 c-theme-muted">{log.mensaje}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-3 pt-3 border-t bd-theme">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 tbl-even-alt hover:tbl-even-hover rounded-xl text-sm font-headline font-semibold c-theme-sec disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-xl text-sm font-headline font-semibold transition-all shadow-lg ${
                        currentPage === page
                          ? 'bg-[#D9C562] text-[#1A1A1B] shadow-[#D9C562]/30'
                          : 'tbl-even-alt hover:tbl-even-hover c-theme-sec'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 tbl-even-alt hover:tbl-even-hover rounded-xl text-sm font-headline font-semibold c-theme-sec disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
            className="text-sm text-red-400 hover:text-red-300 font-medium font-label"
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
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
            <div className="modal-content rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <h2 className="text-lg font-bold font-headline c-theme">Archivos en Carpeta Pendiente</h2>
                <button
                  onClick={() => setShowFilesModal(false)}
                  className="modal-close text-2xl font-bold leading-none"
                >
                  ×
                </button>
              </div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-label c-theme-muted">Filas por página:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="modal-select rounded-xl px-2 py-1 text-sm font-body"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <span className="text-sm font-label c-theme-muted">
                  Mostrando {startFileIdx + 1}-{Math.min(startFileIdx + rowsPerPage, recaudacionesFileList.length)} de {recaudacionesFileList.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {recaudacionesFileList.length === 0 ? (
                  <p className="modal-empty text-center py-4">No hay archivos cargados</p>
                ) : (
                  <ul className="space-y-2">
                    {paginatedFiles.map((fileName, i) => (
                      <li
                        key={startFileIdx + i}
                        className="modal-file-item flex items-center gap-3 p-3 rounded-xl"
                      >
                        <span className="text-[#D9C562] text-lg">📄</span>
                        <span className="text-sm c-theme-sec">{fileName}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {totalFilesPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="modal-page-btn px-4 py-2 rounded-xl text-sm font-headline font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← Anterior
                  </button>
                  {Array.from({ length: totalFilesPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-xl text-sm font-headline font-semibold transition-all shadow-lg ${
                        currentPage === page ? 'modal-page-btn-active' : 'modal-page-btn'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalFilesPages, p + 1))}
                    disabled={currentPage === totalFilesPages}
                    className="modal-page-btn px-4 py-2 rounded-xl text-sm font-headline font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
              <div className="mt-4 text-center text-sm font-label c-theme-muted">
                Total: {recaudacionesFileCount} archivo(s)
              </div>
              <button
                onClick={() => setShowFilesModal(false)}
                className="modal-footer-btn mt-4 w-full py-3 rounded-xl font-headline font-semibold transition-all shadow-lg"
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
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
            <div className="modal-content rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <h2 className="text-lg font-bold font-headline c-theme">Contratantes Cargados ({contratantes.length})</h2>
                <button
                  onClick={() => setShowContratantesModal(false)}
                  className="modal-close text-2xl font-bold leading-none"
                >
                  ×
                </button>
              </div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-label c-theme-muted">Filas por página:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="modal-select rounded-xl px-2 py-1 text-sm font-body"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <span className="text-sm font-label c-theme-muted">
                  Mostrando {startContratanteIdx + 1}-{Math.min(startContratanteIdx + rowsPerPage, contratantes.length)} de {contratantes.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {contratantes.length === 0 ? (
                  <p className="modal-empty text-center py-4">No hay contratantes cargados</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="modal-th">
                        <th className="text-left py-2 px-2">Nombre</th>
                        <th className="text-left py-2 px-2">RUT</th>
                        <th className="text-left py-2 px-2">ID</th>
                        <th className="text-left py-2 px-2">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedContratantes.map((c, i) => (
                        <tr key={startContratanteIdx + i} className={`modal-tr-hover ${i % 2 === 0 ? 'modal-tr-even' : 'modal-tr-odd'}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td className="py-2 px-2 c-theme-sec">{c.nombre}</td>
                          <td className="py-2 px-2 c-theme-sec">{c.rut}</td>
                          <td className="py-2 px-2 c-theme-sec">{c.id}</td>
                          <td className="py-2 px-2 c-theme-sec">{c.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {totalContratantesPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="modal-page-btn px-4 py-2 rounded-xl text-sm font-headline font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← Anterior
                  </button>
                  {Array.from({ length: totalContratantesPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-xl text-sm font-headline font-semibold transition-all shadow-lg ${
                        currentPage === page ? 'modal-page-btn-active' : 'modal-page-btn'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalContratantesPages, p + 1))}
                    disabled={currentPage === totalContratantesPages}
                    className="modal-page-btn px-4 py-2 rounded-xl text-sm font-headline font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
              <div className="mt-4 text-center text-sm font-label c-theme-muted">
                Total: {contratantes.length} contratante(s)
              </div>
              <button
                onClick={() => setShowContratantesModal(false)}
                className="modal-footer-btn mt-4 w-full py-3 rounded-xl font-headline font-semibold transition-all shadow-lg"
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
