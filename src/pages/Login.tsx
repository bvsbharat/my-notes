import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export function Login() {
  const { user, loading, signIn } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SuperNotes</h1>
          <p className="mt-2 text-gray-500">View your transcripts on the web</p>
        </div>
        <button
          onClick={() => signIn()}
          className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
