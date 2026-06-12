import { useState, useRef } from 'react';
import { procesamientoAPI } from '../services/api';

interface DashboardPageProps {
  onLogout: () => void;
  user?: { id: number; username: string; nombre: string };
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

type NavSection = 'revenue' | 'files' | 'reports' | 'settings';

export default function DashboardPage({ onLogout, user }: DashboardPageProps) {
  const fileContratantesRef = useRef<HTMLInputElement>(null);
  const fileRecaudacionesRef = useRef<HTMLInputElement>(null);
  const [, setContratantesFileName] = useState('');
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
  const [activeNav, setActiveNav] = useState<NavSection>('revenue');

  const handleSelectContratantes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setClickedCargarContratantes(true);
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
      case 'enviado': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'saltado': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111111] border-r border-[#2a2a2a] flex flex-col">
        <div className="p-6 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-white">Revenue Center</h1>
              <p className="text-xs text-zinc-500">Sistema de Recaudación</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveNav('revenue')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeNav === 'revenue'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                : 'text-zinc-400 hover:bg-[#1a1a1a] hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Revenue
          </button>
          <button
            onClick={() => setActiveNav('files')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeNav === 'files'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                : 'text-zinc-400 hover:bg-[#1a1a1a] hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Files
          </button>
          <button
            onClick={() => setActiveNav('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeNav === 'reports'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                : 'text-zinc-400 hover:bg-[#1a1a1a] hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Reports
          </button>
          <button
            onClick={() => setActiveNav('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeNav === 'settings'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                : 'text-zinc-400 hover:bg-[#1a1a1a] hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-[#2a2a2a] space-y-2">
          <button
            onClick={handleReset}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-[#1a1a1a] hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reiniciar Sistema
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-[#1a1a1a] hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-[#111111] border-b border-[#2a2a2a] px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Gestión de Recaudación</h2>
              <p className="text-sm text-zinc-500">Subir, validar y procesar archivos de contratantes</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm text-green-400">SISTEMA EN LÍNEA</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm text-zinc-400">AUDITORÍA</span>
              </div>
              <div className="flex items-center gap-3 pl-4 border-l border-[#2a2a2a]">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{user?.nombre || 'Administrador'}</p>
                  <p className="text-xs text-zinc-500">admin@recaudacion.cl</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.nombre?.charAt(0) || 'A'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {/* Status Messages */}
          {statusMsg && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-400">{statusMsg}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-400 flex-1">{error}</span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Main Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Contractor Data Card */}
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-orange-400 font-semibold tracking-wider uppercase mb-1">AZURIMIENTO</p>
                  <h3 className="text-xl font-bold text-white">Contractor Data</h3>
                </div>
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 mb-6">
                <div className="text-center">
                  <svg className="w-12 h-12 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-zinc-400 font-medium">Excel Datos Contratantes</p>
                  <p className="text-sm text-zinc-600 mt-1">Arrastre el archivo o haga clic para buscar</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => fileContratantesRef.current?.click()}
                  disabled={loading}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                    clickedCargarContratantes
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
                      : 'bg-[#1a1a1a] border border-[#2a2a2a] text-white hover:bg-[#252525]'
                  } disabled:opacity-50`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Cargar
                  </span>
                </button>
                <input
                  ref={fileContratantesRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleSelectContratantes}
                  className="hidden"
                />
                <button
                  onClick={() => setShowContratantesModal(true)}
                  disabled={contratantes.length === 0}
                  className="flex-1 py-3 px-6 rounded-lg font-semibold bg-[#1a1a1a] border border-[#2a2a2a] text-white hover:bg-[#252525] disabled:opacity-50 transition-all"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver Contratantes ({contratantes.length})
                  </span>
                </button>
              </div>
            </div>

            {/* Revenue Files Card */}
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-orange-400 font-semibold tracking-wider uppercase mb-1">ARCHIVOS PENDIENTES</p>
                  <h3 className="text-xl font-bold text-white">Revenue Files</h3>
                </div>
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 mb-4">
                <p className="text-xs text-zinc-500 mb-2">ARCHIVOS PENDIENTES:</p>
                <div className="flex items-center gap-2 p-3 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                  <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="text-sm text-zinc-400 flex-1 truncate">
                    {recaudacionesDirName || 'C:\Users\Probox\Documents\Recaudacion...'}
                  </span>
                  <button
                    onClick={() => fileRecaudacionesRef.current?.click()}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all"
                  >
                    Examinar
                  </button>
                </div>
              </div>

              {recaudacionesFileList.length > 0 && (
                <div className="mb-4 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-white font-medium">RECAUDACION_GLOBAL_OCT.ZIP</span>
                    <span className="text-xs text-zinc-500 ml-auto">{recaudacionesFileCount} archivos</span>
                  </div>
                </div>
              )}

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
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                  clickedCargarRecaudaciones
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-[#1a1a1a] border border-[#2a2a2a] text-white hover:bg-[#252525]'
                } disabled:opacity-50`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                  </svg>
                  Cargar Directorio
                </span>
              </button>
            </div>
          </div>

          {/* Validation & Reports Section */}
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-6">Validación & Reportes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleValidarContratantes}
                disabled={loading || !validContratantes}
                className={`p-4 rounded-xl border transition-all ${
                  clickedValidarContratantes
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-[#1a1a1a] border-[#2a2a2a] text-zinc-400 hover:bg-[#252525] hover:text-white'
                } disabled:opacity-50`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">Validar Contratantes</p>
                    <p className="text-xs text-zinc-500">Revisión de integridad de datos</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleValidarRecaudaciones}
                disabled={loading || !validRecaudaciones}
                className={`p-4 rounded-xl border transition-all ${
                  clickedValidarRecaudaciones
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-[#1a1a1a] border-[#2a2a2a] text-zinc-400 hover:bg-[#252525] hover:text-white'
                } disabled:opacity-50`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">Validar Recaudaciones</p>
                    <p className="text-xs text-zinc-500">Consistencia de datos bases</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleEnviarMail}
                disabled={processing || !validatedContratantes || !validatedRecaudaciones || contratantes.length === 0}
                className={`p-4 rounded-xl border transition-all ${
                  clickedEnviarMail
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600'
                } disabled:opacity-50`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{processing ? 'Procesando...' : 'Enviar Reportes'}</p>
                    <p className="text-xs text-white/70">Email por Contratante</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Results Section */}
          {result && (
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-white mb-4">Resultado del Proceso</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-white">{result.total}</div>
                  <div className="text-sm text-zinc-500 mt-1">Total</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">{result.procesados}</div>
                  <div className="text-sm text-green-400/70 mt-1">Enviados</div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-400">{result.saltados}</div>
                  <div className="text-sm text-yellow-400/70 mt-1">Saltados</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-400">{result.errores}</div>
                  <div className="text-sm text-red-400/70 mt-1">Errores</div>
                </div>
              </div>
            </div>
          )}

          {/* Logs Table */}
          {logs.length > 0 && (() => {
            const totalPages = Math.ceil(logs.length / rowsPerPage);
            const startIdx = (currentPage - 1) * rowsPerPage;
            const paginatedLogs = logs.slice(startIdx, startIdx + rowsPerPage);

            return (
              <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Historial de Envíos</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-500">Filas por página:</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-zinc-500">
                      Mostrando {startIdx + 1}-{Math.min(startIdx + rowsPerPage, logs.length)} de {logs.length}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2a2a2a]">
                        <th className="text-left py-3 px-4 text-zinc-500 font-medium">Fecha</th>
                        <th className="text-left py-3 px-4 text-zinc-500 font-medium">Contratante</th>
                        <th className="text-left py-3 px-4 text-zinc-500 font-medium">RUT</th>
                        <th className="text-left py-3 px-4 text-zinc-500 font-medium">Estado</th>
                        <th className="text-left py-3 px-4 text-zinc-500 font-medium">Mensaje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLogs.map((log, i) => (
                        <tr key={startIdx + i} className="border-b border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors">
                          <td className="py-3 px-4 text-zinc-400">
                            {new Date(log.timestamp).toLocaleString('es-CL')}
                          </td>
                          <td className="py-3 px-4 text-white">{log.contratante}</td>
                          <td className="py-3 px-4 text-zinc-400 font-mono text-xs">{log.rut}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-500">{log.mensaje}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t border-[#2a2a2a]">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] rounded-lg text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Anterior
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-500 text-white'
                            : 'bg-[#1a1a1a] hover:bg-[#252525] border-[#2a2a2a] text-zinc-400'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] rounded-lg text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Footer Status */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-zinc-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              SISTEMA DE SEGURIDAD ACTIVO
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              BASE DE DATOS: OK/NO
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              ÚLTIMA CONEXIÓN: {new Date().toLocaleDateString('es-CL')}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              ENCRIPTACIÓN: AES-256
            </div>
          </div>
        </div>
      </main>

      {/* Files Modal */}
      {showFilesModal && (() => {
        const totalFilesPages = Math.ceil(recaudacionesFileList.length / rowsPerPage);
        const startFileIdx = (currentPage - 1) * rowsPerPage;
        const paginatedFiles = recaudacionesFileList.slice(startFileIdx, startFileIdx + rowsPerPage);

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4 border-b border-[#2a2a2a] pb-4">
                <h2 className="text-lg font-bold text-white">Archivos en Carpeta Pendiente</h2>
                <button
                  onClick={() => setShowFilesModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#252525] transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-500">Filas por página:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <span className="text-sm text-zinc-500">
                  Mostrando {startFileIdx + 1}-{Math.min(startFileIdx + rowsPerPage, recaudacionesFileList.length)} de {recaudacionesFileList.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {recaudacionesFileList.length === 0 ? (
                  <p className="text-zinc-500 text-center py-4">No hay archivos cargados</p>
                ) : (
                  <ul className="space-y-2">
                    {paginatedFiles.map((fileName, i) => (
                      <li
                        key={startFileIdx + i}
                        className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]"
                      >
                        <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm text-white">{fileName}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {totalFilesPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-3 pt-3 border-t border-[#2a2a2a]">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] rounded-lg text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Anterior
                  </button>
                  {Array.from({ length: totalFilesPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-500 text-white'
                          : 'bg-[#1a1a1a] hover:bg-[#252525] border-[#2a2a2a] text-zinc-400'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalFilesPages, p + 1))}
                    disabled={currentPage === totalFilesPages}
                    className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] rounded-lg text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
              <div className="mt-4 text-center text-sm text-zinc-500">
                Total: {recaudacionesFileCount} archivo(s)
              </div>
              <button
                onClick={() => setShowFilesModal(false)}
                className="mt-4 w-full py-3 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] rounded-lg font-medium text-white transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        );
      })()}

      {/* Contratantes Modal */}
      {showContratantesModal && (() => {
        const totalContratantesPages = Math.ceil(contratantes.length / rowsPerPage);
        const startContratanteIdx = (currentPage - 1) * rowsPerPage;
        const paginatedContratantes = contratantes.slice(startContratanteIdx, startContratanteIdx + rowsPerPage);

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4 border-b border-[#2a2a2a] pb-4">
                <h2 className="text-lg font-bold text-white">Contratantes Cargados ({contratantes.length})</h2>
                <button
                  onClick={() => setShowContratantesModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#252525] transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-500">Filas por página:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <span className="text-sm text-zinc-500">
                  Mostrando {startContratanteIdx + 1}-{Math.min(startContratanteIdx + rowsPerPage, contratantes.length)} de {contratantes.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {contratantes.length === 0 ? (
                  <p className="text-zinc-500 text-center py-4">No hay contratantes cargados</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2a2a2a]">
                        <th className="text-left py-3 px-4 text-zinc-500 font-medium">Nombre</th>
                        <th className="text-left py-3 px-4 text-zinc-500 font-medium">RUT</th>
                        <th className="text-left py-3 px-4 text-zinc-500 font-medium">ID</th>
                        <th className="text-left py-3 px-4 text-zinc-500 font-medium">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedContratantes.map((c, i) => (
                        <tr key={startContratanteIdx + i} className="border-b border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors">
                          <td className="py-3 px-4 text-white">{c.nombre}</td>
                          <td className="py-3 px-4 text-zinc-400 font-mono text-xs">{c.rut}</td>
                          <td className="py-3 px-4 text-zinc-400">{c.id}</td>
                          <td className="py-3 px-4 text-orange-400">{c.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {totalContratantesPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-3 pt-3 border-t border-[#2a2a2a]">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] rounded-lg text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Anterior
                  </button>
                  {Array.from({ length: totalContratantesPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-500 text-white'
                          : 'bg-[#1a1a1a] hover:bg-[#252525] border-[#2a2a2a] text-zinc-400'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalContratantesPages, p + 1))}
                    disabled={currentPage === totalContratantesPages}
                    className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] rounded-lg text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
              <div className="mt-4 text-center text-sm text-zinc-500">
                Total: {contratantes.length} contratante(s)
              </div>
              <button
                onClick={() => setShowContratantesModal(false)}
                className="mt-4 w-full py-3 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] rounded-lg font-medium text-white transition-colors"
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
