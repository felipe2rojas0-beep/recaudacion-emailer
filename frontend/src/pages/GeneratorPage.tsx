import { useState, useRef } from 'react';
import axios from 'axios';

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
    nombre: cleanBOM(c.nombre)
  }));

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default function GeneratorPage() {
  const fileContratantesRef = useRef<HTMLInputElement>(null);
  const [contratantesFileName, setContratantesFileName] = useState('');
  const [showContratantesModal, setShowContratantesModal] = useState(false);

  const [contratantes, setContratantes] = useState<any[]>([]);
  const [generatedNames, setGeneratedNames] = useState<{rut: string; id: string; nombre: string; nombreArchivo: string}[]>([]);
  const [validContratantes, setValidContratantes] = useState(false);
  const [validatedContratantes, setValidatedContratantes] = useState(false);
  const [clickedCargarContratantes, setClickedCargarContratantes] = useState(false);
  const [clickedValidarContratantes, setClickedValidarContratantes] = useState(false);
  const [clickedGenerarNombres, setClickedGenerarNombres] = useState(false);
  const [archivoCargado, setArchivoCargado] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [loading, setLoading] = useState(false);
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
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      const response = await api.post('/generador/upload-contratantes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setContratantes(cleanContratantes(response.data.contratantes));
      setContratantesFileName(files[0].name);
      setValidContratantes(true);
      setArchivoCargado(true);
      setGeneratedNames([]);
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
      const response = await api.post('/generador/validate-contratantes');
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

  const handleGenerarNombres = async () => {
    if (!validContratantes || !validatedContratantes) {
      setError('Primero cargue y valide los contratantes');
      return;
    }
    setClickedGenerarNombres(true);
    setLoading(true);
    setError('');
    setStatusMsg('Generando nombres...');
    try {
      const response = await api.post('/generador/generate-names');
      setGeneratedNames(response.data.names);
      setStatusMsg(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al generar nombres');
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarNombres = async () => {
    if (generatedNames.length === 0) {
      setError('No hay nombres generados para descargar');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/generador/download-names', null, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Nombres_Generados.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Error al descargar nombres');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('¿Está seguro de reiniciar?')) return;
    try {
      await api.post('/generador/reset');
      setContratantes([]);
      setContratantesFileName('');
      setGeneratedNames([]);
      setValidContratantes(false);
      setValidatedContratantes(false);
      setClickedCargarContratantes(false);
      setClickedValidarContratantes(false);
      setClickedGenerarNombres(false);
      setArchivoCargado(false);
      setStatusMsg('Sistema reiniciado');
    } catch (err: any) {
      setError('Error al reiniciar');
    }
  };

  return (
    <div className="min-h-full bg-tertiary text-white">
      <div className="max-w-7xl mx-auto p-2 sm:p-4">
        <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 mb-6">
          <h1 className="text-center text-lg font-headline font-bold mb-6 border-b border-neutral-700 pb-4 text-white">
            Sitio Web Genera Nombres a los Archivas Excel Recaudacion por Contratante
          </h1>

          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 bg-primary rounded-sm"></span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <label className="whitespace-nowrap font-label font-medium min-w-0 sm:min-w-[280px] text-neutral-400">
                Directorio del Archivo Excel Datos Contratantes :
              </label>
              <input
                type="text"
                value={contratantesFileName || ''}
                readOnly
                placeholder="Seleccione archivo..."
                className="flex-1 px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
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
                className={`px-6 py-3 rounded-xl font-headline font-semibold text-sm disabled:opacity-50 whitespace-nowrap transition-all shadow-lg ${clickedCargarContratantes ? 'bg-primary text-white shadow-primary/40' : 'bg-primary text-white hover:bg-orange-600 shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] active:scale-95'}`}
              >
                Boton Carga Archivo excel
              </button>
              <button
                onClick={() => setShowContratantesModal(true)}
                disabled={!archivoCargado}
                className="px-6 py-3 bg-secondary hover:bg-purple-600 rounded-xl font-headline font-semibold text-sm disabled:opacity-50 whitespace-nowrap text-white shadow-lg shadow-secondary/30 hover:shadow-secondary/40 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Ver Contratantes ({contratantes.length})
              </button>
            </div>
          </div>

          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 bg-primary rounded-sm"></span>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6">
              <button
                onClick={handleValidarContratantes}
                disabled={loading || !validContratantes}
                className={`px-6 py-3.5 rounded-xl font-headline font-semibold text-sm disabled:opacity-50 transition-all shadow-lg ${clickedValidarContratantes ? 'bg-green-600 text-white shadow-green-600/40' : 'bg-green-600 text-white hover:bg-green-500 shadow-green-600/30 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-95'}`}
              >
                Boton Valida Archivos Excel Contratantes
              </button>
              <button
                onClick={handleGenerarNombres}
                disabled={loading || !validatedContratantes}
                className={`px-6 py-3.5 rounded-xl font-headline font-bold text-sm disabled:opacity-50 transition-all shadow-lg ${clickedGenerarNombres ? 'bg-primary text-white shadow-primary/40' : 'bg-primary text-white hover:bg-orange-600 shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] active:scale-95'}`}
              >
                Boton Genera Nombre Para Archivos Excel Recaudacion
              </button>
            </div>
          </div>
        </div>

        {statusMsg && (
          <div className="bg-primary bg-opacity-20 border border-primary text-white rounded-2xl p-3 mb-4 text-center font-body">
            {statusMsg}
          </div>
        )}

        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-600 text-red-400 rounded-2xl p-3 mb-4 text-center font-body">
            {error}
            <button onClick={() => setError('')} className="ml-4 underline">Cerrar</button>
          </div>
        )}

          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 shadow-md">
            <div className="flex justify-between items-center mb-3 border-b border-neutral-700 pb-3">
              <h2 className="font-headline font-bold text-center flex-1 text-white">
                Lista de Nombres de Archivo Excel Recaudacion por Contratantes Cargados
              </h2>
              <button
                onClick={handleDescargarNombres}
                disabled={generatedNames.length === 0 || loading}
                className="px-6 py-3 bg-secondary hover:bg-purple-600 rounded-xl font-headline font-semibold text-sm disabled:opacity-50 whitespace-nowrap text-white shadow-lg shadow-secondary/30 hover:shadow-secondary/40 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Descargar Lista Excel
              </button>
            </div>
          <div className="max-h-64 overflow-y-auto">
            {generatedNames.length === 0 ? (
              <p className="text-neutral-400 text-center py-4 font-body">No hay nombres generados</p>
            ) : (
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="bg-neutral-700 text-white">
                    <th className="text-left py-2 px-2">N°</th>
                    <th className="text-left py-2 px-2">RUT</th>
                    <th className="text-left py-2 px-2">ID</th>
                    <th className="text-left py-2 px-2">Nombre Contratante</th>
                    <th className="text-left py-2 px-2">Nombre Archivo</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedNames.map((item, i) => (
                    <tr key={i} className={`border-b border-neutral-700 ${i % 2 === 0 ? 'bg-neutral-800' : 'bg-neutral-750'} hover:bg-neutral-700`}>
                      <td className="py-1 px-2">{i + 1}</td>
                      <td className="py-1 px-2">{item.rut}</td>
                      <td className="py-1 px-2">{item.id}</td>
                      <td className="py-1 px-2">{item.nombre}</td>
                      <td className="py-1 px-2">{item.nombreArchivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {generatedNames.length > 0 && (
            <div className="mt-4 text-center text-sm text-neutral-400 font-body">
              Total: {generatedNames.length} nombre(s) generado(s)
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-start">
          <button
            onClick={handleReset}
            className="text-sm text-red-500 hover:text-red-400 font-body font-medium"
          >
            Reiniciar Sistema
          </button>
        </div>
      </div>

      {showContratantesModal && (() => {
        const totalContratantesPages = Math.ceil(contratantes.length / rowsPerPage);
        const startContratanteIdx = (currentPage - 1) * rowsPerPage;
        const paginatedContratantes = contratantes.slice(startContratanteIdx, startContratanteIdx + rowsPerPage);

        return (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex justify-between items-center mb-4 border-b border-neutral-700 pb-3">
                <h2 className="text-lg font-headline font-bold text-white">Contratantes Cargados ({contratantes.length})</h2>
                <button
                  onClick={() => setShowContratantesModal(false)}
                  className="text-neutral-400 hover:text-red-500 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-neutral-400 font-label">Filas por página:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-neutral-700 border border-neutral-600 rounded-xl px-2 py-1 text-sm text-white"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <span className="text-sm text-neutral-400 font-body">
                  Mostrando {startContratanteIdx + 1}-{Math.min(startContratanteIdx + rowsPerPage, contratantes.length)} de {contratantes.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {contratantes.length === 0 ? (
                  <p className="text-neutral-400 text-center py-4 font-body">No hay contratantes cargados</p>
                ) : (
                  <table className="w-full text-sm font-body">
                    <thead>
                      <tr className="bg-neutral-700 text-white">
                        <th className="text-left py-2 px-2">Nombre</th>
                        <th className="text-left py-2 px-2">RUT</th>
                        <th className="text-left py-2 px-2">ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedContratantes.map((c, i) => (
                        <tr key={startContratanteIdx + i} className={`border-b border-neutral-700 ${i % 2 === 0 ? 'bg-neutral-800' : 'bg-neutral-750'} hover:bg-neutral-700`}>
                          <td className="py-1 px-2">{c.nombre}</td>
                          <td className="py-1 px-2">{c.rut}</td>
                          <td className="py-1 px-2">{c.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {totalContratantesPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-3 pt-3 border-t border-neutral-700">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-xl text-sm font-headline font-semibold text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← Anterior
                  </button>
                  {Array.from({ length: totalContratantesPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-xl text-sm font-headline font-semibold transition-all shadow-lg ${
                        currentPage === page
                          ? 'bg-primary text-white shadow-primary/30'
                          : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalContratantesPages, p + 1))}
                    disabled={currentPage === totalContratantesPages}
                    className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-xl text-sm font-headline font-semibold text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
              <div className="mt-4 text-center text-sm text-neutral-400 font-body">
                Total: {contratantes.length} contratante(s)
              </div>
              <button
                onClick={() => setShowContratantesModal(false)}
                className="mt-4 w-full py-3 bg-neutral-700 hover:bg-neutral-600 rounded-xl font-headline font-semibold text-neutral-300 transition-all shadow-lg hover:shadow-neutral-700/30"
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
