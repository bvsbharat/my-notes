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
  const date = new Date(conv.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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
    { key: 'transcript', label: `Transcript` },
    { key: 'smartnotes', label: 'Smart Notes' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header: emoji + title + overview (shown once, not repeated in tab) */}
      <div style={{ padding: '32px 48px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {structured.emoji && <span style={{ fontSize: 40, lineHeight: 1 }}>{structured.emoji}</span>}
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--fg)', lineHeight: 1.25, letterSpacing: -0.5 }}>
              {displayTitle(conv)}
            </h1>
            {structured.overview && (
              <p style={{ margin: '8px 0 0', fontSize: 15, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
                {structured.overview}
              </p>
            )}
          </div>
        </div>

        {/* Meta + actions row */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--fg-subtle)', flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <span>{date}</span>
            <span>{time}</span>
            {duration && <span>{duration}</span>}
            <span>{segments.length} segments</span>
            {structured.category && structured.category !== 'general' && (
              <span style={{ background: 'var(--bg-surface)', padding: '3px 10px', borderRadius: 6, fontSize: 12, color: 'var(--fg-muted)' }}>{structured.category}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <IconBtn icon={conv.starred ? <VscStarFull size={15} /> : <VscStarEmpty size={15} />}
              onClick={() => uid && toggleStar(uid, conv.id, conv.starred)}
              style={{ color: conv.starred ? 'var(--yellow)' : undefined }} />
            <IconBtn icon={<VscRefresh size={15} />} onClick={handleReprocess} />
            <IconBtn icon={<VscCopy size={15} />} onClick={() => navigator.clipboard.writeText(segments.map(s => `${s.speaker}: ${s.text}`).join('\n'))} />
            <IconBtn icon={<VscExport size={15} />} onClick={() => downloadText(`${displayTitle(conv).replace(/[^a-zA-Z0-9]/g, '_')}.md`, exportAsText(conv))} />
            <IconBtn icon={<VscTrash size={15} />} onClick={() => uid && confirm('Delete?') && softDelete(uid, conv.id)} style={{ color: 'var(--red)' }} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginTop: 4 }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '12px 20px', fontSize: 14, fontWeight: 500,
                background: 'none', border: 'none', cursor: 'pointer',
                color: tab === t.key ? 'var(--accent)' : 'var(--fg-muted)',
                borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'color 0.15s',
              }}
            >
              {t.label}
              {t.key === 'transcript' && <span style={{ marginLeft: 4, fontSize: 12, opacity: 0.5 }}>({segments.length})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 48px 60px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            {tab === 'overview' && <OverviewPanel structured={structured} segments={segments} />}
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

function IconBtn({ icon, onClick, style }: { icon: React.ReactNode; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={onClick}
      style={{ background: 'none', border: 'none', color: 'var(--fg-subtle)', cursor: 'pointer', padding: 6, display: 'flex', borderRadius: 6, ...style }}>
      {icon}
    </motion.button>
  );
}

/* ─── Overview: split layout like reference image ─── */
/* Left: transcript excerpt, Right: colored insight cards grid */
function OverviewPanel({ structured, segments }: { structured: ReturnType<typeof safeStructured>; segments: ReturnType<typeof safeSegments> }) {
  const hasInsights = structured.actionItems.length > 0 || structured.events.length > 0;
  const hasTranscript = segments.length > 0;

  if (!structured.overview && !hasInsights && !hasTranscript) {
    return <div style={{ color: 'var(--fg-subtle)', fontSize: 15, padding: '40px 0' }}>No insights yet. Click the refresh icon to re-generate.</div>;
  }

  // Collect all insight cards (action items + events)
  const cards: { title: string; subtitle: string; color: string }[] = [];
  const cardColors = ['#fef3c7', '#dcfce7', '#fce7f3', '#dbeafe', '#f3e8ff', '#ffedd5', '#e0f2fe', '#fef9c3'];

  structured.actionItems.forEach((item, i) => {
    cards.push({ title: item.description, subtitle: item.completed ? 'completed' : 'pending', color: cardColors[i % cardColors.length] });
  });
  structured.events.forEach((ev, i) => {
    cards.push({ title: ev.title, subtitle: ev.description || `${ev.durationMinutes} min`, color: cardColors[(i + structured.actionItems.length) % cardColors.length] });
  });

  return (
    <div style={{ display: 'flex', gap: 40 }}>
      {/* Left: transcript excerpt */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {hasTranscript && (
          <>
            <div style={{ fontSize: 12, color: 'var(--fg-subtle)', marginBottom: 16, letterSpacing: 1 }}>
              ---BEGIN TRANSCRIPT---
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {segments.slice(0, 15).map(seg => {
                const speakerColors: Record<number, string> = {};
                const colors = ['var(--accent)', '#34c759', '#ff2d55', '#ff9500', '#af52de)', '#5ac8fa'];
                if (!speakerColors[seg.speakerId]) speakerColors[seg.speakerId] = colors[seg.speakerId % colors.length];

                return (
                  <div key={seg.id}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--fg)' }}>{seg.speaker}: </span>
                    <span style={{ fontSize: 14, color: 'var(--fg-secondary)', lineHeight: 1.7 }}>{seg.text}</span>
                  </div>
                );
              })}
              {segments.length > 15 && (
                <div style={{ fontSize: 13, color: 'var(--fg-subtle)', fontStyle: 'italic' }}>
                  ...and {segments.length - 15} more segments
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right: colored insight cards grid (like reference) */}
      {cards.length > 0 && (
        <div style={{ width: 420, flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {cards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  background: card.color,
                  borderRadius: 10,
                  padding: 14,
                  minHeight: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', lineHeight: 1.4 }}>
                  {card.title.length > 60 ? card.title.slice(0, 60) + '...' : card.title}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', marginTop: 8, fontStyle: 'italic' }}>
                  {card.subtitle}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Transcript: clean full view ─── */
function TranscriptPanel({ segments }: { segments: ReturnType<typeof safeSegments> }) {
  if (segments.length === 0) return <div style={{ color: 'var(--fg-subtle)', fontSize: 15, padding: '40px 0' }}>No transcript available.</div>;

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ fontSize: 12, color: 'var(--fg-subtle)', marginBottom: 20, letterSpacing: 1 }}>---BEGIN TRANSCRIPT---</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {segments.map((seg, i) => (
          <motion.div key={seg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.015, 0.4) }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--fg-subtle)', flexShrink: 0, paddingTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                {formatTimestamp(seg.start)}
              </span>
              <div>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--fg)' }}>{seg.isUser ? 'You' : seg.speaker}: </span>
                <span style={{ fontSize: 14, color: 'var(--fg-secondary)', lineHeight: 1.7 }}>{seg.text}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'var(--fg-subtle)', marginTop: 20, letterSpacing: 1 }}>---END TRANSCRIPT---</div>
    </div>
  );
}

/* ─── Smart Notes ─── */
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
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1 }}>AI Enhanced Notes</span>
        </div>
        <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 28, border: '1px solid var(--border-light)' }}>
          <MarkdownRenderer text={aiNotes} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Pill label="Edit" onClick={() => { setUserNotes(aiNotes); setAiNotes(''); }} />
          <Pill label="Regenerate" onClick={onTransform} accent disabled={transforming} />
          <Pill label="Copy" onClick={() => navigator.clipboard.writeText(aiNotes)} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700 }}>
      {templates.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 8, fontWeight: 500 }}>Templates</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {templates.map(t => (
              <motion.button key={t.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setUserNotes(t.content)}
                style={{ padding: '6px 14px', fontSize: 13, background: 'var(--bg-surface)', border: 'none', borderRadius: 8, color: 'var(--fg-muted)', cursor: 'pointer', fontWeight: 500 }}>
                {t.name}
              </motion.button>
            ))}
          </div>
        </div>
      )}
      <textarea
        value={userNotes}
        onChange={e => setUserNotes(e.target.value)}
        placeholder={"Write your notes template here...\n\nUse ## headings, - bullets, and [placeholders].\nThen click AI Transform."}
        style={{
          width: '100%', minHeight: 220, padding: 20, background: 'var(--bg)',
          border: '1px solid var(--border-light)', borderRadius: 12, color: 'var(--fg)',
          fontSize: 15, lineHeight: 1.7, resize: 'vertical', outline: 'none',
          fontFamily: 'var(--font)',
        }}
      />
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={onTransform}
        disabled={transforming || !userNotes.trim()}
        style={{
          marginTop: 14, padding: '11px 22px', display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10,
          fontSize: 14, fontWeight: 600, cursor: transforming || !userNotes.trim() ? 'not-allowed' : 'pointer',
          opacity: transforming || !userNotes.trim() ? 0.5 : 1,
        }}
      >
        <VscSparkle size={15} />
        {transforming ? 'Transforming...' : 'AI Transform'}
      </motion.button>
    </div>
  );
}

function Pill({ label, onClick, accent, disabled }: { label: string; onClick: () => void; accent?: boolean; disabled?: boolean }) {
  return (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onClick} disabled={disabled}
      style={{
        padding: '7px 16px', fontSize: 13, fontWeight: 500,
        background: accent ? 'var(--accent)' : 'var(--bg-surface)',
        color: accent ? '#fff' : 'var(--fg-muted)',
        border: 'none', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      }}>
      {label}
    </motion.button>
  );
}
