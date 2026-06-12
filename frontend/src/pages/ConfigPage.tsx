import { useState, useEffect } from 'react';
import { configAPI, smtpTestAPI } from '../services/api';

type Provider = 'gmail' | 'outlook';

interface SmtpConfig {
  provider: Provider;
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

const PRESETS: Record<Provider, { host: string; port: number }> = {
  gmail: { host: 'smtp.gmail.com', port: 587 },
  outlook: { host: 'smtp-mail.outlook.com', port: 587 },
};

export default function ConfigPage() {
  const [config, setConfig] = useState<SmtpConfig>({
    provider: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    user: '',
    pass: '',
    from: '',
  });
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await configAPI.get();
      if (res.data) {
        setConfig(res.data);
      }
    } catch {
      // use defaults
    }
  };

  const handleProviderChange = (provider: Provider) => {
    setConfig(prev => ({
      ...prev,
      provider,
      host: PRESETS[provider].host,
      port: PRESETS[provider].port,
    }));
    setMessage(null);
  };

  const handleFieldChange = (field: keyof SmtpConfig, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const res = await smtpTestAPI.test(config);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Conexion SMTP exitosa. El servidor respondio correctamente.' });
      } else {
        setMessage({ type: 'error', text: `Error: ${res.data.error || 'No se pudo conectar'}` });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al probar conexion' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await configAPI.save(config);
      setMessage({ type: 'success', text: 'Configuracion guardada correctamente.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full p-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-neutral" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-headline font-bold c-theme">Configuracion</h1>
            <p className="text-sm text-c-theme-muted font-body">Configura el metodo de envio de correos</p>
          </div>
        </div>

        {/* Provider Selection */}
        <div className="card-solid rounded-2xl p-6 transition-colors duration-300">
          <h2 className="text-lg font-headline font-semibold c-theme mb-4">Metodo de Envio</h2>
          <p className="text-sm text-c-theme-muted mb-5 font-body">Selecciona el proveedor de correo electronico para enviar los mensajes.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Gmail Card */}
            <button
              onClick={() => handleProviderChange('gmail')}
              className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                config.provider === 'gmail'
                  ? 'border-primary bg-theme-surface/50 shadow-lg shadow-primary/10'
                  : 'bd-theme bg-theme-surface/30 hover:border-primary'
              }`}
            >
              {config.provider === 'gmail' && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-neutral" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-600/20">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-headline font-semibold c-theme">Gmail</h3>
                  <p className="text-xs text-c-theme-muted">Google Mail SMTP</p>
                </div>
              </div>
              <p className="text-xs text-c-theme-muted-light font-body">Usa tu cuenta de Google con una contrasena de aplicacion.</p>
            </button>

            {/* Outlook Card */}
            <button
              onClick={() => handleProviderChange('outlook')}
              className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                config.provider === 'outlook'
                  ? 'border-primary bg-theme-surface/50 shadow-lg shadow-primary/10'
                  : 'bd-theme bg-theme-surface/30 hover:border-primary'
              }`}
            >
              {config.provider === 'outlook' && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-neutral" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-600/20">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M24 7.5v10c0 .83-.67 1.5-1.5 1.5h-21C.67 19 0 18.33 0 17.5v-10C0 6.67.67 6 1.5 6h21c.83 0 1.5.67 1.5 1.5z" fill="#0078D4"/>
                    <path d="M24 7.5l-12 7.5L0 7.5v-1.5l12 7.5 12-7.5V7.5z" fill="#0078D4"/>
                    <path d="M12 15L0 7.5v9c0 .83.67 1.5 1.5 1.5H12V15z" fill="#0057A8"/>
                    <path d="M12 15h10.5c.83 0 1.5-.67 1.5-1.5v-9L12 15z" fill="#0078D4"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-headline font-semibold c-theme">Outlook</h3>
                  <p className="text-xs text-c-theme-muted">Microsoft Outlook SMTP</p>
                </div>
              </div>
              <p className="text-xs text-c-theme-muted-light font-body">Usa tu cuenta de Microsoft o Outlook.com.</p>
            </button>
          </div>
        </div>

        {/* SMTP Configuration Form */}
        <div className="card-solid rounded-2xl p-6 transition-colors duration-300">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-headline font-semibold c-theme">Configuracion SMTP</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Host */}
            <div>
              <label className="block text-sm font-label text-tertiary mb-2">Servidor SMTP</label>
              <input
                type="text"
                value={config.host}
                onChange={(e) => handleFieldChange('host', e.target.value)}
                className="w-full px-4 py-3 input-solid rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body text-sm transition-colors duration-300"
                placeholder="smtp.gmail.com"
              />
            </div>

            {/* Port */}
            <div>
              <label className="block text-sm font-label text-tertiary mb-2">Puerto</label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => handleFieldChange('port', parseInt(e.target.value) || 587)}
                className="w-full px-4 py-3 input-solid rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body text-sm transition-colors duration-300"
                placeholder="587"
              />
            </div>

            {/* User */}
            <div>
              <label className="block text-sm font-label text-tertiary mb-2">Usuario / Email</label>
              <input
                type="email"
                value={config.user}
                onChange={(e) => handleFieldChange('user', e.target.value)}
                className="w-full px-4 py-3 input-solid rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body text-sm transition-colors duration-300"
                placeholder="tu@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-label text-tertiary mb-2">Contrasena / App Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={config.pass}
                  onChange={(e) => handleFieldChange('pass', e.target.value)}
                  className="w-full px-4 py-3 pr-12 input-solid rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body text-sm transition-colors duration-300"
                  placeholder="Contrasena de aplicacion"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-c-theme-muted hover:text-c-theme transition-colors"
                >
                  {showPass ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* From */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-label text-tertiary mb-2">Nombre del remitente</label>
              <input
                type="text"
                value={config.from}
                onChange={(e) => handleFieldChange('from', e.target.value)}
                className="w-full px-4 py-3 input-solid rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body text-sm transition-colors duration-300"
                placeholder="Nombre que aparecera en el remitente"
              />
            </div>
          </div>

          {/* Status message */}
          {message && (
            <div className={`mt-4 p-3 rounded-xl text-sm border font-body ${
              message.type === 'success'
                ? 'bg-secondary/10 text-secondary border-secondary/30'
                : 'bg-red-900/30 text-red-300 border-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={handleTest}
              disabled={testing || !config.user || !config.pass}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-headline font-semibold text-sm transition-all border-2 border-secondary text-secondary hover:bg-secondary hover:text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
            >
              {testing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Probando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Probar conexion
                </>
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !config.user || !config.pass}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-headline font-semibold text-sm transition-all bg-primary text-neutral hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/30 hover:shadow-primary/50"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar configuracion
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Gmail help */}
          {config.provider === 'gmail' && (
            <div className="info-box rounded-2xl p-6 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full border-2 border-c-theme-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-c-theme-muted font-headline font-bold text-sm">i</span>
                </div>
                <h3 className="font-headline font-semibold c-theme text-sm">Ayuda - Gmail</h3>
              </div>
              <ol className="text-sm text-c-theme-secondary space-y-2.5 font-body ml-1">
                <li className="flex gap-2">
                  <span className="text-c-theme-muted-light font-semibold">1.</span>
                  <span>Ve a tu cuenta de <span className="text-primary font-semibold">Google &gt; Seguridad</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-c-theme-muted-light font-semibold">2.</span>
                  <span>Activa la <span className="text-primary font-semibold">verificacion en 2 pasos</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-c-theme-muted-light font-semibold">3.</span>
                  <span>Genera una <span className="text-primary font-semibold">contrasena de aplicacion</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-c-theme-muted-light font-semibold">4.</span>
                  <span>Usa esa contrasena aqui</span>
                </li>
              </ol>
            </div>
          )}

          {/* Outlook help */}
          {config.provider === 'outlook' && (
            <div className="info-box rounded-2xl p-6 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full border-2 border-c-theme-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-c-theme-muted font-headline font-bold text-sm">i</span>
                </div>
                <h3 className="font-headline font-semibold c-theme text-sm">Ayuda - Outlook</h3>
              </div>
              <ol className="text-sm text-c-theme-secondary space-y-2.5 font-body ml-1">
                <li className="flex gap-2">
                  <span className="text-c-theme-muted-light font-semibold">1.</span>
                  <span>Ingresa a <span className="text-primary font-semibold">outlook.com</span> con tu cuenta</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-c-theme-muted-light font-semibold">2.</span>
                  <span>Ve a <span className="text-primary font-semibold">Configuracion &gt; Email &gt; Configuracion de correo</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-c-theme-muted-light font-semibold">3.</span>
                  <span>Habilita el <span className="text-primary font-semibold">acceso SMTP</span> en las opciones de seguridad</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-c-theme-muted-light font-semibold">4.</span>
                  <span>Usa tu contrasena normal o genera una <span className="text-primary font-semibold">app password</span></span>
                </li>
              </ol>
            </div>
          )}

          {/* Current status */}
          <div className="card-solid rounded-2xl p-5 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-headline font-semibold c-theme text-sm">Estado actual</h3>
            </div>
            <div className="space-y-2 text-xs font-body">
              <div className="flex justify-between">
                <span className="text-c-theme-muted">Proveedor:</span>
                <span className="c-theme font-semibold uppercase">{config.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-c-theme-muted">Servidor:</span>
                <span className="c-theme">{config.host}:{config.port}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-c-theme-muted">Usuario:</span>
                <span className="c-theme">{config.user || 'No configurado'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
