import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { VscSearch, VscSettingsGear, VscSignOut, VscChecklist, VscNote } from 'react-icons/vsc';
import { useAuth } from '../hooks/useAuth';
import { useConversations } from '../hooks/useConversations';
import { useTemplates } from '../hooks/useTemplates';
import { useSettings } from '../hooks/useSettings';
import { useNotes } from '../hooks/useNotes';
import { NoteDetail } from '../components/NoteDetail';
import { TodoView } from '../components/TodoView';
import { displayTitle, safeStructured, safeSegments, conversationDuration } from '../lib/types';

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

  // All pending tasks across all conversations
  const allTasks = useMemo(() => {
    return conversations.filter(c => !c.deleted).flatMap(c => {
      const s = safeStructured(c);
      return s.actionItems.map(item => ({ ...item, convId: c.id, convTitle: displayTitle(c), convEmoji: s.emoji }));
    });
  }, [conversations]);

  if (!selectedId && paginated.length > 0 && !loading) {
    setTimeout(() => setSelectedId(paginated[0].id), 0);
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f7' }}>
      {/* Top bar */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e8e8ed', display: 'flex', alignItems: 'center', padding: '0 20px', height: 52, flexShrink: 0 }}>
        {/* Mode switch (like SOLO toggle from reference) */}
        <div style={{ display: 'flex', background: '#1d1d1f', borderRadius: 10, padding: 3, marginRight: 16 }}>
          <button onClick={() => setMode('notes')} style={{
            padding: '6px 14px', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 8, cursor: 'pointer',
            background: mode === 'notes' ? '#fff' : 'transparent', color: mode === 'notes' ? '#1d1d1f' : '#86868b',
            display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
          }}><VscNote size={14} /> Notes</button>
          <button onClick={() => setMode('todo')} style={{
            padding: '6px 14px', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 8, cursor: 'pointer',
            background: mode === 'todo' ? '#fff' : 'transparent', color: mode === 'todo' ? '#1d1d1f' : '#86868b',
            display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
          }}><VscChecklist size={14} /> To-do</button>
        </div>

        <span style={{ flex: 1 }} />
        <Link to="/settings" style={{ color: '#86868b', display: 'flex', padding: 6 }}><VscSettingsGear size={17} /></Link>
        <button onClick={() => logOut()} style={{ background: 'none', border: 'none', color: '#86868b', cursor: 'pointer', padding: 6, display: 'flex' }}><VscSignOut size={17} /></button>
      </header>

      {/* Todo mode */}
      {mode === 'todo' && (
        <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
          <TodoView tasks={allTasks} onSelectConversation={(id) => { setSelectedId(id); setMode('notes'); }} />
        </div>
      )}

      {/* Notes mode */}
      {mode === 'notes' && (
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* LEFT sidebar - no background color, blends with content */}
          <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid #e8e8ed', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 12, position: 'relative' }}>
              <VscSearch size={14} style={{ position: 'absolute', left: 22, top: '50%', transform: 'translateY(-50%)', color: '#aeaeb2' }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search notes..."
                style={{ width: '100%', padding: '10px 12px 10px 34px', background: '#f0f0f2', border: 'none', borderRadius: 10, color: '#1d1d1f', fontSize: 14, outline: 'none' }}
              />
            </div>

            <div style={{ fontSize: 12, color: '#86868b', padding: '0 16px 8px', fontWeight: 500 }}>
              {loading ? 'Loading...' : `${filtered.length} notes`}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
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
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => setSelectedId(conv.id)}
                      style={{
                        padding: '12px 14px', marginBottom: 2, borderRadius: 12, cursor: 'pointer',
                        background: isActive ? '#e8f0fe' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        {s.emoji && <span style={{ fontSize: 15 }}>{s.emoji}</span>}
                        <span style={{
                          fontWeight: 600, fontSize: 14, color: '#1d1d1f',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                          letterSpacing: -0.2,
                        }}>
                          {displayTitle(conv)}
                        </span>
                        {conv.starred && <span style={{ fontSize: 12 }}>{'\u2B50'}</span>}
                      </div>

                      {s.overview && (
                        <div style={{
                          fontSize: 13, color: '#86868b', lineHeight: 1.4, marginBottom: 4,
                          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                        }}>
                          {s.overview}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#aeaeb2' }}>
                        <span>{date}</span>
                        {dur && <span>{dur}</span>}
                        <span>{segs.length} seg</span>
                        {s.actionItems.filter(a => !a.completed).length > 0 && (
                          <span>{s.actionItems.filter(a => !a.completed).length} tasks</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {hasMore && (
                <button onClick={() => setPage(p => p + 1)} style={{
                  width: '100%', padding: 10, marginTop: 6, background: '#f0f0f2', border: 'none',
                  borderRadius: 10, color: '#0071e3', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}>
                  Load more ({filtered.length - paginated.length})
                </button>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
            <AnimatePresence mode="wait">
              {selected ? (
                <NoteDetail key={selected.id} conv={selected} uid={user?.uid}
                  templates={templates} preferences={preferences}
                  savedNotes={savedNotes} saveNote={saveNote} />
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aeaeb2', fontSize: 15 }}>
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
