import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import { useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';

function Preloader({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const hasVisited = sessionStorage.getItem('sn:loaded');
    if (hasVisited) {
      onDone();
      return;
    }
    const t = setTimeout(() => {
      sessionStorage.setItem('sn:loaded', '1');
      onDone();
    }, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] bg-[#111827] flex flex-col items-center justify-center"
    >
      {/* Logo */}
      <motion.svg
        width="64" height="64" viewBox="0 0 48 48" fill="none"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring', damping: 15 }}
      >
        <path d="M24 4L41.3205 14V34L24 44L6.67949 34V14L24 4Z" fill="white"/>
        <path d="M18 24H30M30 24L25 19M30 24L25 29" stroke="#111827" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </motion.svg>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-white text-xl font-bold tracking-tight mt-5"
      >
        SuperNotes
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="text-white/30 text-xs mt-1.5"
      >
        AI-powered transcript notes
      </motion.p>

      {/* Loading bar */}
      <motion.div className="w-32 h-0.5 bg-white/10 rounded-full mt-8 overflow-hidden">
        <motion.div
          className="h-full bg-white/60 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.8, delay: 0.3, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const [showPreloader, setShowPreloader] = useState(true);

  return (
    <>
      <Toaster position="bottom-center" theme="dark"
        toastOptions={{
          style: { borderRadius: '16px', fontSize: '13px', fontWeight: 600, background: '#1a1a2e', color: '#fff', border: 'none', boxShadow: '0 8px 30px -8px rgba(0,0,0,0.3)', padding: '12px 20px' },
          classNames: { success: '', error: '', info: '' },
        }} />
      <AnimatePresence>
        {showPreloader && <Preloader onDone={() => setShowPreloader(false)} />}
      </AnimatePresence>
      {!showPreloader && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            </Routes>
          </BrowserRouter>
        </motion.div>
      )}
    </>
  );
}
