import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { VscSearch, VscSettingsGear, VscSignOut, VscColorMode } from 'react-icons/vsc';
import { useAuth } from '../hooks/useAuth';
import { useConversations } from '../hooks/useConversations';
import { useTemplates } from '../hooks/useTemplates';
import { useSettings } from '../hooks/useSettings';
import { useNotes } from '../hooks/useNotes';
import { NoteDetail } from '../components/NoteDetail';
import { displayTitle, safeStructured, safeSegments, conversationDuration } from '../lib/types';

const PAGE_SIZE = 10;

interface Props {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export function Home({ theme, toggleTheme }: Props) {
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

  // Auto-select first note if none selected
  if (!selectedId && paginated.length > 0 && !loading) {
    setTimeout(() => setSelectedId(paginated[0].id), 0);
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Top bar */}
      <header style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', height: 48, flexShrink: 0, gap: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--accent)', marginRight: 'auto' }}>
          {'>'}_supernotes
        </span>
        <button onClick={toggleTheme} style={hdrBtn} title="Theme"><VscColorMode size={15} /></button>
        <Link to="/settings" style={hdrBtn}><VscSettingsGear size={15} /></Link>
        <button onClick={() => logOut()} style={hdrBtn} title="Sign out"><VscSignOut size={15} /></button>
      </header>

      {/* Main split */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* LEFT: Notes list */}
        <div style={{ width: 340, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
          {/* Search */}
          <div style={{ padding: '12px 12px 8px', position: 'relative' }}>
            <VscSearch size={13} style={{ position: 'absolute', left: 22, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search notes..."
              style={{
                width: '100%', padding: '9px 10px 9px 32px', background: 'var(--bg-surface)',
                border: '1px solid var(--border)', borderRadius: 8, color: 'var(--fg)',
                fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none',
              }}
            />
          </div>

          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', padding: '2px 14px 6px' }}>
            {loading ? 'loading...' : `${filtered.length} notes`}
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
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
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedId(conv.id)}
                    style={{
                      padding: '10px 12px', marginBottom: 4, borderRadius: 8, cursor: 'pointer',
                      background: isActive ? 'var(--bg-card)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                      transition: 'background 0.15s, border 0.15s',
                    }}
                    whileHover={{ background: isActive ? 'var(--bg-card)' : 'var(--bg-surface)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      {s.emoji && <span style={{ fontSize: 13 }}>{s.emoji}</span>}
                      <span style={{
                        fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13, color: 'var(--fg)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                      }}>
                        {displayTitle(conv)}
                      </span>
                      {conv.starred && <span style={{ color: 'var(--yellow)', fontSize: 12 }}>{'\u2605'}</span>}
                    </div>

                    {s.overview && (
                      <div style={{ fontSize: 11, color: 'var(--fg-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                        {s.overview}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-subtle)' }}>
                      <span>{date}</span>
                      {dur && <span>{dur}</span>}
                      <span>{segs.length} seg</span>
                      {s.actionItems.length > 0 && <span>{s.actionItems.filter(a => !a.completed).length} tasks</span>}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {hasMore && (
              <button onClick={() => setPage(p => p + 1)} style={{
                width: '100%', padding: '8px 0', marginTop: 4, background: 'none',
                border: '1px solid var(--border)', borderRadius: 6, color: 'var(--accent)',
                fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer',
              }}>
                load more ({filtered.length - paginated.length})
              </button>
            )}

            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                {search ? 'no matches' : 'no notes yet'}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Note detail */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}
              >
                // select a note to view
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const hdrBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--fg-muted)', cursor: 'pointer',
  padding: 6, display: 'flex', alignItems: 'center', borderRadius: 6,
};
