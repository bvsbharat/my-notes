import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VscStarFull, VscStarEmpty, VscTrash, VscCopy, VscExport, VscRefresh, VscSparkle } from 'react-icons/vsc';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Conversation, NoteTemplate, AIPreferences, SmartNote } from '../lib/types';
import { displayTitle, conversationDuration, safeStructured, safeSegments, formatTimestamp } from '../lib/types';
import { toggleStar, softDelete, exportAsText, downloadText, reprocessConversation } from '../lib/actions';
import { MarkdownRenderer } from './MarkdownRenderer';
import { NoteIcon } from '../lib/noteIcons';

type Tab = 'overview' | 'transcript' | 'smartnotes';

const INSIGHT_COLORS = [
  'bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-red-100',
  'bg-purple-100', 'bg-green-100', 'bg-blue-100', 'bg-yellow-100',
  'bg-red-100', 'bg-green-100', 'bg-purple-100', 'bg-blue-100',
];

interface Props {
  conv: Conversation;
  uid: string | undefined;
  templates?: NoteTemplate[];
  preferences: AIPreferences;
  savedNotes: SmartNote[];
  saveNote: (note: any) => Promise<string | undefined>;
}

export function NoteDetailCard({ conv, uid, templates, preferences, savedNotes, saveNote }: Props) {
  const structured = safeStructured(conv);
  const segments = safeSegments(conv);
  const duration = conversationDuration(conv);
  const date = new Date(conv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = new Date(conv.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const [tab, setTab] = useState<Tab>('overview');
  const [reprocessing, setReprocessing] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [aiNotes, setAiNotes] = useState('');
  const [transforming, setTransforming] = useState(false);

  const safeTemplates = templates || [];

  const handleReprocess = async () => {
    setReprocessing(true);
    try { await reprocessConversation(conv.id); } catch {}
    finally { setReprocessing(false); }
  };

  const handleTransform = async () => {
    if (!userNotes.trim()) return;
    setTransforming(true);
    try {
      const fns = getFunctions();
      const transform = httpsCallable<any, { enhancedNotes: string }>(fns, 'transformNotes');
      const result = await transform({ conversationId: conv.id, userNotes, preferences });
      setAiNotes(result.data.enhancedNotes);
      await saveNote({ conversationId: conv.id, userNotes, aiNotes: result.data.enhancedNotes });
    } catch { alert('Transform failed'); }
    finally { setTransforming(false); }
  };

  // Build insight cards from action items + events
  const insights = [
    ...structured.actionItems.map((item, i) => ({
      text: item.description,
      quote: item.completed ? 'completed' : '',
      color: INSIGHT_COLORS[i % INSIGHT_COLORS.length],
    })),
    ...structured.events.map((ev, i) => ({
      text: ev.title,
      quote: ev.description || '',
      color: INSIGHT_COLORS[(i + structured.actionItems.length) % INSIGHT_COLORS.length],
    })),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] w-full max-w-[1200px]"
    >
      {/* Header */}
      <div className="px-10 pt-8 pb-0">
        <div className="flex items-center gap-3 mb-2">
          <NoteIcon emoji={structured.emoji} category={structured.category} size={28} />
          <h1 className="text-2xl font-bold text-gray-900 flex-1 tracking-tight">{displayTitle(conv)}</h1>
          <div className="flex items-center gap-1">
            <IBtn icon={conv.starred ? <VscStarFull size={15} /> : <VscStarEmpty size={15} />}
              onClick={() => uid && toggleStar(uid, conv.id, conv.starred)}
              className={conv.starred ? 'text-yellow-400' : ''} />
            <IBtn icon={<VscRefresh size={15} />} onClick={handleReprocess} />
            <IBtn icon={<VscCopy size={15} />} onClick={() => navigator.clipboard.writeText(segments.map(s => `${s.speaker}: ${s.text}`).join('\n'))} />
            <IBtn icon={<VscExport size={15} />} onClick={() => downloadText(`${displayTitle(conv).replace(/[^a-zA-Z0-9]/g, '_')}.md`, exportAsText(conv))} />
            <IBtn icon={<VscTrash size={15} />} onClick={() => uid && confirm('Delete?') && softDelete(uid, conv.id)} className="text-red-400" />
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-6">
          <span>{date}</span>
          <span>{time}</span>
          {duration && <span>{duration}</span>}
          <span>{segments.length} segments</span>
          {structured.category && structured.category !== 'general' && (
            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500">{structured.category}</span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 -mb-px">
          {([
            { key: 'overview' as Tab, label: 'Overview' },
            { key: 'transcript' as Tab, label: `Transcript (${segments.length})` },
            { key: 'smartnotes' as Tab, label: 'Smart Notes' },
          ]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors bg-transparent border-none cursor-pointer ${
                tab === t.key ? 'border-b-blue-600 text-blue-600' : 'border-b-transparent text-gray-400 hover:text-gray-600'
              }`}
              style={{ borderBottom: tab === t.key ? '2px solid #0071e3' : '2px solid transparent' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-10 pb-10 pt-8">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

            {/* OVERVIEW: Reference style - transcript left, insight cards right */}
            {tab === 'overview' && (
              <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
                {/* Left - Overview text + transcript excerpt */}
                <div className="w-full lg:w-[45%]">
                  {structured.overview && (
                    <div className="text-gray-600 leading-[1.8] text-[15px] mb-8">
                      <MarkdownRenderer text={structured.overview} />
                    </div>
                  )}

                  {segments.length > 0 && (
                    <div className="text-gray-600 leading-[1.8] space-y-5 text-[15px]">
                      <p className="text-gray-400 uppercase tracking-wider text-xs font-semibold mb-6">---BEGIN TRANSCRIPT---</p>
                      {segments.slice(0, 10).map(seg => (
                        <p key={seg.id}>
                          <span className="font-medium text-gray-900">{seg.isUser ? 'You' : seg.speaker}:</span>{' '}
                          {seg.text}
                        </p>
                      ))}
                      {segments.length > 10 && (
                        <p className="text-gray-300 text-xs italic">+{segments.length - 10} more segments...</p>
                      )}
                    </div>
                  )}

                  {!structured.overview && segments.length === 0 && (
                    <p className="text-gray-300 text-sm">No insights yet. Click the refresh icon to re-generate.</p>
                  )}
                </div>

                {/* Right - Insight cards grid */}
                {insights.length > 0 && (
                  <div className="w-full lg:w-[55%]">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {insights.map((insight, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className={`${insight.color} p-5 rounded-2xl flex flex-col justify-between`}
                          style={{ aspectRatio: '1' }}
                        >
                          <p className="text-gray-900 text-[15px] font-medium leading-snug">{insight.text}</p>
                          {insight.quote && <p className="text-black/40 text-xs mt-4 leading-tight italic">{insight.quote}</p>}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TRANSCRIPT */}
            {tab === 'transcript' && (
              <div className="max-w-3xl">
                {segments.length === 0 ? (
                  <p className="text-gray-300 text-sm">No transcript available.</p>
                ) : (
                  <div className="text-gray-600 leading-[1.8] space-y-5 text-[15px]">
                    <p className="text-gray-400 uppercase tracking-wider text-xs font-semibold mb-6">---BEGIN TRANSCRIPT---</p>
                    {segments.map((seg, i) => (
                      <motion.p key={seg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.01, 0.3) }}>
                        <span className="text-gray-300 text-xs mr-2 font-mono">{formatTimestamp(seg.start)}</span>
                        <span className="font-medium text-gray-900">{seg.isUser ? 'You' : seg.speaker}:</span>{' '}
                        {seg.text}
                      </motion.p>
                    ))}
                    <p className="text-gray-400 uppercase tracking-wider text-xs font-semibold mt-6">---END TRANSCRIPT---</p>
                  </div>
                )}
              </div>
            )}

            {/* SMART NOTES */}
            {tab === 'smartnotes' && (
              <div className="max-w-3xl">
                {aiNotes ? (
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <VscSparkle size={16} className="text-blue-600" />
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">AI Enhanced</span>
                      <span className="flex-1" />
                      <Pill label="Edit" onClick={() => { setUserNotes(aiNotes); setAiNotes(''); }} />
                      <Pill label="Regenerate" onClick={handleTransform} accent disabled={transforming} />
                      <Pill label="Copy" onClick={() => navigator.clipboard.writeText(aiNotes)} />
                    </div>
                    <MarkdownRenderer text={aiNotes} />
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={userNotes}
                      onChange={e => setUserNotes(e.target.value)}
                      placeholder={"Start writing your notes here...\n\nTips:\n  ## Use headings for sections\n  - Bullet points for key items\n  [date] [attendees] as placeholders\n\nUse a template below to get started.\nThen hit AI Transform to enhance with transcript context."}
                      className="w-full min-h-[350px] p-6 border border-gray-200 rounded-2xl text-[15px] text-gray-900 leading-[1.8] resize-y outline-none placeholder:text-gray-300"
                    />

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleTransform}
                      disabled={transforming || !userNotes.trim()}
                      className="mt-4 px-6 py-3 bg-blue-600 text-white border-none rounded-xl text-sm font-semibold cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <VscSparkle size={15} />
                      {transforming ? 'Transforming...' : 'AI Transform'}
                    </motion.button>

                    {safeTemplates.length > 0 && (
                      <div className="mt-6">
                        <p className="text-xs text-gray-400 mb-3 font-medium">Or start from a template</p>
                        <div className="flex gap-2 flex-wrap">
                          {safeTemplates.map(t => (
                            <button key={t.id}
                              onClick={() => setUserNotes(prev => prev ? prev + '\n\n' + t.content : t.content)}
                              className="px-4 py-2 bg-gray-50 border-none rounded-xl text-sm text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors">
                              {t.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function IBtn({ icon, onClick, className = '' }: { icon: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={onClick}
      className={`bg-transparent border-none text-gray-300 cursor-pointer p-1.5 flex rounded-lg hover:text-gray-500 transition-colors ${className}`}>
      {icon}
    </motion.button>
  );
}

function Pill({ label, onClick, accent, disabled }: { label: string; onClick: () => void; accent?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-3 py-1.5 text-xs font-medium border-none rounded-lg cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        accent ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}>
      {label}
    </button>
  );
}
