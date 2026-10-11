import { useState } from 'react';
import ConnectionSetup from './components/ConnectionSetup';
import Dashboard from './components/Dashboard';

export default function App() {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const handleConnect = (url: string) => {
    setServerUrl(url);
    setConnected(true);
  };

  const handleDisconnect = () => {
    setServerUrl(null);
    setConnected(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {!connected ? (
        <ConnectionSetup onConnect={handleConnect} />
      ) : (
        <Dashboard serverUrl={serverUrl!} onDisconnect={handleDisconnect} />
      )}
    </div>
  );
}
