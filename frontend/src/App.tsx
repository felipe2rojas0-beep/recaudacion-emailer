import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GeneratorPage from './pages/GeneratorPage';
import HomePage from './pages/HomePage';
import ConfigPage from './pages/ConfigPage';

interface User {
  id: number;
  username: string;
  nombre: string;
}

type Page = 'home' | 'dashboard' | 'generador' | 'config';
type Theme = 'dark' | 'light';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('home');
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen bg-theme">
      <nav className="bg-theme-nav bd-theme px-6 py-3 flex items-center gap-4 flex-shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-2 mr-6">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-neutral font-bold text-sm">R</span>
          </div>
          <span className="text-theme font-headline font-bold text-lg hidden sm:inline">Recaudación</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('home')}
            className={`px-5 py-2.5 rounded-xl font-headline font-semibold text-sm transition-all shadow-lg ${
              currentPage === 'home'
                ? 'bg-primary text-neutral shadow-primary/30 shadow-lg scale-105'
                : 'btn-secondary c-theme-sec hover:text-c-theme hover:shadow-gray-600/30'
            }`}
          >
            HOME
          </button>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`px-5 py-2.5 rounded-xl font-headline font-semibold text-sm transition-all shadow-lg ${
              currentPage === 'dashboard'
                ? 'bg-primary text-neutral shadow-primary/30 shadow-lg scale-105'
                : 'btn-secondary c-theme-sec hover:text-c-theme hover:shadow-gray-600/30'
            }`}
          >
            Envío de Correos
          </button>
          <button
            onClick={() => setCurrentPage('generador')}
            className={`px-5 py-2.5 rounded-xl font-headline font-semibold text-sm transition-all shadow-lg ${
              currentPage === 'generador'
                ? 'bg-primary text-neutral shadow-primary/30 shadow-lg scale-105'
                : 'btn-secondary c-theme-sec hover:text-c-theme hover:shadow-gray-600/30'
            }`}
          >
            Generador de Nombres
          </button>
          <button
            onClick={() => setCurrentPage('config')}
            className={`px-5 py-2.5 rounded-xl font-headline font-semibold text-sm transition-all shadow-lg ${
              currentPage === 'config'
                ? 'bg-primary text-neutral shadow-primary/30 shadow-lg scale-105'
                : 'btn-secondary c-theme-sec hover:text-c-theme hover:shadow-gray-600/30'
            }`}
          >
            Configuracion
          </button>
        </div>
        
        <div className="flex-1"></div>
        
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl font-headline font-semibold btn-secondary bd-theme c-theme-sec hover:text-c-theme transition-all shadow-lg"
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        <button
          onClick={handleLogout}
          className="px-5 py-2.5 rounded-xl font-headline font-semibold bg-red-600 hover:bg-red-500 text-white text-sm transition-all shadow-lg shadow-red-600/30 hover:shadow-red-500/40"
        >
          Cerrar Sesión
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto bg-theme transition-colors duration-300">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'generador' && <GeneratorPage />}
        {currentPage === 'config' && <ConfigPage />}
      </main>

      <footer className="bg-theme-nav bd-theme px-6 py-3 text-right flex-shrink-0 transition-colors duration-300">
        <span className="text-xs sm:text-sm c-theme-muted font-body">Creado por: Marcelo Javier Ramirez Duran</span>
      </footer>
    </div>
  );
}
