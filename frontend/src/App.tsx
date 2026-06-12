import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GeneratorPage from './pages/GeneratorPage';
import HomePage from './pages/HomePage';

interface User {
  id: number;
  username: string;
  nombre: string;
}

type Page = 'home' | 'dashboard' | 'generador';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('home');

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
    <div className="flex flex-col h-screen bg-neutral">
      <nav className="bg-neutral border-b border-gray-700 px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 mr-6">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-neutral font-bold text-sm">R</span>
          </div>
          <span className="text-white font-headline font-bold text-lg hidden sm:inline">Recaudación</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('home')}
            className={`px-5 py-2.5 rounded-xl font-headline font-semibold text-sm transition-all shadow-lg ${
              currentPage === 'home'
                ? 'bg-primary text-neutral shadow-primary/30 shadow-lg scale-105'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white hover:shadow-gray-600/30'
            }`}
          >
            HOME
          </button>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`px-5 py-2.5 rounded-xl font-headline font-semibold text-sm transition-all shadow-lg ${
              currentPage === 'dashboard'
                ? 'bg-primary text-neutral shadow-primary/30 shadow-lg scale-105'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white hover:shadow-gray-600/30'
            }`}
          >
            Envío de Correos
          </button>
          <button
            onClick={() => setCurrentPage('generador')}
            className={`px-5 py-2.5 rounded-xl font-headline font-semibold text-sm transition-all shadow-lg ${
              currentPage === 'generador'
                ? 'bg-primary text-neutral shadow-primary/30 shadow-lg scale-105'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white hover:shadow-gray-600/30'
            }`}
          >
            Generador de Nombres
          </button>
        </div>
        
        <div className="flex-1"></div>
        
        <button
          onClick={handleLogout}
          className="px-5 py-2.5 rounded-xl font-headline font-semibold bg-red-600 hover:bg-red-500 text-white text-sm transition-all shadow-lg shadow-red-600/30 hover:shadow-red-500/40"
        >
          Cerrar Sesión
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto bg-neutral">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'generador' && <GeneratorPage />}
      </main>

      <footer className="bg-neutral border-t border-gray-700 px-6 py-3 text-right flex-shrink-0">
        <span className="text-xs sm:text-sm text-gray-400 font-body">Creado por: Marcelo Javier Ramirez Duran</span>
      </footer>
    </div>
  );
}