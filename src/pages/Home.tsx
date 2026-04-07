import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { VscSearch, VscSettingsGear, VscSignOut, VscChecklist, VscNote,
  VscStarFull, VscStarEmpty, VscTrash, VscCopy, VscRefresh, VscSparkle,
  VscFileCode, VscDesktopDownload } from 'react-icons/vsc';
import { useAuth } from '../hooks/useAuth';
import { useConversations } from '../hooks/useConversations';
import { useTemplates } from '../hooks/useTemplates';
import { useSettings } from '../hooks/useSettings';
import { useNotes } from '../hooks/useNotes';
import { displayTitle, safeStructured, safeSegments, conversationDuration, formatTimestamp } from '../lib/types';
import { toggleStar, softDelete, toggleTaskCompleted, exportAsText, downloadText, reprocessConversation } from '../lib/actions';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { getFunctions, httpsCallable } from 'firebase/functions';

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
  const { notes: smartNotes, saveNote } = useNotes(user?.uid);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'notes' | 'todo'>('notes');
  const [tab, setTab] = useState<'overview' | 'smartnotes'>('overview');
  const [showTranscript, setShowTranscript] = useState(false);
  const [, setReprocessing] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [aiNotes, setAiNotes] = useState('');
  const [transforming, setTransforming] = useState(false);
  const [leftWidth, setLeftWidth] = useState(70);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

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
  const selectedStructured = selected ? safeStructured(selected) : null;
  const selectedSegments = selected ? safeSegments(selected) : [];
  const safeTemplates = templates || [];

  const allTasks = useMemo(() => {
    return conversations.filter(c => !c.deleted).flatMap(c => {
      const s = safeStructured(c);
      return s.actionItems.map(item => ({ ...item, convId: c.id, convTitle: displayTitle(c), convEmoji: s.emoji, convDate: c.createdAt }));
    });
  }, [conversations]);

  if (!selectedId && paginated.length > 0 && !loading) {
    setTimeout(() => setSelectedId(paginated[0].id), 0);
  }

  // Load saved smart notes when switching conversations
  useEffect(() => {
    if (!selectedId) { setUserNotes(''); setAiNotes(''); return; }
    const saved = smartNotes.find(n => n.conversationId === selectedId);
    if (saved) {
      setUserNotes(saved.userNotes || '');
      setAiNotes(saved.aiNotes || '');
    } else {
      setUserNotes('');
      setAiNotes('');
    }
  }, [selectedId, smartNotes]);

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

  // Drag to resize
  const onMouseDown = useCallback(() => { dragging.current = true; }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setLeftWidth(Math.max(40, Math.min(85, pct)));
  }, []);
  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  return (
    <div className="h-screen bg-[#f0f1f3] flex items-center justify-center p-6 font-sans antialiased overflow-hidden"
      onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      <div ref={containerRef}
        className="bg-white rounded-[2rem] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.08)] w-full max-w-[1500px] h-[92vh] flex overflow-hidden select-none">

        {/* ═══ LEFT PANEL ═══ */}
        <div className="flex flex-col overflow-hidden border-r border-gray-100 relative" style={{ width: `${leftWidth}%` }}>
          {/* Header: logo only */}
          <div className="flex items-center gap-3 px-8 pt-6 pb-3 shrink-0">
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
              <path d="M24 4L41.3205 14V34L24 44L6.67949 34V14L24 4Z" fill="#111827"/>
              <path d="M18 24H30M30 24L25 19M30 24L25 29" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm font-bold text-gray-900 tracking-tight">SuperNotes</span>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-8 pb-8">

            {/* ── Notes detail ── */}
            {mode === 'notes' && (
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* Title */}
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-snug mb-3">{displayTitle(selected)}</h1>

                    {/* Date + time + category + action icons */}
                    <div className="flex items-center gap-2 mb-5 flex-wrap">
                      <span className="text-xs text-gray-400">{new Date(selected.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="text-xs text-gray-400">{new Date(selected.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      {selectedStructured?.category && selectedStructured.category !== 'general' && (
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] text-gray-500">{selectedStructured.category}</span>
                      )}
                      <span className="flex-1" />
                      <Ic icon={selected.starred ? <VscStarFull size={14} /> : <VscStarEmpty size={14} />}
                        onClick={() => user && toggleStar(user.uid, selected.id, selected.starred)}
                        className={selected.starred ? '!text-yellow-500' : ''} title="Star" />
                      <Ic icon={<VscRefresh size={14} />} onClick={handleReprocess} title="Re-generate" />
                      <Ic icon={<VscFileCode size={14} />} onClick={() => setShowTranscript(!showTranscript)}
                        className={showTranscript ? '!text-gray-900' : ''} title="Transcript" />
                      <Ic icon={<VscCopy size={14} />} onClick={() => navigator.clipboard.writeText(selectedSegments.map(s => `${s.speaker}: ${s.text}`).join('\n'))} title="Copy" />
                      <Ic icon={<VscDesktopDownload size={14} />} onClick={() => downloadText(`${displayTitle(selected).replace(/[^a-zA-Z0-9]/g, '_')}.md`, exportAsText(selected))} title="Download" />
                      <Ic icon={<VscTrash size={14} />} onClick={() => user && confirm('Delete?') && softDelete(user.uid, selected.id)} className="!text-red-400" title="Delete" />
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-0 mb-5">
                      {(['overview', 'smartnotes'] as const).map(t => (
                        <button key={t} onClick={() => { setTab(t); setShowTranscript(false); }}
                          className={`px-3 py-1.5 text-xs font-semibold bg-transparent border-none cursor-pointer transition-colors rounded-md ${
                            tab === t && !showTranscript ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-600'
                          }`}>
                          {t === 'overview' ? 'Overview' : 'Smart Notes'}
                        </button>
                      ))}
                    </div>

                    {/* Transcript overlay */}
                    {showTranscript && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
                        <div className="text-gray-600 leading-[1.8] space-y-4 text-[14px]">
                          <p className="text-gray-300 uppercase tracking-wider text-[10px] font-semibold">---BEGIN TRANSCRIPT---</p>
                          {selectedSegments.map(seg => (
                            <p key={seg.id}>
                              <span className="text-gray-300 text-[11px] mr-2 font-mono">{formatTimestamp(seg.start)}</span>
                              <span className="font-medium text-gray-900">{seg.isUser ? 'You' : seg.speaker}:</span>{' '}
                              <span className="text-gray-600">{seg.text}</span>
                            </p>
                          ))}
                          <p className="text-gray-300 uppercase tracking-wider text-[10px] font-semibold">---END TRANSCRIPT---</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Tab content */}
                    {!showTranscript && (
                      <AnimatePresence mode="wait">
                        <motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                          {tab === 'overview' && selectedStructured && (
                            <div className="space-y-6">
                              {selectedStructured.overview && (
                                <div className="text-[15px] text-gray-600 leading-[1.8]">
                                  <MarkdownRenderer text={selectedStructured.overview} />
                                </div>
                              )}
                              {selectedStructured.actionItems.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                    Tasks ({selectedStructured.actionItems.filter(a => !a.completed).length}/{selectedStructured.actionItems.length})
                                  </p>
                                  <div className="space-y-1.5">
                                    {selectedStructured.actionItems.map((item, i) => {
                                      const HL = ['bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-red-100', 'bg-purple-100', 'bg-orange-100'];
                                      return (
                                        <div key={item.id}
                                          onClick={() => user && toggleTaskCompleted(user.uid, selected.id, item.id, !item.completed)}
                                          className="flex items-start gap-2.5 cursor-pointer py-0.5">
                                          <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 mt-0.5 transition-colors ${
                                            item.completed ? 'bg-gray-900 text-white' : 'border-2 border-gray-900 hover:bg-gray-100'}`}>
                                            {item.completed && '\u2713'}
                                          </span>
                                          <span className={`text-[14px] leading-relaxed ${item.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                            <span className={`${item.completed ? '' : HL[i % HL.length]} px-1 py-0.5 rounded`}>{item.description}</span>
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {selectedStructured.events.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Events</p>
                                  <div className="space-y-1">
                                    {selectedStructured.events.map((ev, i) => {
                                      const HL = ['bg-cyan-100', 'bg-amber-100', 'bg-pink-100', 'bg-lime-100', 'bg-indigo-100'];
                                      return (
                                        <p key={i} className="text-[14px] text-gray-900 leading-relaxed">
                                          <span className={`${HL[i % HL.length]} px-1 py-0.5 rounded font-medium`}>{ev.title}</span>
                                          {ev.description && <span className="text-gray-500 text-xs ml-1.5">{ev.description}</span>}
                                        </p>
                                      );
                                    })}
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
                                    <button onClick={() => { setUserNotes(aiNotes); setAiNotes(''); }} className="text-xs text-gray-500 bg-transparent border-none cursor-pointer hover:text-gray-700">Edit</button>
                                    <button onClick={handleTransform} disabled={transforming} className="text-xs text-blue-600 bg-transparent border-none cursor-pointer font-semibold disabled:opacity-40">Regenerate</button>
                                    <button onClick={() => navigator.clipboard.writeText(aiNotes)} className="text-xs text-gray-500 bg-transparent border-none cursor-pointer hover:text-gray-700">Copy</button>
                                  </div>
                                  <MarkdownRenderer text={aiNotes} />
                                </div>
                              ) : (
                                <div>
                                  <textarea value={userNotes} onChange={e => setUserNotes(e.target.value)}
                                    placeholder={"Write your notes here...\n\n## Headings\n- Bullet points\n[placeholders]"}
                                    className="w-full min-h-[400px] p-6 border-none rounded-2xl text-sm text-gray-900 leading-[1.8] resize-y outline-none placeholder:text-gray-400/60"
                                    style={{ background: '#fef9ef' }} />
                                  <button onClick={handleTransform} disabled={transforming || !userNotes.trim()}
                                    className="mt-3 px-5 py-2.5 bg-gray-900 text-white border-none rounded-xl text-sm font-semibold cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                                    <VscSparkle size={14} />{transforming ? 'Transforming...' : 'AI Transform'}
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
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center text-gray-300 text-sm pt-20">
                    Select a note to view details
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* ── Todo mode ── */}
            {mode === 'todo' && (
              <TodoSection allTasks={allTasks} uid={user?.uid} />
            )}
          </div>

          {/* ═══ BOTTOM DOCK ═══ */}
          <div className="shrink-0 flex justify-center pb-4 pt-2">
            <div className="flex items-center gap-1 bg-gray-900 rounded-2xl px-2 py-1.5 shadow-lg">
              <button onClick={() => setMode('notes')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer ${
                  mode === 'notes' ? 'bg-white text-gray-900 shadow-sm' : 'bg-transparent text-gray-400 hover:text-gray-200'}`}>
                <VscNote size={13} /> Notes
              </button>
              <button onClick={() => setMode('todo')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer ${
                  mode === 'todo' ? 'bg-white text-gray-900 shadow-sm' : 'bg-transparent text-gray-400 hover:text-gray-200'}`}>
                <VscChecklist size={13} /> To-do
              </button>
              <div className="w-px h-5 bg-gray-700 mx-1" />
              <Link to="/settings" className="text-gray-400 hover:text-gray-200 p-2 flex transition-colors"><VscSettingsGear size={14} /></Link>
              <button onClick={() => logOut()} className="text-gray-400 hover:text-gray-200 bg-transparent border-none cursor-pointer p-2 flex transition-colors"><VscSignOut size={14} /></button>
            </div>
          </div>
        </div>

        {/* ═══ RESIZE HANDLE ═══ */}
        <div onMouseDown={onMouseDown}
          className="w-1 cursor-col-resize hover:bg-blue-200 active:bg-blue-300 transition-colors shrink-0" />

        {/* ═══ RIGHT PANEL: notes grid ═══ */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#fafbfc]">
          <div className="relative mb-5">
            <VscSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search notes..."
              className="w-full py-2.5 pl-9 pr-3 bg-white border border-gray-100 rounded-xl text-sm text-gray-900 outline-none placeholder:text-gray-300" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {paginated.map((conv, i) => {
                const s = safeStructured(conv);
                const segs = safeSegments(conv);
                const dur = conversationDuration(conv);
                const isActive = conv.id === selectedId;
                const date = new Date(conv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const color = CARD_COLORS[i % CARD_COLORS.length];

                return (
                  <motion.div key={conv.id} layout
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => { setSelectedId(conv.id); setMode('notes'); setTab('overview'); setShowTranscript(false); }}
                    className={`${color} p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition-all min-h-[140px] ${isActive ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <div>
                      <p className="text-[14px] font-semibold text-gray-900 leading-snug line-clamp-2 mb-1.5">{displayTitle(conv)}</p>
                      {s.overview && <p className="text-[11px] text-gray-900/40 leading-relaxed line-clamp-3">{s.overview}</p>}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-black/25">{date}{dur ? ` · ${dur}` : ''}</span>
                      <span className="text-[10px] text-black/25">{segs.length} seg{s.actionItems.filter(a => !a.completed).length > 0 ? ` · ${s.actionItems.filter(a => !a.completed).length} tasks` : ''}</span>
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
          {!loading && filtered.length === 0 && <p className="text-center py-16 text-gray-300 text-sm">No notes yet</p>}
        </div>
      </div>
    </div>
  );
}

function TodoSection({ allTasks, uid }: { allTasks: any[]; uid?: string }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const pending = allTasks.filter(t => !t.completed);
  const done = allTasks.filter(t => t.completed);
  const shown = filter === 'pending' ? pending : filter === 'done' ? done : allTasks;

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">To-do</h2>
      <p className="text-xs text-gray-400 mb-4">{pending.length} pending &middot; {done.length} done</p>

      <div className="flex gap-2 mb-5">
        {(['all', 'pending', 'done'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold border-none rounded-lg cursor-pointer transition-all ${
              filter === f ? 'bg-gray-900 text-white' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}>
            {f === 'all' ? `All (${allTasks.length})` : f === 'pending' ? `Pending (${pending.length})` : `Done (${done.length})`}
          </button>
        ))}
      </div>

      {/* Same card grid style as notes on right panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AnimatePresence>
          {shown.map((task: any, i: number) => {
            const color = task.completed ? 'bg-gray-100' : CARD_COLORS[i % CARD_COLORS.length];
            const date = task.convDate ? new Date(task.convDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
            return (
              <motion.div key={task.id} layout
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => uid && toggleTaskCompleted(uid, task.convId, task.id, !task.completed)}
                className={`${color} p-4 rounded-2xl flex flex-col justify-between cursor-pointer min-h-[120px]`}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <div className="flex items-start gap-2.5">
                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 mt-0.5 ${
                    task.completed ? 'bg-gray-900 text-white' : 'border-2 border-gray-900'}`}>
                    {task.completed && '\u2713'}
                  </span>
                  <p className={`text-[14px] font-semibold leading-snug line-clamp-3 ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {task.description}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-black/25">{date}</span>
                  <span className="text-[10px] text-black/25">{task.completed ? 'click to undo' : task.convTitle}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {shown.length === 0 && (
        <p className="text-gray-300 text-sm text-center py-8">
          {filter === 'pending' ? 'All caught up!' : filter === 'done' ? 'No completed tasks' : 'No tasks yet'}
        </p>
      )}
    </div>
  );
}

function Ic({ icon, onClick, className = '', title }: { icon: React.ReactNode; onClick: () => void; className?: string; title?: string }) {
  return (
    <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={onClick} title={title}
      className={`bg-transparent border-none text-gray-500 cursor-pointer p-1.5 flex rounded-md transition-colors hover:text-gray-700 hover:bg-gray-50 ${className}`}>
      {icon}
    </motion.button>
  );
}
