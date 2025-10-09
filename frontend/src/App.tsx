import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';

// Создаем QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Временные страницы-заглушки
const SendMessage = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h1 className="text-2xl font-bold">Send Message</h1>
    <p className="text-gray-600 mt-2">Coming soon...</p>
  </div>
);

const QueueMonitor = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h1 className="text-2xl font-bold">Queue Monitor</h1>
    <p className="text-gray-600 mt-2">Coming soon...</p>
  </div>
);

const Integrations = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h1 className="text-2xl font-bold">Integrations</h1>
    <p className="text-gray-600 mt-2">Coming soon...</p>
  </div>
);

const Analytics = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h1 className="text-2xl font-bold">Analytics</h1>
    <p className="text-gray-600 mt-2">Coming soon...</p>
  </div>
);

const Settings = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h1 className="text-2xl font-bold">Settings</h1>
    <p className="text-gray-600 mt-2">Coming soon...</p>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/send" element={<SendMessage />} />
            <Route path="/queue" element={<QueueMonitor />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;