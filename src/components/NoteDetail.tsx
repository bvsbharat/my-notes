import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VscStarFull, VscStarEmpty, VscTrash, VscCopy, VscExport, VscRefresh, VscSparkle } from 'react-icons/vsc';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Conversation, NoteTemplate, AIPreferences, SmartNote } from '../lib/types';
import { displayTitle, conversationDuration, safeStructured, safeSegments, formatTimestamp } from '../lib/types';
import { toggleStar, softDelete, exportAsText, downloadText, reprocessConversation } from '../lib/actions';
import { MarkdownRenderer } from './MarkdownRenderer';

type Tab = 'overview' | 'smartnotes';

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

  const handleSelectTemplate = (t: NoteTemplate) => {
    setUserNotes(prev => prev ? prev + '\n\n' + t.content : t.content);
    setAiNotes('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header: title only + actions + tabs in corner */}
      <div style={{ padding: '24px 40px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          {structured.emoji && <span style={{ fontSize: 32 }}>{structured.emoji}</span>}
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#1d1d1f', flex: 1, letterSpacing: -0.5, lineHeight: 1.2 }}>
            {displayTitle(conv)}
          </h1>

          {/* Tabs in top-right */}
          <div style={{ display: 'flex', background: '#f0f0f2', borderRadius: 10, padding: 3 }}>
            {(['overview', 'smartnotes'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '7px 16px', fontSize: 13, fontWeight: 500,
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? '#1d1d1f' : '#86868b',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {t === 'overview' ? 'Overview' : 'Smart Notes'}
              </button>
            ))}
          </div>
        </div>

        {/* Meta + actions */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0 16px', borderBottom: '1px solid #e8e8ed' }}>
          <div style={{ display: 'flex', gap: 10, fontSize: 13, color: '#aeaeb2', flex: 1 }}>
            <span>{date}</span>
            <span>{time}</span>
            {duration && <span>{duration}</span>}
            <span>{segments.length} segments</span>
            {structured.category && structured.category !== 'general' && (
              <span style={{ background: '#f0f0f2', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>{structured.category}</span>
            )}
          </div>
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
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px 60px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === 'overview' && <OverviewTab structured={structured} segments={segments} />}
            {tab === 'smartnotes' && (
              <SmartNotesTab
                userNotes={userNotes} setUserNotes={setUserNotes}
                aiNotes={aiNotes} setAiNotes={setAiNotes}
                transforming={transforming} onTransform={handleTransform}
                onSelectTemplate={handleSelectTemplate} templates={templates}
              />
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

/* ─── Overview: text overview + to-do style tasks + transcript excerpt ─── */
function OverviewTab({ structured, segments }: { structured: ReturnType<typeof safeStructured>; segments: ReturnType<typeof safeSegments> }) {
  const noContent = !structured.overview && structured.actionItems.length === 0 && segments.length === 0;
  if (noContent) return <div style={{ color: '#aeaeb2', fontSize: 15, padding: '40px 0' }}>No insights yet. Click the refresh icon to re-generate.</div>;

  return (
    <div style={{ display: 'flex', gap: 40 }}>
      {/* Left: overview text + transcript */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {structured.overview && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.75, color: '#424245' }}>{structured.overview}</p>
          </div>
        )}

        {segments.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: '#aeaeb2', marginBottom: 14, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>Transcript</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {segments.slice(0, 12).map(seg => (
                <div key={seg.id} style={{ fontSize: 14, color: '#424245', lineHeight: 1.7 }}>
                  <span style={{ fontWeight: 600, color: '#1d1d1f' }}>{seg.speaker}: </span>
                  {seg.text}
                </div>
              ))}
              {segments.length > 12 && (
                <div style={{ fontSize: 13, color: '#aeaeb2', fontStyle: 'italic' }}>+{segments.length - 12} more segments</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right: to-do list style action items + events */}
      {(structured.actionItems.length > 0 || structured.events.length > 0) && (
        <div style={{ width: 340, flexShrink: 0 }}>
          {structured.actionItems.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#aeaeb2', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
                To-do ({structured.actionItems.filter(a => !a.completed).length}/{structured.actionItems.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {structured.actionItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 14px', background: '#f9f9fb', borderRadius: 10,
                      border: '1px solid #e8e8ed',
                    }}
                  >
                    <span style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                      background: item.completed ? '#34c759' : '#fff',
                      border: item.completed ? 'none' : '2px solid #d2d2d7',
                      color: '#fff',
                    }}>
                      {item.completed && '\u2713'}
                    </span>
                    <span style={{
                      fontSize: 14, color: item.completed ? '#aeaeb2' : '#1d1d1f',
                      textDecoration: item.completed ? 'line-through' : 'none', lineHeight: 1.5,
                    }}>
                      {item.description}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {structured.events.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: '#aeaeb2', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>Events</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {structured.events.map((ev, i) => {
                  const colors = ['#dbeafe', '#dcfce7', '#fce7f3', '#fef3c7', '#f3e8ff'];
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ padding: 12, borderRadius: 10, background: colors[i % colors.length] }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 2 }}>{ev.title}</div>
                      {ev.description && <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{ev.description}</div>}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Smart Notes: big editor UI ─── */
function SmartNotesTab({ userNotes, setUserNotes, aiNotes, setAiNotes, transforming, onTransform, onSelectTemplate, templates }: {
  userNotes: string; setUserNotes: (v: string) => void;
  aiNotes: string; setAiNotes: (v: string) => void;
  transforming: boolean; onTransform: () => void;
  onSelectTemplate: (t: NoteTemplate) => void;
  templates: NoteTemplate[];
}) {
  if (aiNotes) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <VscSparkle size={16} style={{ color: '#0071e3' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0071e3', textTransform: 'uppercase', letterSpacing: 1 }}>AI Enhanced</span>
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
    <div>
      {/* Templates */}
      {templates.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#86868b', marginBottom: 8, fontWeight: 500 }}>Insert template</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {templates.map(t => (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.04, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onSelectTemplate(t)}
                style={{
                  padding: '8px 16px', fontSize: 13, fontWeight: 500,
                  background: '#fff', border: '1px solid #e8e8ed', borderRadius: 10,
                  color: '#424245', cursor: 'pointer',
                }}
              >
                {t.name}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      <div style={{
        border: '1px solid #d2d2d7', borderRadius: 14, overflow: 'hidden',
        background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        {/* Editor toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
          background: '#fafafa', borderBottom: '1px solid #e8e8ed', fontSize: 12, color: '#86868b',
        }}>
          <span style={{ fontWeight: 600 }}>Editor</span>
          <span style={{ flex: 1 }} />
          <span>{userNotes.length} chars</span>
        </div>

        <textarea
          value={userNotes}
          onChange={e => setUserNotes(e.target.value)}
          placeholder={"Start writing your notes here...\n\nTips:\n  ## Use headings for sections\n  - Bullet points for key items\n  [date] [attendees] as placeholders\n\nClick a template above to get started, or write freely.\nThen hit AI Transform to enhance with transcript context."}
          style={{
            width: '100%', minHeight: 360, padding: '20px 24px',
            border: 'none', color: '#1d1d1f', fontSize: 15, lineHeight: 1.8,
            resize: 'vertical', outline: 'none', background: '#fff',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
          }}
        />
      </div>

      {/* Transform button */}
      <motion.button
        whileHover={{ scale: 1.02, boxShadow: '0 4px 14px rgba(0,113,227,0.3)' }}
        whileTap={{ scale: 0.98 }}
        onClick={onTransform}
        disabled={transforming || !userNotes.trim()}
        style={{
          marginTop: 16, padding: '13px 28px', display: 'flex', alignItems: 'center', gap: 8,
          background: '#0071e3', color: '#fff', border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 600, cursor: transforming || !userNotes.trim() ? 'not-allowed' : 'pointer',
          opacity: transforming || !userNotes.trim() ? 0.5 : 1,
          boxShadow: '0 2px 8px rgba(0,113,227,0.2)',
        }}
      >
        <VscSparkle size={16} />
        {transforming ? 'Transforming...' : 'AI Transform'}
      </motion.button>
    </div>
  );
}

function Pill({ label, onClick, accent, disabled }: { label: string; onClick: () => void; accent?: boolean; disabled?: boolean }) {
  return (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onClick} disabled={disabled}
      style={{
        padding: '6px 14px', fontSize: 12, fontWeight: 500,
        background: accent ? '#0071e3' : '#f0f0f2', color: accent ? '#fff' : '#86868b',
        border: 'none', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      }}>
      {label}
    </motion.button>
  );
}
