import { useState } from 'react';
import { Database, KeyRound, Loader2, Moon, Sun } from 'lucide-react';
import { saveConfig, validateConnection } from '@/api/client';
import { ApiConfig } from '@/types';
import { useTheme } from '@/hooks/useTheme';

interface LoginProps {
  onSuccess: (cfg: ApiConfig) => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const { theme, toggle } = useTheme();
  const [endpoint, setEndpoint] = useState('http://localhost:5000');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!endpoint.trim() || !apiKey.trim()) {
      setError('Both fields are required.');
      return;
    }

    setLoading(true);
    const cfg: ApiConfig = { endpoint: endpoint.trim(), apiKey: apiKey.trim() };

    try {
      await validateConnection(cfg);
      saveConfig(cfg);
      onSuccess(cfg);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Could not connect. Check the endpoint and API key.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      {/* Theme toggle */}
      <button
        onClick={toggle}
        aria-label="Toggle theme"
        className="fixed top-4 right-4 p-2 rounded-lg text-gray-500 dark:text-gray-400
                   hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="w-full max-w-md">
        {/* Logo / title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-brand-600 mb-4 shadow-lg shadow-brand-600/30">
            <Database size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
            Data API Explorer
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Connect to your backend to browse tables
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-gray-200/60
                        dark:shadow-black/40 border border-gray-100 dark:border-gray-800 p-8">
          <form onSubmit={handleConnect} className="space-y-5">
            {/* Endpoint */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                API Endpoint
              </label>
              <input
                type="url"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="http://localhost:5000"
                autoComplete="url"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                           placeholder-gray-400 dark:placeholder-gray-500 text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                           transition-shadow font-mono"
              />
            </div>

            {/* API key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                API Key
              </label>
              <div className="relative">
                <KeyRound
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700
                             bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                             placeholder-gray-400 dark:placeholder-gray-500 text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                             transition-shadow"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40
                            border border-red-200 dark:border-red-800 rounded-lg px-3.5 py-2.5">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                         bg-brand-600 hover:bg-brand-700 active:bg-brand-800
                         text-white text-sm font-medium
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
                         dark:focus:ring-offset-gray-900
                         disabled:opacity-60 disabled:cursor-not-allowed
                         transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Connecting…
                </>
              ) : (
                'Connect'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          Credentials are stored locally in your browser.
        </p>
      </div>
    </div>
  );
}
