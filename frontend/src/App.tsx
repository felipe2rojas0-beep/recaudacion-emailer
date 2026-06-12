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
    <div className="flex flex-col h-screen">
      <nav className="bg-blue-900 border-b border-blue-700 px-4 py-2 flex items-center gap-4 flex-shrink-0 shadow-lg">
        <span className="text-white font-bold mr-4 hidden sm:inline">Menú:</span>
        <button
          onClick={() => setCurrentPage('home')}
          className={`px-3 py-2 rounded font-medium text-sm sm:text-base ${
            currentPage === 'home'
              ? 'bg-blue-700 text-white'
              : 'bg-blue-800 text-blue-100 hover:bg-blue-700'
          }`}
        >
          HOME
        </button>
        <button
          onClick={() => setCurrentPage('dashboard')}
          className={`px-3 py-2 rounded font-medium text-sm sm:text-base ${
            currentPage === 'dashboard'
              ? 'bg-blue-700 text-white'
              : 'bg-blue-800 text-blue-100 hover:bg-blue-700'
          }`}
        >
          Envío de Correos
        </button>
        <button
          onClick={() => setCurrentPage('generador')}
          className={`px-3 py-2 rounded font-medium text-sm sm:text-base ${
            currentPage === 'generador'
              ? 'bg-blue-700 text-white'
              : 'bg-blue-800 text-blue-100 hover:bg-blue-700'
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

      <main className="flex-1 overflow-y-auto bg-gray-100">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'generador' && <GeneratorPage />}
      </main>

      <footer className="bg-blue-900 border-t border-blue-700 px-4 py-3 text-right flex-shrink-0">
        <span className="text-xs sm:text-sm text-blue-200">Creado por: Marcelo Javier Ramirez Duran</span>
      </footer>
    </div>
  );
}
