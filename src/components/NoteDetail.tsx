import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VscStarFull, VscStarEmpty, VscTrash, VscCopy, VscExport, VscRefresh, VscSparkle } from 'react-icons/vsc';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Conversation, NoteTemplate, AIPreferences, SmartNote } from '../lib/types';
import { displayTitle, conversationDuration, safeStructured, safeSegments, formatTimestamp } from '../lib/types';
import { toggleStar, softDelete, exportAsText, downloadText, reprocessConversation } from '../lib/actions';
import { MarkdownRenderer } from './MarkdownRenderer';

type Tab = 'overview' | 'transcript' | 'smartnotes';

interface Props {
  conv: Conversation;
  uid: string | undefined;
  templates: NoteTemplate[];
  preferences: AIPreferences;
  savedNotes: SmartNote[];
  saveNote: (note: any) => Promise<string | undefined>;
}

export function NoteDetail({ conv, uid, templates, preferences, savedNotes, saveNote }: Props) {
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

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'transcript', label: `Transcript (${segments.length})` },
    { key: 'smartnotes', label: 'Smart Notes' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header: title + tabs + actions */}
      <div style={{ padding: '20px 36px 0', flexShrink: 0, borderBottom: '1px solid #e8e8ed' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          {structured.emoji && <span style={{ fontSize: 28 }}>{structured.emoji}</span>}
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1d1d1f', flex: 1, letterSpacing: -0.4 }}>
            {displayTitle(conv)}
          </h1>
          <div style={{ display: 'flex', gap: 2 }}>
            <IBtn icon={conv.starred ? <VscStarFull size={15} /> : <VscStarEmpty size={15} />}
              onClick={() => uid && toggleStar(uid, conv.id, conv.starred)}
              style={{ color: conv.starred ? '#ffcc00' : undefined }} />
            <IBtn icon={<VscRefresh size={15} />} onClick={handleReprocess} />
            <IBtn icon={<VscCopy size={15} />} onClick={() => navigator.clipboard.writeText(segments.map(s => `${s.speaker}: ${s.text}`).join('\n'))} />
            <IBtn icon={<VscExport size={15} />} onClick={() => downloadText(`${displayTitle(conv).replace(/[^a-zA-Z0-9]/g, '_')}.md`, exportAsText(conv))} />
            <IBtn icon={<VscTrash size={15} />} onClick={() => uid && confirm('Delete?') && softDelete(uid, conv.id)} style={{ color: '#ff3b30' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 0, flex: 1 }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '10px 18px', fontSize: 13, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer',
                color: tab === t.key ? '#0071e3' : '#86868b',
                borderBottom: tab === t.key ? '2px solid #0071e3' : '2px solid transparent',
              }}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#aeaeb2', display: 'flex', gap: 10 }}>
            <span>{date} {time}</span>
            {duration && <span>{duration}</span>}
            {structured.category && structured.category !== 'general' && (
              <span style={{ background: '#f0f0f2', padding: '2px 8px', borderRadius: 6 }}>{structured.category}</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === 'overview' && <OverviewTab structured={structured} segments={segments} />}
            {tab === 'transcript' && <TranscriptTab segments={segments} />}
            {tab === 'smartnotes' && (
              <SmartNotesTab userNotes={userNotes} setUserNotes={setUserNotes}
                aiNotes={aiNotes} setAiNotes={setAiNotes}
                transforming={transforming} onTransform={handleTransform}
                onSelectTemplate={(t) => setUserNotes(prev => prev ? prev + '\n\n' + t.content : t.content)}
                templates={templates} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function IBtn({ icon, onClick, style }: { icon: React.ReactNode; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={onClick}
      style={{ background: 'none', border: 'none', color: '#aeaeb2', cursor: 'pointer', padding: 6, display: 'flex', borderRadius: 6, ...style }}>
      {icon}
    </motion.button>
  );
}

/* ─── OVERVIEW: full rich detail + sidebar ─── */
function OverviewTab({ structured, segments }: { structured: ReturnType<typeof safeStructured>; segments: ReturnType<typeof safeSegments> }) {
  const noContent = !structured.overview && structured.actionItems.length === 0 && structured.events.length === 0;
  if (noContent) return <div style={{ padding: '40px 36px', color: '#aeaeb2', fontSize: 15 }}>No insights yet. Click refresh to re-generate.</div>;

  const PRIORITY_COLORS = [
    { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },  // red - high
    { bg: '#fff7ed', border: '#fdba74', text: '#9a3412' },  // orange
    { bg: '#fefce8', border: '#fde047', text: '#854d0e' },  // yellow
    { bg: '#f0fdf4', border: '#86efac', text: '#166534' },  // green
    { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },  // blue
    { bg: '#faf5ff', border: '#d8b4fe', text: '#6b21a8' },  // purple
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100%' }}>
      {/* Main content - full overview */}
      <div style={{ flex: 1, padding: '28px 36px 60px', minWidth: 0 }}>
        {structured.overview && (
          <div style={{ marginBottom: 28 }}>
            <SLabel>Overview</SLabel>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.8, color: '#424245' }}>{structured.overview}</p>
          </div>
        )}

        {/* Key points as color-highlighted cards */}
        {structured.actionItems.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <SLabel>Key Points &amp; Action Items</SLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {structured.actionItems.map((item, i) => {
                const c = PRIORITY_COLORS[i % PRIORITY_COLORS.length];
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    style={{
                      padding: '14px 18px', borderRadius: 12, background: c.bg,
                      borderLeft: `4px solid ${c.border}`,
                    }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: c.text, lineHeight: 1.6 }}>
                      {item.description}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Events as colored grid cards */}
        {structured.events.length > 0 && (
          <div>
            <SLabel>Events &amp; Topics</SLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {structured.events.map((ev, i) => {
                const colors = ['#dbeafe', '#dcfce7', '#fce7f3', '#fef3c7', '#f3e8ff', '#ffedd5'];
                return (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    style={{ padding: 16, borderRadius: 12, background: colors[i % colors.length] }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 4 }}>{ev.title}</div>
                    {ev.description && <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', lineHeight: 1.4 }}>{ev.description}</div>}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR: todo + events */}
      {(structured.actionItems.length > 0 || structured.events.length > 0) && (
        <div style={{ width: 280, flexShrink: 0, borderLeft: '1px solid #e8e8ed', padding: '28px 20px', background: '#fafafa' }}>
          {/* Todo */}
          {structured.actionItems.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#86868b', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
                Tasks ({structured.actionItems.filter(a => !a.completed).length}/{structured.actionItems.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {structured.actionItems.map((item, i) => {
                  const colors = ['#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#f3e8ff', '#ffedd5'];
                  return (
                    <motion.div key={item.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 8,
                        background: item.completed ? '#f9f9fb' : colors[i % colors.length],
                      }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                        background: item.completed ? '#34c759' : '#fff', border: item.completed ? 'none' : '2px solid #d2d2d7', color: '#fff',
                      }}>{item.completed && '\u2713'}</span>
                      <span style={{
                        fontSize: 13, lineHeight: 1.4, color: item.completed ? '#aeaeb2' : '#1d1d1f',
                        textDecoration: item.completed ? 'line-through' : 'none',
                      }}>{item.description}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming events */}
          {structured.events.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#86868b', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Events</div>
              {structured.events.map((ev, i) => (
                <div key={i} style={{ padding: '8px 10px', marginBottom: 4, borderRadius: 8, background: '#fff', border: '1px solid #e8e8ed' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f' }}>{ev.title}</div>
                  {ev.description && <div style={{ fontSize: 11, color: '#86868b', marginTop: 2 }}>{ev.description}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── TRANSCRIPT ─── */
function TranscriptTab({ segments }: { segments: ReturnType<typeof safeSegments> }) {
  if (segments.length === 0) return <div style={{ padding: '40px 36px', color: '#aeaeb2', fontSize: 15 }}>No transcript.</div>;
  return (
    <div style={{ padding: '28px 36px 60px', maxWidth: 740 }}>
      <div style={{ fontSize: 12, color: '#aeaeb2', marginBottom: 20, letterSpacing: 1 }}>---BEGIN TRANSCRIPT---</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {segments.map((seg, i) => (
          <motion.div key={seg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.01, 0.3) }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 12, color: '#aeaeb2', flexShrink: 0, paddingTop: 2, fontVariantNumeric: 'tabular-nums' }}>{formatTimestamp(seg.start)}</span>
              <div><span style={{ fontWeight: 600, fontSize: 14, color: '#1d1d1f' }}>{seg.isUser ? 'You' : seg.speaker}: </span><span style={{ fontSize: 14, color: '#424245', lineHeight: 1.7 }}>{seg.text}</span></div>
            </div>
          </motion.div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: '#aeaeb2', marginTop: 20, letterSpacing: 1 }}>---END TRANSCRIPT---</div>
    </div>
  );
}

/* ─── SMART NOTES ─── */
function SmartNotesTab({ userNotes, setUserNotes, aiNotes, setAiNotes, transforming, onTransform, onSelectTemplate, templates }: {
  userNotes: string; setUserNotes: (v: string) => void;
  aiNotes: string; setAiNotes: (v: string) => void;
  transforming: boolean; onTransform: () => void;
  onSelectTemplate: (t: NoteTemplate) => void;
  templates: NoteTemplate[];
}) {
  if (aiNotes) {
    return (
      <div style={{ padding: '28px 36px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <VscSparkle size={16} style={{ color: '#0071e3' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#0071e3', textTransform: 'uppercase', letterSpacing: 1 }}>AI Enhanced</span>
          <span style={{ flex: 1 }} />
          <Pill label="Edit" onClick={() => { setUserNotes(aiNotes); setAiNotes(''); }} />
          <Pill label="Regenerate" onClick={onTransform} accent disabled={transforming} />
          <Pill label="Copy" onClick={() => navigator.clipboard.writeText(aiNotes)} />
        </div>
        <div style={{ background: '#fafafa', borderRadius: 14, padding: 32, border: '1px solid #e8e8ed', minHeight: 300 }}>
          <MarkdownRenderer text={aiNotes} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 36px 60px' }}>
      {templates.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#86868b', marginBottom: 8, fontWeight: 500 }}>Insert template</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {templates.map(t => (
              <motion.button key={t.id} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => onSelectTemplate(t)}
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, background: '#fff', border: '1px solid #e8e8ed', borderRadius: 10, color: '#424245', cursor: 'pointer' }}>
                {t.name}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      <div style={{ border: '1px solid #d2d2d7', borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fafafa', borderBottom: '1px solid #e8e8ed', fontSize: 12, color: '#86868b' }}>
          <span style={{ fontWeight: 600 }}>Editor</span>
          <span style={{ flex: 1 }} />
          <span>{userNotes.length} chars</span>
        </div>
        <textarea
          value={userNotes}
          onChange={e => setUserNotes(e.target.value)}
          placeholder={"Start writing your notes here...\n\nTips:\n  ## Use headings for sections\n  - Bullet points for key items\n  [date] [attendees] as placeholders\n\nClick a template above to get started.\nThen hit AI Transform to enhance with transcript context."}
          style={{
            width: '100%', minHeight: 400, padding: '20px 24px', border: 'none', color: '#1d1d1f',
            fontSize: 15, lineHeight: 1.8, resize: 'vertical', outline: 'none', background: '#fff',
          }}
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.02, boxShadow: '0 4px 14px rgba(0,113,227,0.3)' }}
        whileTap={{ scale: 0.98 }}
        onClick={onTransform}
        disabled={transforming || !userNotes.trim()}
        style={{
          marginTop: 16, padding: '13px 28px', display: 'flex', alignItems: 'center', gap: 8,
          background: '#0071e3', color: '#fff', border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 600, cursor: transforming || !userNotes.trim() ? 'not-allowed' : 'pointer',
          opacity: transforming || !userNotes.trim() ? 0.5 : 1, boxShadow: '0 2px 8px rgba(0,113,227,0.2)',
        }}
      >
        <VscSparkle size={16} />
        {transforming ? 'Transforming...' : 'AI Transform'}
      </motion.button>
    </div>
  );
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: '#86868b', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>{children}</div>;
}

function Pill({ label, onClick, accent, disabled }: { label: string; onClick: () => void; accent?: boolean; disabled?: boolean }) {
  return (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onClick} disabled={disabled}
      style={{ padding: '6px 14px', fontSize: 12, fontWeight: 500, background: accent ? '#0071e3' : '#f0f0f2', color: accent ? '#fff' : '#86868b', border: 'none', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
      {label}
    </motion.button>
  );
}
