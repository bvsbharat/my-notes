import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { VscSearch, VscSettingsGear, VscSignOut, VscChecklist, VscNote } from 'react-icons/vsc';
import { useAuth } from '../hooks/useAuth';
import { useConversations } from '../hooks/useConversations';
import { useTemplates } from '../hooks/useTemplates';
import { useSettings } from '../hooks/useSettings';
import { useNotes } from '../hooks/useNotes';
import { displayTitle, safeStructured, safeSegments, conversationDuration } from '../lib/types';
import { toggleStar, softDelete, toggleTaskCompleted, deleteTask, exportAsText, downloadText, reprocessConversation } from '../lib/actions';
import { NoteIcon } from '../lib/noteIcons';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { VscStarFull, VscStarEmpty, VscTrash, VscCopy, VscExport, VscRefresh, VscSparkle } from 'react-icons/vsc';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Conversation } from '../lib/types';

const PAGE_SIZE = 12;

const CARD_COLORS = [
  'bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-red-100',
  'bg-purple-100', 'bg-green-100', 'bg-blue-100', 'bg-yellow-100',
  'bg-red-100', 'bg-green-100', 'bg-purple-100', 'bg-blue-100',
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
  const [mode, setMode] = useState<'notes' | 'todo'>('notes');
  const [tab, setTab] = useState<'overview' | 'smartnotes'>('overview');
  const [reprocessing, setReprocessing] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [aiNotes, setAiNotes] = useState('');
  const [transforming, setTransforming] = useState(false);

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

  const selectedStructured = selected ? safeStructured(selected) : null;
  const selectedSegments = selected ? safeSegments(selected) : [];
  const safeTemplates = templates || [];

  const handleReprocess = async () => {
    if (!selected) return;
    setReprocessing(true);
    try { await reprocessConversation(selected.id); } catch {}
    finally { setReprocessing(false); }
  };

  const handleTransform = async () => {
    if (!selected || !userNotes.trim()) return;
    setTransforming(true);
    try {
      const fns = getFunctions();
      const transform = httpsCallable<any, { enhancedNotes: string }>(fns, 'transformNotes');
      const result = await transform({ conversationId: selected.id, userNotes, preferences });
      setAiNotes(result.data.enhancedNotes);
      await saveNote({ conversationId: selected.id, userNotes, aiNotes: result.data.enhancedNotes });
    } catch { alert('Transform failed'); }
    finally { setTransforming(false); }
  };

  return (
    <div className="h-screen bg-[#f0f1f3] flex items-center justify-center p-6 font-sans antialiased overflow-hidden">
      {/* The entire app is this card - fixed height, no body scroll */}
      <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.08)] w-full max-w-[1400px] h-[90vh] flex flex-col lg:flex-row overflow-hidden">

        {/* LEFT PANEL: selected note detail (or empty state) */}
        <div className="w-full lg:w-[45%] flex flex-col border-r border-gray-100 overflow-hidden">
          {/* Logo + toggle + actions (fixed, no scroll) */}
          <div className="flex items-center gap-3 p-8 lg:p-10 pb-4 shrink-0">
            <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
              <path d="M24 4L41.3205 14V34L24 44L6.67949 34V14L24 4Z" fill="#111827"/>
              <path d="M18 24H30M30 24L25 19M30 24L25 29" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

            {/* Toggle inside the card */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setMode('notes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border-none cursor-pointer ${mode === 'notes' ? 'bg-white text-gray-900 shadow-sm' : 'bg-transparent text-gray-400'}`}>
                <VscNote size={12} /> Notes
              </button>
              <button onClick={() => setMode('todo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border-none cursor-pointer ${mode === 'todo' ? 'bg-white text-gray-900 shadow-sm' : 'bg-transparent text-gray-400'}`}>
                <VscChecklist size={12} /> To-do
              </button>
            </div>

            <span className="flex-1" />
            <Link to="/settings" className="text-gray-300 hover:text-gray-500 transition-colors"><VscSettingsGear size={16} /></Link>
            <button onClick={() => logOut()} className="text-gray-300 hover:text-gray-500 bg-transparent border-none cursor-pointer transition-colors"><VscSignOut size={16} /></button>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto px-8 lg:px-10 pb-8">
          <AnimatePresence mode="wait">
            {selected && mode === 'notes' ? (
              <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
                {/* Title + actions */}
                <div className="flex items-start gap-3 mb-4">
                  <NoteIcon emoji={selectedStructured?.emoji} category={selectedStructured?.category} size={28} />
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-snug mb-1">{displayTitle(selected)}</h1>
                    <div className="flex gap-2 text-xs text-gray-400">
                      <span>{new Date(selected.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      {conversationDuration(selected) && <span>{conversationDuration(selected)}</span>}
                      <span>{selectedSegments.length} seg</span>
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <MiniBtn icon={selected.starred ? <VscStarFull size={13} /> : <VscStarEmpty size={13} />}
                      onClick={() => user && toggleStar(user.uid, selected.id, selected.starred)}
                      className={selected.starred ? 'text-yellow-400' : ''} />
                    <MiniBtn icon={<VscRefresh size={13} />} onClick={handleReprocess} />
                    <MiniBtn icon={<VscCopy size={13} />} onClick={() => navigator.clipboard.writeText(selectedSegments.map(s => `${s.speaker}: ${s.text}`).join('\n'))} />
                    <MiniBtn icon={<VscExport size={13} />} onClick={() => downloadText(`${displayTitle(selected).replace(/[^a-zA-Z0-9]/g, '_')}.md`, exportAsText(selected))} />
                    <MiniBtn icon={<VscTrash size={13} />} onClick={() => user && confirm('Delete?') && softDelete(user.uid, selected.id)} className="text-red-300" />
                  </div>
                </div>

                {/* Tabs: Overview / Smart Notes */}
                <div className="flex gap-0 mb-6">
                  {(['overview', 'smartnotes'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`px-4 py-2 text-xs font-semibold bg-transparent border-none cursor-pointer transition-colors ${
                        tab === t ? 'text-blue-600' : 'text-gray-300 hover:text-gray-500'
                      }`}
                      style={{ borderBottom: tab === t ? '2px solid #0071e3' : '2px solid transparent' }}>
                      {t === 'overview' ? 'Overview' : 'Smart Notes'}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                  <motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {tab === 'overview' && selectedStructured && (
                      <div className="space-y-6">
                        {selectedStructured.overview && (
                          <div className="text-[15px] text-gray-600 leading-[1.8]">
                            <MarkdownRenderer text={selectedStructured.overview} />
                          </div>
                        )}

                        {/* Action items as todo list */}
                        {selectedStructured.actionItems.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                              Tasks ({selectedStructured.actionItems.filter(a => !a.completed).length}/{selectedStructured.actionItems.length})
                            </p>
                            <div className="space-y-2">
                              {selectedStructured.actionItems.map((item, i) => (
                                <div key={item.id} className={`flex items-start gap-3 p-3 rounded-xl ${CARD_COLORS[i % CARD_COLORS.length]}`}>
                                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                                    item.completed ? 'bg-green-500 text-white' : 'bg-white/70 border-2 border-gray-300'
                                  }`}>
                                    {item.completed && '\u2713'}
                                  </span>
                                  <span className={`text-sm leading-relaxed ${item.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                    {item.description}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Events */}
                        {selectedStructured.events.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Events</p>
                            <div className="space-y-2">
                              {selectedStructured.events.map((ev, i) => (
                                <div key={i} className={`p-3 rounded-xl ${CARD_COLORS[(i + 3) % CARD_COLORS.length]}`}>
                                  <p className="text-sm font-semibold text-gray-900">{ev.title}</p>
                                  {ev.description && <p className="text-xs text-gray-500 mt-1">{ev.description}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!selectedStructured.overview && selectedStructured.actionItems.length === 0 && (
                          <p className="text-gray-300 text-sm">No insights yet. Click refresh to re-generate.</p>
                        )}
                      </div>
                    )}

                    {tab === 'smartnotes' && (
                      <div>
                        {aiNotes ? (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <VscSparkle size={14} className="text-blue-600" />
                              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">AI Enhanced</span>
                              <span className="flex-1" />
                              <button onClick={() => { setUserNotes(aiNotes); setAiNotes(''); }} className="text-xs text-gray-400 bg-transparent border-none cursor-pointer hover:text-gray-600">Edit</button>
                              <button onClick={handleTransform} disabled={transforming} className="text-xs text-blue-600 bg-transparent border-none cursor-pointer font-semibold disabled:opacity-40">Regenerate</button>
                              <button onClick={() => navigator.clipboard.writeText(aiNotes)} className="text-xs text-gray-400 bg-transparent border-none cursor-pointer hover:text-gray-600">Copy</button>
                            </div>
                            <MarkdownRenderer text={aiNotes} />
                          </div>
                        ) : (
                          <div>
                            <textarea
                              value={userNotes}
                              onChange={e => setUserNotes(e.target.value)}
                              placeholder={"Write your notes here...\n\n## Headings\n- Bullet points\n[placeholders]"}
                              className="w-full min-h-[280px] p-5 border border-gray-200 rounded-2xl text-sm text-gray-900 leading-[1.8] resize-y outline-none placeholder:text-gray-300"
                            />
                            <button
                              onClick={handleTransform}
                              disabled={transforming || !userNotes.trim()}
                              className="mt-3 px-5 py-2.5 bg-blue-600 text-white border-none rounded-xl text-sm font-semibold cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <VscSparkle size={14} />
                              {transforming ? 'Transforming...' : 'AI Transform'}
                            </button>
                            {safeTemplates.length > 0 && (
                              <div className="flex gap-2 flex-wrap mt-4">
                                {safeTemplates.map(t => (
                                  <button key={t.id} onClick={() => setUserNotes(prev => prev ? prev + '\n\n' + t.content : t.content)}
                                    className="px-3 py-1.5 bg-gray-50 border-none rounded-lg text-xs text-gray-400 cursor-pointer hover:bg-gray-100">{t.name}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            ) : mode === 'notes' ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center text-gray-300 text-sm">
                Select a note to view details
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Todo mode in left panel */}
          {mode === 'todo' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">To-do</h2>
              <p className="text-xs text-gray-400 mb-4">{allTasks.filter(t => !t.completed).length} pending</p>
              <div className="space-y-2">
                {allTasks.filter(t => !t.completed).map((task, i) => (
                  <div key={task.id}
                    onClick={() => onToggle(task, user?.uid)}
                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer ${CARD_COLORS[i % CARD_COLORS.length]}`}>
                    <span className="w-5 h-5 rounded-md bg-white/70 border-2 border-gray-300 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-relaxed">{task.description}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {task.convDate ? new Date(task.convDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>{/* end scrollable content */}
        </div>

        {/* RIGHT PANEL: all notes as card columns */}
        <div className="w-full lg:w-[55%] p-8 lg:p-10 overflow-y-auto bg-[#fafbfc]">
          {/* Search */}
          <div className="relative mb-6">
            <VscSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search notes..."
              className="w-full py-2.5 pl-9 pr-3 bg-white border border-gray-100 rounded-xl text-sm text-gray-900 outline-none placeholder:text-gray-300"
            />
          </div>

          {/* Notes grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {paginated.map((conv, i) => {
                const s = safeStructured(conv);
                const segs = safeSegments(conv);
                const dur = conversationDuration(conv);
                const isActive = conv.id === selectedId;
                const date = new Date(conv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const color = CARD_COLORS[i % CARD_COLORS.length];

                return (
                  <motion.div
                    key={conv.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => { setSelectedId(conv.id); setMode('notes'); setTab('overview'); }}
                    className={`${color} p-5 rounded-2xl flex flex-col justify-between cursor-pointer transition-all ${
                      isActive ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                    }`}
                    style={{ aspectRatio: '1' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <NoteIcon emoji={s.emoji} category={s.category} size={14} />
                        <span className="text-[15px] font-semibold text-gray-900 leading-snug line-clamp-2">{displayTitle(conv)}</span>
                      </div>
                      {s.overview && (
                        <p className="text-xs text-gray-900/50 leading-relaxed line-clamp-3">{s.overview}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] text-black/25">{date} {dur && `· ${dur}`}</span>
                      <span className="text-[10px] text-black/25">{segs.length} seg{s.actionItems.length > 0 ? ` · ${s.actionItems.filter(a => !a.completed).length} tasks` : ''}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {hasMore && (
            <button onClick={() => setPage(p => p + 1)}
              className="w-full mt-4 py-3 bg-white border border-gray-100 rounded-xl text-blue-600 text-xs font-medium cursor-pointer">
              Load more ({filtered.length - paginated.length})
            </button>
          )}

          {!loading && filtered.length === 0 && (
            <p className="text-center py-16 text-gray-300 text-sm">No notes yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniBtn({ icon, onClick, className = '' }: { icon: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={onClick}
      className={`bg-transparent border-none text-gray-300 cursor-pointer p-1 flex rounded transition-colors hover:text-gray-500 ${className}`}>
      {icon}
    </motion.button>
  );
}

function onToggle(task: any, uid?: string) {
  if (uid) toggleTaskCompleted(uid, task.convId, task.id, !task.completed);
}
