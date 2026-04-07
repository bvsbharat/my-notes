import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { VscSearch, VscSettingsGear, VscSignOut, VscChecklist, VscNote } from 'react-icons/vsc';
import { useAuth } from '../hooks/useAuth';
import { useConversations } from '../hooks/useConversations';
import { useTemplates } from '../hooks/useTemplates';
import { useSettings } from '../hooks/useSettings';
import { useNotes } from '../hooks/useNotes';
import { NoteDetailCard } from '../components/NoteDetailCard';
import { TodoView } from '../components/TodoView';
import { displayTitle, safeStructured, safeSegments, conversationDuration } from '../lib/types';
import { toggleTaskCompleted, deleteTask } from '../lib/actions';
import { NoteIcon } from '../lib/noteIcons';

const PAGE_SIZE = 10;

export function Home() {
  const { user, logOut } = useAuth();
  const { conversations, loading } = useConversations(user?.uid);
  const { templates } = useTemplates(user?.uid);
  const { preferences } = useSettings(user?.uid);
  const { notes: savedNotes, saveNote } = useNotes(user?.uid);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'notes' | 'todo'>('notes');

  const filtered = useMemo(() => {
    let list = conversations.filter(c => !c.deleted);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => {
        const s = safeStructured(c);
        const segs = safeSegments(c);
        return displayTitle(c).toLowerCase().includes(q) || (s.overview || '').toLowerCase().includes(q) || segs.some(seg => seg.text.toLowerCase().includes(q));
      });
    }
    return list;
  }, [conversations, search]);

  const paginated = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore = paginated.length < filtered.length;
  const selected = conversations.find(c => c.id === selectedId) || null;

  const allTasks = useMemo(() => {
    return conversations.filter(c => !c.deleted).flatMap(c => {
      const s = safeStructured(c);
      return s.actionItems.map(item => ({ ...item, convId: c.id, convTitle: displayTitle(c), convEmoji: s.emoji, convDate: c.createdAt }));
    });
  }, [conversations]);

  if (!selectedId && paginated.length > 0 && !loading) {
    setTimeout(() => setSelectedId(paginated[0].id), 0);
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans antialiased">
      {/* Header */}
      <header className="flex items-center px-6 h-14 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        {/* Logo */}
        <svg width="32" height="32" viewBox="0 0 48 48" fill="none" className="mr-3">
          <path d="M24 4L41.3205 14V34L24 44L6.67949 34V14L24 4Z" fill="#111827"/>
          <path d="M18 24H30M30 24L25 19M30 24L25 29" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        {/* Toggle: Notes / To-do */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 mr-4">
          <button onClick={() => setMode('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${mode === 'notes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
            <VscNote size={13} /> Notes
          </button>
          <button onClick={() => setMode('todo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${mode === 'todo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
            <VscChecklist size={13} /> To-do
          </button>
        </div>

        <span className="flex-1" />
        <Link to="/settings" className="text-gray-400 hover:text-gray-600 p-2"><VscSettingsGear size={17} /></Link>
        <button onClick={() => logOut()} className="text-gray-400 hover:text-gray-600 p-2 bg-transparent border-none cursor-pointer"><VscSignOut size={17} /></button>
      </header>

      {/* Todo mode */}
      {mode === 'todo' && (
        <TodoView
          tasks={allTasks}
          onSelectConversation={(id) => { setSelectedId(id); setMode('notes'); }}
          onToggleTask={(convId, taskId, completed) => { if (user) toggleTaskCompleted(user.uid, convId, taskId, completed); }}
          onDeleteTask={(convId, taskId) => { if (user) deleteTask(user.uid, convId, taskId); }}
        />
      )}

      {/* Notes mode */}
      {mode === 'notes' && (
        <div className="flex h-[calc(100vh-56px)]">
          {/* LEFT: Note list */}
          <div className="w-[300px] shrink-0 flex flex-col bg-white border-r border-gray-100">
            <div className="p-3 relative">
              <VscSearch size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search notes..."
                className="w-full py-2.5 pl-8 pr-3 bg-gray-50 border-none rounded-xl text-sm text-gray-900 outline-none placeholder:text-gray-300"
              />
            </div>

            <div className="text-xs text-gray-400 px-4 pb-2 font-medium">
              {loading ? 'Loading...' : `${filtered.length} notes`}
            </div>

            <div className="flex-1 overflow-y-auto">
              <AnimatePresence>
                {paginated.map((conv, idx) => {
                  const s = safeStructured(conv);
                  const segs = safeSegments(conv);
                  const dur = conversationDuration(conv);
                  const isActive = conv.id === selectedId;
                  const date = new Date(conv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                  return (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => setSelectedId(conv.id)}
                      className={`px-4 py-3 cursor-pointer transition-colors ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      style={{ borderLeft: isActive ? '3px solid #0071e3' : '3px solid transparent' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <NoteIcon emoji={s.emoji} category={s.category} size={14} />
                        <span className="font-semibold text-sm text-gray-900 truncate flex-1">{displayTitle(conv)}</span>
                        {conv.starred && <span className="text-xs">⭐</span>}
                      </div>
                      {s.overview && (
                        <p className="text-xs text-gray-400 truncate mb-1">{s.overview}</p>
                      )}
                      <div className="flex gap-2 text-[10px] text-gray-300">
                        <span>{date}</span>
                        {dur && <span>{dur}</span>}
                        <span>{segs.length} seg</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {hasMore && (
                <button onClick={() => setPage(p => p + 1)}
                  className="w-[calc(100%-24px)] mx-3 my-2 py-2 bg-gray-50 border-none rounded-lg text-blue-600 text-xs font-medium cursor-pointer">
                  Load more ({filtered.length - paginated.length})
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Note detail - reference card style */}
          <div className="flex-1 overflow-y-auto p-8 flex items-start justify-center">
            <AnimatePresence mode="wait">
              {selected ? (
                <NoteDetailCard
                  key={selected.id}
                  conv={selected}
                  uid={user?.uid}
                  templates={templates}
                  preferences={preferences}
                  savedNotes={savedNotes}
                  saveNote={saveNote}
                />
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-gray-300 text-sm mt-32">
                  Select a note to view
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
