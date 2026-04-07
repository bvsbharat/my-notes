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

const CARD_COLORS = [
  ['#fef3c7', '#92400e'],  // amber
  ['#dcfce7', '#166534'],  // green
  ['#dbeafe', '#1e40af'],  // blue
  ['#fce7f3', '#9d174d'],  // pink
  ['#f3e8ff', '#6b21a8'],  // purple
  ['#ffedd5', '#9a3412'],  // orange
  ['#e0f2fe', '#075985'],  // sky
  ['#fef9c3', '#854d0e'],  // yellow
  ['#f0fdf4', '#15803d'],  // emerald
  ['#fdf2f8', '#be185d'],  // rose
];

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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f7' }}>
      {/* Top bar */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e8e8ed', display: 'flex', alignItems: 'center', padding: '0 20px', height: 52, flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#1d1d1f', letterSpacing: -0.3 }}>SuperNotes</span>
        <span style={{ flex: 1 }} />
        <Link to="/settings" style={{ color: '#86868b', display: 'flex', padding: 6 }}><VscSettingsGear size={17} /></Link>
        <button onClick={() => logOut()} style={{ background: 'none', border: 'none', color: '#86868b', cursor: 'pointer', padding: 6, display: 'flex' }}><VscSignOut size={17} /></button>
      </header>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* LEFT: Colorful note cards */}
        <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid #e8e8ed', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
          <div style={{ padding: 12, position: 'relative' }}>
            <VscSearch size={14} style={{ position: 'absolute', left: 22, top: '50%', transform: 'translateY(-50%)', color: '#aeaeb2' }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search notes..."
              style={{ width: '100%', padding: '10px 12px 10px 34px', background: '#fff', border: '1px solid #e8e8ed', borderRadius: 10, color: '#1d1d1f', fontSize: 14, outline: 'none' }}
            />
          </div>

          <div style={{ fontSize: 12, color: '#86868b', padding: '0 16px 8px', fontWeight: 500 }}>
            {loading ? 'Loading...' : `${filtered.length} notes`}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 16px' }}>
            <AnimatePresence>
              {paginated.map((conv, idx) => {
                const s = safeStructured(conv);
                const segs = safeSegments(conv);
                const dur = conversationDuration(conv);
                const isActive = conv.id === selectedId;
                const date = new Date(conv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const [bg, fg] = CARD_COLORS[idx % CARD_COLORS.length];

                return (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => setSelectedId(conv.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: 14, marginBottom: 8, borderRadius: 14, cursor: 'pointer',
                      background: bg,
                      border: isActive ? '2px solid #0071e3' : '2px solid transparent',
                      boxShadow: isActive ? '0 2px 12px rgba(0,113,227,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'border 0.15s, box-shadow 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      {s.emoji && <span style={{ fontSize: 16 }}>{s.emoji}</span>}
                      <span style={{
                        fontWeight: 700, fontSize: 14, color: fg,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                      }}>
                        {displayTitle(conv)}
                      </span>
                      {conv.starred && <span style={{ fontSize: 12 }}>{'\u2B50'}</span>}
                    </div>

                    {s.overview && (
                      <div style={{
                        fontSize: 12, color: fg, opacity: 0.7, lineHeight: 1.4,
                        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                        marginBottom: 6,
                      }}>
                        {s.overview}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, fontSize: 10, color: fg, opacity: 0.5 }}>
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
                width: '100%', padding: 10, marginTop: 4, background: '#fff', border: '1px solid #e8e8ed',
                borderRadius: 10, color: '#0071e3', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}>
                Load more ({filtered.length - paginated.length})
              </button>
            )}

            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#86868b', fontSize: 14 }}>
                {search ? 'No matches' : 'No notes yet'}
              </div>
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
    </div>
  );
}
