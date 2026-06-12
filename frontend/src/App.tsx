import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GeneratorPage from './pages/GeneratorPage';

interface User {
  id: number;
  username: string;
  nombre: string;
}

type Page = 'dashboard' | 'generador';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

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
    setCurrentPage('dashboard');
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen">
      <nav className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center gap-4 flex-shrink-0">
        <span className="text-white font-bold mr-4 hidden sm:inline">Menú:</span>
        <button
          onClick={() => setCurrentPage('dashboard')}
          className={`px-3 py-2 rounded font-medium text-sm sm:text-base ${
            currentPage === 'dashboard'
              ? 'bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Envío de Correos
        </button>
        <button
          onClick={() => setCurrentPage('generador')}
          className={`px-3 py-2 rounded font-medium text-sm sm:text-base ${
            currentPage === 'generador'
              ? 'bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Generador de Nombres
        </button>
        <div className="flex-1"></div>
        <button
          onClick={handleLogout}
          className="px-3 py-2 rounded font-medium bg-red-700 hover:bg-red-600 text-white text-sm sm:text-base"
        >
          Cerrar Sesión
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto bg-black">
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'generador' && <GeneratorPage />}
      </main>

      <footer className="bg-gray-900 border-t border-gray-700 px-4 py-3 text-right flex-shrink-0">
        <span className="text-xs sm:text-sm text-gray-400">Creado por: Marcelo Javier Ramirez Duran</span>
      </footer>
    </div>
  );
}
