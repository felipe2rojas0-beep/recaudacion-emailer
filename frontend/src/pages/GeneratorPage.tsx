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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-4">
        <div className="border border-gray-600 rounded-lg p-6 mb-6">
          <h1 className="text-center text-lg font-bold mb-6 border-b border-gray-600 pb-4">
            Sitio Web Genera Nombres a los Archivas Excel Recaudacion por Contratante
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
                accept=".xlsx,.xls,.csv"
                onChange={handleSelectContratantes}
                className="hidden"
              />
              <button
                onClick={() => fileContratantesRef.current?.click()}
                disabled={loading}
                className={`px-6 py-2 border rounded font-medium disabled:opacity-50 whitespace-nowrap ${clickedCargarContratantes ? 'bg-purple-800 border-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 border-gray-500'}`}
              >
                Boton Carga Archivo excel
              </button>
              <button
                onClick={() => setShowContratantesModal(true)}
                disabled={!archivoCargado}
                className="px-6 py-2 bg-blue-700 hover:bg-blue-600 border border-blue-500 rounded font-medium disabled:opacity-50 whitespace-nowrap"
              >
                Ver Contratantes ({contratantes.length})
              </button>
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
                onClick={handleGenerarNombres}
                disabled={loading || !validatedContratantes}
                className={`px-6 py-3 border rounded font-medium disabled:opacity-50 ${clickedGenerarNombres ? 'bg-green-800 border-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 border-gray-500'}`}
              >
                Boton Genera Nombre Para Archivos Excel Recaudacion
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

          <div className="border border-gray-600 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3 border-b border-gray-600 pb-3">
              <h2 className="font-bold text-center flex-1">
                Lista de Nombres de Archivo Excel Recaudacion por Contratantes Cargados
              </h2>
              <button
                onClick={handleDescargarNombres}
                disabled={generatedNames.length === 0 || loading}
                className="px-4 py-2 bg-green-700 hover:bg-green-600 border border-green-500 rounded font-medium disabled:opacity-50 whitespace-nowrap text-sm"
              >
                Descargar Lista Excel
              </button>
            </div>
          <div className="max-h-64 overflow-y-auto">
            {generatedNames.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No hay nombres generados</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-2 px-2">N°</th>
                    <th className="text-left py-2 px-2">RUT</th>
                    <th className="text-left py-2 px-2">ID</th>
                    <th className="text-left py-2 px-2">Nombre Contratante</th>
                    <th className="text-left py-2 px-2">Nombre Archivo</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedNames.map((item, i) => (
                    <tr key={i} className="border-b border-gray-700 hover:bg-gray-800">
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
            <div className="mt-4 text-center text-sm text-gray-400">
              Total: {generatedNames.length} nombre(s) generado(s)
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-start">
          <button
            onClick={handleReset}
            className="text-sm text-yellow-400 hover:text-yellow-300"
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
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">Filas por página:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-gray-700 border border-gray-500 rounded px-2 py-1 text-sm text-white"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <span className="text-sm text-gray-400">
                  Mostrando {startContratanteIdx + 1}-{Math.min(startContratanteIdx + rowsPerPage, contratantes.length)} de {contratantes.length}
                </span>
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
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedContratantes.map((c, i) => (
                        <tr key={startContratanteIdx + i} className="border-b border-gray-700 hover:bg-gray-800">
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
                <div className="flex justify-center items-center gap-2 mt-3 pt-3 border-t border-gray-600">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Anterior
                  </button>
                  {Array.from({ length: totalContratantesPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded text-sm ${
                        currentPage === page
                          ? 'bg-blue-700 border-blue-500 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 border-gray-500'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalContratantesPages, p + 1))}
                    disabled={currentPage === totalContratantesPages}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
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
        );
      })()}
    </div>
  );
}
