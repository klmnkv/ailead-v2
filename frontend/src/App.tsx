import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './components/Dashboard';
import MessageForm from './components/MessageForm';
import MessageHistory from './components/MessageHistory';
import { Activity } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-3">
                  <Activity className="w-8 h-8 text-blue-600" />
                  <h1 className="text-2xl font-bold text-gray-900">
                    AI.LEAD v2
                  </h1>
                </div>
                <nav className="flex space-x-6">
                  <Link
                    to="/"
                    className="text-gray-700 hover:text-blue-600 font-medium transition"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/send"
                    className="text-gray-700 hover:text-blue-600 font-medium transition"
                  >
                    Отправить сообщение
                  </Link>
                  <Link
                    to="/history"
                    className="text-gray-700 hover:text-blue-600 font-medium transition"
                  >
                    История
                  </Link>
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/send" element={<MessageForm />} />
              <Route path="/history" element={<MessageHistory />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <p className="text-center text-gray-500 text-sm">
                AI.LEAD v2 - Автоматизация сообщений для amoCRM
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;