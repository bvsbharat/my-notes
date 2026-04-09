import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { VscNote, VscChecklist, VscSettingsGear, VscSearch, VscStarFull } from 'react-icons/vsc';

// Fake placeholder notes for the background
const PLACEHOLDER_NOTES = [
  { title: 'Weekly Team Standup Discussion', category: 'MEETING', tasks: 3, date: 'Apr 7', starred: false, color: 'bg-blue-100' },
  { title: 'Product Roadmap Planning Session', category: 'PLANNING', tasks: 5, date: 'Apr 7', starred: true, color: 'bg-green-100' },
  { title: 'Client Onboarding Call Notes', category: 'MEETING', tasks: 2, date: 'Apr 6', starred: false, color: 'bg-yellow-100' },
  { title: 'Design Review and Feedback', category: 'DESIGN', tasks: 1, date: 'Apr 6', starred: true, color: 'bg-red-100' },
  { title: 'Engineering Sprint Retrospective', category: 'MEETING', tasks: 4, date: 'Apr 5', starred: false, color: 'bg-purple-100' },
  { title: 'Marketing Strategy Brainstorm', category: 'PLANNING', tasks: 2, date: 'Apr 5', starred: false, color: 'bg-pink-100' },
];


function PlaceholderApp() {
  return (
    <div className="h-screen bg-[#f0f1f3] flex items-center justify-center p-6 font-sans antialiased overflow-hidden">
      <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.08)] w-full max-w-[1500px] h-[92vh] flex overflow-hidden">

        {/* Left panel - content area */}
        <div className="flex flex-col overflow-hidden border-r border-gray-100" style={{ width: '70%' }}>
          <div className="shrink-0 h-6" />
          <div className="flex-1 overflow-hidden px-8 pb-8">
            {/* Fake overview */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 0.3, duration: 0.8 }}>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-snug mb-3">Weekly Team Standup Discussion</h1>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xs text-gray-400">Apr 7, 2026</span>
                <span className="text-xs text-gray-400">10:30 AM</span>
                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] text-gray-500">MEETING</span>
              </div>
              <div className="space-y-3 text-[15px] text-gray-500 leading-[1.8]">
                <p>The team discussed progress on the Q2 roadmap, with each member providing updates on their current tasks and blockers...</p>
                <p>Key decisions were made regarding the timeline for the new feature release and resource allocation for the upcoming sprint...</p>
              </div>
              <div className="mt-6">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Tasks (2/3)</p>
                <div className="space-y-1.5">
                  {['Review design mockups for approval', 'Update project timeline in tracker', 'Send meeting notes to stakeholders'].map((t, i) => (
                    <div key={i} className="flex items-center gap-2.5 py-0.5">
                      <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 ${i === 2 ? 'bg-gray-900 text-white' : 'border-2 border-gray-900'}`}>
                        {i === 2 && '✓'}
                      </span>
                      <span className={`text-[14px] font-semibold ${i === 2 ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        <span className={`${['bg-blue-100', 'bg-green-100', ''][i]} px-1 py-0.5 rounded`}>{t}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right panel - notes list */}
        <div className="flex-1 overflow-hidden py-4 px-0 bg-white">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 0.5, duration: 0.8 }}>
            <div className="relative mb-4 px-3">
              <VscSearch size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
              <div className="w-full py-2.5 pl-9 pr-3 bg-white border border-gray-100 rounded-xl text-sm text-gray-300">
                Search notes...
              </div>
            </div>
            <div className="space-y-0">
              {PLACEHOLDER_NOTES.map((note, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                  className={`px-4 py-2.5 border-b border-gray-100/60 ${i === 0 ? 'bg-gray-100' : ''}`}>
                  <p className="text-[14px] font-semibold leading-snug line-clamp-2 text-gray-900">
                    <span className={`${note.color} px-1 py-0.5 rounded`}>{note.title}</span>
                  </p>
                  <div className="flex items-center gap-2 flex-wrap mt-1.5">
                    <span className="text-[10px] text-gray-400">{note.date}</span>
                    {note.tasks > 0 && <span className="text-yellow-700 text-[10px] font-medium">{note.tasks} tasks</span>}
                    <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold tracking-tighter">{note.category}</span>
                    {note.starred && <VscStarFull size={12} className="text-yellow-400 ml-auto" />}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Fake bottom dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.5, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex items-center gap-1 bg-white/80 backdrop-blur-xl rounded-2xl px-2 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-200/50">
          <svg width="24" height="24" viewBox="0 0 48 48" fill="none" className="mx-1">
            <path d="M24 4L41.3205 14V34L24 44L6.67949 34V14L24 4Z" fill="#111827"/>
            <path d="M18 24H30M30 24L25 19M30 24L25 29" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 text-white">
            <VscNote size={13} /> Notes
          </div>
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-gray-400">
            <VscChecklist size={13} /> To-do
          </div>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <div className="text-gray-400 p-2 flex"><VscSettingsGear size={14} /></div>
        </motion.div>
      </div>
    </div>
  );
}

export function Login() {
  const { user, loading, signIn } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f1f3]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-400 text-sm">Loading...</motion.div>
    </div>
  );
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background: placeholder app view */}
      <div className="absolute inset-0">
        <PlaceholderApp />
      </div>

      {/* Glass overlay */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 z-40"
          style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', background: 'rgba(255,255,255,0.4)' }}
        />

        {/* Login modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute inset-0 z-50 flex items-center justify-center"
        >
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] border border-white/50 text-center max-w-sm w-full mx-4">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="flex justify-center mb-6"
            >
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M24 4L41.3205 14V34L24 44L6.67949 34V14L24 4Z" fill="#111827"/>
                <path d="M18 24H30M30 24L25 19M30 24L25 29" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="text-2xl font-bold text-gray-900 tracking-tight mb-1"
            >
              SuperNotes
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="text-sm text-gray-400 mb-8"
            >
              AI-powered transcript notes
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              whileHover={{ scale: 1.03, boxShadow: '0 8px 30px -8px rgba(0,0,0,0.2)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => signIn()}
              className="w-full py-3.5 bg-gray-900 text-white border-none rounded-2xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2.5 transition-shadow"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="text-[11px] text-gray-300 mt-5"
            >
              Your notes are encrypted and private
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
