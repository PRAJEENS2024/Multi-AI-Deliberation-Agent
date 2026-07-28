import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Chat from './pages/Chat';
import Login from './pages/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import './index.css';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-dark-bg text-gray-100 font-sans overflow-hidden selection:bg-brand-primary/30">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <>
              <Sidebar />
              <main className="flex-1 flex flex-col h-full relative">
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/chat/:sessionId" element={<Chat />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
              </main>
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
