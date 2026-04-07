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
  const date = new Date(conv.createdAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
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
    { key: 'transcript', label: 'Transcript' },
    { key: 'smartnotes', label: 'Smart Notes' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <div style={{ padding: '28px 40px 0', flexShrink: 0 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
          {structured.emoji && <span style={{ fontSize: 36, lineHeight: 1 }}>{structured.emoji}</span>}
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--fg)', fontFamily: 'var(--font-sans)', lineHeight: 1.2 }}>
              {displayTitle(conv)}
            </h1>
            {structured.overview && (
              <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.5, maxWidth: 600 }}>
                {structured.overview}
              </p>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
          <span>{date}</span>
          <span>{time}</span>
          {duration && <span>{duration}</span>}
          <span>{segments.length} segments</span>
          {structured.category && structured.category !== 'general' && (
            <span style={{ background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: 4 }}>{structured.category}</span>
          )}
          <span style={{ flex: 1 }} />
          {/* Actions */}
          <Btn icon={conv.starred ? <VscStarFull size={13} /> : <VscStarEmpty size={13} />} onClick={() => uid && toggleStar(uid, conv.id, conv.starred)}
            style={{ color: conv.starred ? 'var(--yellow)' : undefined }} />
          <Btn icon={<VscRefresh size={13} />} label={reprocessing ? '...' : undefined} onClick={handleReprocess} />
          <Btn icon={<VscCopy size={13} />} onClick={() => navigator.clipboard.writeText(segments.map(s => `${s.speaker}: ${s.text}`).join('\n'))} />
          <Btn icon={<VscExport size={13} />} onClick={() => downloadText(`${displayTitle(conv).replace(/[^a-zA-Z0-9]/g, '_')}.md`, exportAsText(conv))} />
          <Btn icon={<VscTrash size={13} />} onClick={() => uid && confirm('Delete?') && softDelete(uid, conv.id)} style={{ color: 'var(--red)' }} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 20px', fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 500,
                background: 'none', border: 'none', cursor: 'pointer',
                color: tab === t.key ? 'var(--accent)' : 'var(--fg-muted)',
                borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'color 0.15s',
              }}
            >
              {t.label}
              {t.key === 'transcript' && <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.6 }}>({segments.length})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px 60px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
            {tab === 'overview' && <OverviewPanel structured={structured} />}
            {tab === 'transcript' && <TranscriptPanel segments={segments} />}
            {tab === 'smartnotes' && (
              <SmartNotesPanel
                userNotes={userNotes} setUserNotes={setUserNotes}
                aiNotes={aiNotes} setAiNotes={setAiNotes}
                transforming={transforming} onTransform={handleTransform}
                templates={templates}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Small action button ─── */
function Btn({ icon, label, onClick, style }: { icon: React.ReactNode; label?: string; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      style={{ background: 'none', border: 'none', color: 'var(--fg-muted)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontFamily: 'var(--font-mono)', ...style }}
    >
      {icon}{label}
    </motion.button>
  );
}

/* ─── Overview: Notion-style rich layout ─── */
function OverviewPanel({ structured }: { structured: ReturnType<typeof safeStructured> }) {
  if (!structured.overview && structured.actionItems.length === 0 && structured.events.length === 0) {
    return <Empty text="No insights yet. Click re-generate to process." />;
  }

  return (
    <div style={{ maxWidth: 700 }}>
      {structured.overview && (
        <div style={{ marginBottom: 28 }}>
          <SectionTitle>Overview</SectionTitle>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: 'var(--fg)' }}>{structured.overview}</p>
        </div>
      )}

      {structured.actionItems.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionTitle>Action Items</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {structured.actionItems.map(item => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ color: item.completed ? 'var(--green)' : 'var(--fg-muted)', fontSize: 16, lineHeight: 1, marginTop: 1 }}>
                  {item.completed ? '\u2611' : '\u2610'}
                </span>
                <span style={{ fontSize: 14, color: item.completed ? 'var(--fg-muted)' : 'var(--fg)', textDecoration: item.completed ? 'line-through' : 'none', lineHeight: 1.5 }}>
                  {item.description}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {structured.events.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionTitle>Events</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {structured.events.map((ev, i) => {
              const colors = ['var(--cyan)', 'var(--green)', 'var(--pink)', 'var(--orange)', 'var(--yellow)'];
              const c = colors[i % colors.length];
              return (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  style={{ padding: 14, borderRadius: 10, background: 'var(--bg-surface)', borderLeft: `3px solid ${c}` }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 4 }}>{ev.title}</div>
                  {ev.description && <div style={{ fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.4 }}>{ev.description}</div>}
                  {ev.durationMinutes > 0 && <div style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{ev.durationMinutes} min</div>}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Transcript: Notion-style clean view ─── */
function TranscriptPanel({ segments }: { segments: ReturnType<typeof safeSegments> }) {
  if (segments.length === 0) return <Empty text="No transcript available." />;

  const speakerColors = ['var(--cyan)', 'var(--green)', 'var(--pink)', 'var(--orange)', 'var(--yellow)', 'var(--purple)'];
  const colorMap = new Map<number, string>();
  let ci = 0;
  segments.forEach(s => { if (!colorMap.has(s.speakerId)) { colorMap.set(s.speakerId, speakerColors[ci % speakerColors.length]); ci++; } });

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-subtle)', marginBottom: 16 }}>
        ---BEGIN TRANSCRIPT---
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {segments.map((seg, i) => {
          const color = colorMap.get(seg.speakerId) || 'var(--fg)';
          return (
            <motion.div key={seg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.5) }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-subtle)', flexShrink: 0 }}>
                  {formatTimestamp(seg.start)}
                </span>
                <span style={{ fontWeight: 600, fontSize: 13, color }}>{seg.isUser ? 'You' : seg.speaker}:</span>
              </div>
              <p style={{ margin: '0 0 0 52px', fontSize: 14, lineHeight: 1.7, color: 'var(--fg)' }}>{seg.text}</p>
            </motion.div>
          );
        })}
      </div>
      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-subtle)', marginTop: 16 }}>
        ---END TRANSCRIPT---
      </div>
    </div>
  );
}

/* ─── Smart Notes: Editor + AI ─── */
function SmartNotesPanel({ userNotes, setUserNotes, aiNotes, setAiNotes, transforming, onTransform, templates }: {
  userNotes: string; setUserNotes: (v: string) => void;
  aiNotes: string; setAiNotes: (v: string) => void;
  transforming: boolean; onTransform: () => void;
  templates: NoteTemplate[];
}) {
  if (aiNotes) {
    return (
      <div style={{ maxWidth: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <VscSparkle size={14} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1 }}>AI Enhanced Notes</span>
        </div>
        <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: 24, border: '1px solid var(--border)' }}>
          <MarkdownRenderer text={aiNotes} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <PillBtn label="Edit" onClick={() => { setUserNotes(aiNotes); setAiNotes(''); }} />
          <PillBtn label="Regenerate" onClick={onTransform} accent disabled={transforming} />
          <PillBtn label="Copy" onClick={() => navigator.clipboard.writeText(aiNotes)} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700 }}>
      {templates.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 6 }}>Templates</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {templates.map(t => (
              <motion.button key={t.id} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setUserNotes(t.content)}
                style={{ padding: '5px 12px', fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--fg-muted)', cursor: 'pointer' }}>
                {t.name}
              </motion.button>
            ))}
          </div>
        </div>
      )}
      <textarea
        value={userNotes}
        onChange={e => setUserNotes(e.target.value)}
        placeholder="Write your notes template here...&#10;&#10;Use ## headings, - bullets, and [placeholders] like [date], [attendees].&#10;Then click AI Transform."
        style={{
          width: '100%', minHeight: 200, padding: 16, background: 'var(--bg-surface)',
          border: '1px solid var(--border)', borderRadius: 10, color: 'var(--fg)',
          fontSize: 14, fontFamily: 'var(--font-sans)', lineHeight: 1.6,
          resize: 'vertical', outline: 'none',
        }}
      />
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={onTransform}
        disabled={transforming || !userNotes.trim()}
        style={{
          marginTop: 12, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--accent)', color: 'var(--bg)', border: 'none', borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: transforming || !userNotes.trim() ? 'not-allowed' : 'pointer',
          opacity: transforming || !userNotes.trim() ? 0.5 : 1,
        }}
      >
        <VscSparkle size={14} />
        {transforming ? 'Transforming...' : 'AI Transform'}
      </motion.button>
    </div>
  );
}

/* ─── Shared bits ─── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--fg-subtle)', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>{children}</div>;
}

function Empty({ text }: { text: string }) {
  return <div style={{ color: 'var(--fg-muted)', fontSize: 14, fontStyle: 'italic', padding: '40px 0' }}>{text}</div>;
}

function PillBtn({ label, onClick, accent, disabled }: { label: string; onClick: () => void; accent?: boolean; disabled?: boolean }) {
  return (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onClick} disabled={disabled}
      style={{
        padding: '6px 14px', fontSize: 12, fontFamily: 'var(--font-mono)',
        background: accent ? 'var(--accent)' : 'var(--bg-surface)',
        color: accent ? 'var(--bg)' : 'var(--fg-muted)',
        border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      }}>
      {label}
    </motion.button>
  );
}
