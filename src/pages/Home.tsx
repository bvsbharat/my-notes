import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { VscSearch, VscSettingsGear, VscSignOut } from 'react-icons/vsc';
import { useAuth } from '../hooks/useAuth';
import { useConversations } from '../hooks/useConversations';
import { useTemplates } from '../hooks/useTemplates';
import { useSettings } from '../hooks/useSettings';
import { useNotes } from '../hooks/useNotes';
import { NoteDetail } from '../components/NoteDetail';
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

  if (!selectedId && paginated.length > 0 && !loading) {
    setTimeout(() => setSelectedId(paginated[0].id), 0);
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Top bar */}
      <header style={{ background: '#fff', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', padding: '0 20px', height: 52, flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)', letterSpacing: -0.3 }}>
          SuperNotes
        </span>
        <span style={{ flex: 1 }} />
        <Link to="/settings" style={{ color: 'var(--fg-muted)', display: 'flex', padding: 6 }}><VscSettingsGear size={17} /></Link>
        <button onClick={() => logOut()} style={{ background: 'none', border: 'none', color: 'var(--fg-muted)', cursor: 'pointer', padding: 6, display: 'flex' }}><VscSignOut size={17} /></button>
      </header>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* LEFT: Sidebar */}
        <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', background: '#fff' }}>
          {/* Search */}
          <div style={{ padding: 12, position: 'relative' }}>
            <VscSearch size={14} style={{ position: 'absolute', left: 22, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-subtle)' }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search notes..."
              style={{
                width: '100%', padding: '10px 12px 10px 34px', background: 'var(--bg-surface)',
                border: 'none', borderRadius: 10, color: 'var(--fg)', fontSize: 14,
                fontFamily: 'var(--font)', outline: 'none',
              }}
            />
          </div>

          <div style={{ fontSize: 12, color: 'var(--fg-muted)', padding: '0 16px 8px', fontWeight: 500 }}>
            {loading ? 'Loading...' : `${filtered.length} notes`}
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <AnimatePresence>
              {paginated.map(conv => {
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
                    onClick={() => setSelectedId(conv.id)}
                    style={{
                      padding: '12px 16px', cursor: 'pointer',
                      background: isActive ? 'var(--accent-light)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      {s.emoji && <span style={{ fontSize: 14 }}>{s.emoji}</span>}
                      <span style={{
                        fontWeight: 600, fontSize: 14, color: isActive ? 'var(--accent)' : 'var(--fg)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                        letterSpacing: -0.2,
                      }}>
                        {displayTitle(conv)}
                      </span>
                      {conv.starred && <span style={{ color: 'var(--yellow)', fontSize: 13 }}>{'\u2605'}</span>}
                    </div>

                    {s.overview && (
                      <div style={{ fontSize: 13, color: 'var(--fg-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4, lineHeight: 1.4 }}>
                        {s.overview}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--fg-subtle)' }}>
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
              <div style={{ padding: '8px 16px 16px' }}>
                <button onClick={() => setPage(p => p + 1)} style={{
                  width: '100%', padding: 10, background: 'var(--bg-surface)', border: 'none',
                  borderRadius: 10, color: 'var(--accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}>
                  Load more ({filtered.length - paginated.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Detail */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
          <AnimatePresence mode="wait">
            {selected ? (
              <NoteDetail
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
                style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-subtle)', fontSize: 15 }}>
                Select a note to view
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
