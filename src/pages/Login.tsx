import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export function Login() {
  const { user, loading, signIn } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b' }}>Loading...</div>;
  if (user) return <Navigate to="/" replace />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, color: '#1d1d1f', margin: '0 0 8px', letterSpacing: -0.5 }}>SuperNotes</h1>
        <p style={{ fontSize: 16, color: '#86868b', margin: '0 0 32px' }}>AI-powered transcript notes</p>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => signIn()}
          style={{ padding: '13px 32px', background: '#0071e3', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer', letterSpacing: -0.2 }}
        >
          Sign in with Google
        </motion.button>
      </motion.div>
    </div>
  );
}
