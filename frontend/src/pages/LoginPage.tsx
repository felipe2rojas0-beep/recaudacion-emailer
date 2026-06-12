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
    <div className="min-h-screen bg-theme flex items-center justify-center p-4 transition-colors duration-300">
      <div
        className="p-8 rounded-2xl shadow-2xl w-full max-w-md transition-colors duration-300"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-neutral font-headline font-bold text-xl">R</span>
          </div>
          <h1 className="text-2xl font-headline font-bold" style={{ color: 'var(--text-primary)' }}>
            Recaudación
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-label mb-2" style={{ color: 'var(--text-muted)' }}>
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body transition-colors duration-300"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-label mb-2" style={{ color: 'var(--text-muted)' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body transition-colors duration-300"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl text-sm border border-red-700" style={{ backgroundColor: 'rgba(127,29,29,0.5)', color: '#fca5a5' }}>
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

        <p className="text-xs mt-6 text-center font-label" style={{ color: 'var(--text-muted-light)' }}>
          Usuario por defecto: admin / admin123
        </p>
      </div>
    </div>
  );
}
