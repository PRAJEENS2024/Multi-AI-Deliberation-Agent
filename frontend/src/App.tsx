import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Chat from './pages/Chat';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-bg text-gray-100 font-sans selection:bg-brand-primary/30">
        <header className="border-b border-dark-border bg-dark-bg/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center font-bold text-white">AI</div>
              <span className="text-xl font-semibold tracking-tight">Jury</span>
            </div>
            <nav className="flex gap-6">
              <a href="/" className="hover:text-brand-primary transition-colors">Home</a>
              <a href="/chat" className="hover:text-brand-primary transition-colors">New Session</a>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:sessionId" element={<Chat />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
