import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { VscGithub } from 'react-icons/vsc';

export function Login() {
  const { user, loading, signIn } = useAuth();

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--fg-muted)' }}>loading...</div>;
  if (user) return <Navigate to="/" replace />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center' }}
      >
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>
          {'>'} supernotes
        </div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-muted)', marginBottom: 32 }}>
          // your ai-powered transcript notes
        </p>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => signIn()}
          style={{
            padding: '12px 28px', background: 'var(--accent)', color: 'var(--bg)',
            border: 'none', borderRadius: 8, fontSize: 14,
            fontFamily: 'var(--font-mono)', fontWeight: 600, cursor: 'pointer',
          }}
        >
          sign in with google
        </motion.button>
      </motion.div>
    </div>
  );
}
