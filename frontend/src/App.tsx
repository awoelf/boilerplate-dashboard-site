import { useState } from 'react';
import { clearConfig, loadConfig } from '@/api/client';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import { ApiConfig } from '@/types';

export default function App() {
  const [config, setConfig] = useState<ApiConfig | null>(() => loadConfig());

  function handleSuccess(cfg: ApiConfig) {
    setConfig(cfg);
  }

  function handleLogout() {
    clearConfig();
    setConfig(null);
  }

  if (!config) {
    return <Login onSuccess={handleSuccess} />;
  }

  return <Dashboard config={config} onLogout={handleLogout} />;
}
