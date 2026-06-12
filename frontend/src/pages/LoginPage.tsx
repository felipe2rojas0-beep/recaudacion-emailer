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
    <div className="min-h-screen bg-tertiary flex items-center justify-center p-4">
      <div className="bg-neutral-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-neutral-700">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-white font-headline font-bold text-xl">R</span>
          </div>
          <h1 className="text-2xl font-headline font-bold text-white">Recaudación</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-label text-neutral-400 mb-2">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-700 text-white border border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-label text-neutral-400 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-700 text-white border border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body"
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
            className="w-full bg-primary text-white py-3 px-4 rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-headline font-semibold transition-all"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-xs text-neutral-500 mt-6 text-center font-label">
          Usuario por defecto: admin / admin123
        </p>
      </div>
    </div>
  );
}