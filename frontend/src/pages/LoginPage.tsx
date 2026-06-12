import { useState } from 'react';
import { authAPI } from '../services/api';

interface LoginPageProps {
  onLogin: (user: { id: number; username: string; nombre: string }) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(username, password);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      onLogin(user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-neutral font-headline font-bold text-xl">R</span>
          </div>
          <h1 className="text-2xl font-headline font-bold text-white">Recaudación</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-label text-gray-400 mb-2">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-label text-gray-400 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/50 text-red-300 p-3 rounded-xl text-sm border border-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-neutral py-4 px-4 rounded-xl hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed font-headline font-bold text-lg transition-all shadow-xl shadow-primary/40 hover:shadow-primary/50 hover:scale-[1.02] active:scale-95"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-6 text-center font-label">
          Usuario por defecto: admin / admin123
        </p>
      </div>
    </div>
  );
}