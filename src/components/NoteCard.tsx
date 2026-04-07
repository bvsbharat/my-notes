import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VscChevronDown, VscStarFull, VscStarEmpty, VscTrash, VscCopy, VscExport, VscRefresh, VscSparkle } from 'react-icons/vsc';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Conversation, NoteTemplate } from '../lib/types';
import { displayTitle, conversationDuration, safeStructured, safeSegments, formatTimestamp } from '../lib/types';
import { toggleStar, softDelete, exportAsText, downloadText, reprocessConversation } from '../lib/actions';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useTemplates } from '../hooks/useTemplates';
import { useSettings } from '../hooks/useSettings';

type InnerTab = 'overview' | 'transcript' | 'smartnotes';

interface Props {
  conv: Conversation;
  expanded: boolean;
  onToggle: () => void;
  uid: string | undefined;
}

export function NoteCard({ conv, expanded, onToggle, uid }: Props) {
  const structured = safeStructured(conv);
  const segments = safeSegments(conv);
  const duration = conversationDuration(conv);
  const date = new Date(conv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = new Date(conv.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const [innerTab, setInnerTab] = useState<InnerTab>('overview');
  const [reprocessing, setReprocessing] = useState(false);

  // Smart notes state
  const [userNotes, setUserNotes] = useState('');
  const [aiNotes, setAiNotes] = useState('');
  const [transforming, setTransforming] = useState(false);

  const { templates } = useTemplates(uid);
  const { preferences } = useSettings(uid);

  const statusColor = {
    completed: 'var(--green)', processing: 'var(--yellow)',
    inProgress: 'var(--cyan)', failed: 'var(--red)',
  }[conv.status] || 'var(--fg-muted)';

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (uid) toggleStar(uid, conv.id, conv.starred);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (uid && confirm('Delete this note?')) softDelete(uid, conv.id);
  };

  const handleReprocess = async () => {
    setReprocessing(true);
    try { await reprocessConversation(conv.id); }
    catch { /* ignore */ }
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
    } catch (err) {
      alert('Transform failed');
    } finally {
      setTransforming(false);
    }
  };

  const tabs: { key: InnerTab; label: string }[] = [
    { key: 'overview', label: 'overview' },
    { key: 'transcript', label: `transcript (${segments.length})` },
    { key: 'smartnotes', label: 'smart notes' },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      style={{
        background: expanded ? 'var(--bg-card)' : 'var(--bg-secondary)',
        border: `1px solid ${expanded ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 10, overflow: 'hidden', cursor: expanded ? 'default' : 'pointer',
      }}
    >
      {/* Collapsed header -- always visible */}
      <motion.div
        onClick={onToggle}
        style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        whileHover={{ background: 'var(--bg-card-hover)' }}
      >
        {/* Status dot */}
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />

        {/* Emoji + Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {structured.emoji && <span style={{ fontSize: 14 }}>{structured.emoji}</span>}
            <span style={{
              fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13,
              color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {displayTitle(conv)}
            </span>
          </div>
          {!expanded && structured.overview && (
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {structured.overview}
            </div>
          )}
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{date}</span>
          {duration && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{duration}</span>}
          <button onClick={handleStar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: conv.starred ? 'var(--yellow)' : 'var(--fg-muted)', padding: 2 }}>
            {conv.starred ? <VscStarFull size={14} /> : <VscStarEmpty size={14} />}
          </button>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <VscChevronDown size={14} style={{ color: 'var(--fg-muted)' }} />
          </motion.div>
        </div>
      </motion.div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
              {/* Action bar */}
              <div style={{ display: 'flex', gap: 6, padding: '10px 0', flexWrap: 'wrap' }}>
                <ActionBtn icon={<VscRefresh size={12} />} label={reprocessing ? 'processing...' : 're-generate'} onClick={handleReprocess} disabled={reprocessing} accent />
                <ActionBtn icon={<VscCopy size={12} />} label="copy" onClick={() => navigator.clipboard.writeText(segments.map(s => `${s.speaker}: ${s.text}`).join('\n'))} />
                <ActionBtn icon={<VscExport size={12} />} label="export" onClick={() => { const t = exportAsText(conv); downloadText(`${displayTitle(conv).replace(/[^a-zA-Z0-9]/g, '_')}.md`, t); }} />
                <ActionBtn icon={<VscTrash size={12} />} label="delete" onClick={() => { if (uid) softDelete(uid, conv.id); }} danger />
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderBottom: '1px solid var(--border)' }}>
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setInnerTab(t.key)}
                    style={{
                      padding: '8px 14px', fontSize: 12, fontFamily: 'var(--font-mono)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: innerTab === t.key ? 'var(--accent)' : 'var(--fg-muted)',
                      borderBottom: innerTab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={innerTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  style={{ maxHeight: 400, overflowY: 'auto' }}
                >
                  {innerTab === 'overview' && <OverviewTab structured={structured} conv={conv} />}
                  {innerTab === 'transcript' && <TranscriptTab segments={segments} />}
                  {innerTab === 'smartnotes' && (
                    <SmartNotesTab
                      userNotes={userNotes}
                      setUserNotes={setUserNotes}
                      aiNotes={aiNotes}
                      setAiNotes={setAiNotes}
                      transforming={transforming}
                      onTransform={handleTransform}
                      templates={templates}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Sub-components ---

function ActionBtn({ icon, label, onClick, disabled, accent, danger }: {
  icon: React.ReactNode; label: string; onClick: () => void;
  disabled?: boolean; accent?: boolean; danger?: boolean;
}) {
  const bg = accent ? 'var(--accent)' : danger ? 'var(--red)' : 'var(--bg-surface)';
  const fg = accent || danger ? 'var(--bg)' : 'var(--fg-muted)';
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', background: bg, color: fg,
        border: `1px solid ${accent || danger ? 'transparent' : 'var(--border)'}`,
        borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon}{label}
    </motion.button>
  );
}

function OverviewTab({ structured, conv }: { structured: ReturnType<typeof safeStructured>; conv: Conversation }) {
  if (!structured.overview && structured.actionItems.length === 0) {
    return <div style={{ color: 'var(--fg-muted)', fontSize: 13, fontStyle: 'italic', fontFamily: 'var(--font-mono)' }}>// no insights yet — click re-generate</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {structured.overview && (
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginBottom: 4 }}>// overview</div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--fg)', margin: 0 }}>{structured.overview}</p>
        </div>
      )}
      {structured.actionItems.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginBottom: 6 }}>// action items</div>
          {structured.actionItems.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
              <span style={{ color: item.completed ? 'var(--green)' : 'var(--fg-muted)', fontSize: 13, flexShrink: 0 }}>
                {item.completed ? '\u2713' : '\u25CB'}
              </span>
              <span style={{
                fontSize: 13, color: item.completed ? 'var(--fg-muted)' : 'var(--fg)',
                textDecoration: item.completed ? 'line-through' : 'none',
              }}>
                {item.description}
              </span>
            </div>
          ))}
        </div>
      )}
      {structured.events.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginBottom: 6 }}>// events</div>
          {structured.events.map((ev, i) => (
            <div key={i} style={{ fontSize: 13, color: 'var(--fg)', marginBottom: 3 }}>
              <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{ev.title}</span>
              {ev.description && <span style={{ color: 'var(--fg-muted)' }}> — {ev.description}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TranscriptTab({ segments }: { segments: ReturnType<typeof safeSegments> }) {
  if (segments.length === 0) {
    return <div style={{ color: 'var(--fg-muted)', fontSize: 13, fontStyle: 'italic', fontFamily: 'var(--font-mono)' }}>// no transcript</div>;
  }

  const speakerColors = ['var(--cyan)', 'var(--green)', 'var(--pink)', 'var(--orange)', 'var(--yellow)', 'var(--purple)'];
  const colorMap = new Map<number, string>();
  let ci = 0;
  segments.forEach(s => { if (!colorMap.has(s.speakerId)) { colorMap.set(s.speakerId, speakerColors[ci % speakerColors.length]); ci++; } });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {segments.map(seg => (
        <div key={seg.id} style={{ display: 'flex', gap: 8, fontSize: 13, lineHeight: 1.5 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)', flexShrink: 0, paddingTop: 2 }}>
            {formatTimestamp(seg.start)}
          </span>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: colorMap.get(seg.speakerId) || 'var(--fg)' }}>
              {seg.isUser ? 'you' : seg.speaker}
            </span>
            <span style={{ color: 'var(--fg-muted)', margin: '0 4px' }}>:</span>
            <span style={{ color: 'var(--fg)' }}>{seg.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SmartNotesTab({ userNotes, setUserNotes, aiNotes, setAiNotes, transforming, onTransform, templates }: {
  userNotes: string; setUserNotes: (v: string) => void;
  aiNotes: string; setAiNotes: (v: string) => void;
  transforming: boolean; onTransform: () => void;
  templates: NoteTemplate[];
}) {
  if (aiNotes) {
    return (
      <div>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <VscSparkle size={12} /> ai enhanced
        </div>
        <MarkdownRenderer text={aiNotes} />
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <ActionBtn icon={<span>&#9998;</span>} label="edit" onClick={() => { setUserNotes(aiNotes); setAiNotes(''); }} />
          <ActionBtn icon={<VscRefresh size={12} />} label="regenerate" onClick={onTransform} disabled={transforming} accent />
          <ActionBtn icon={<VscCopy size={12} />} label="copy" onClick={() => navigator.clipboard.writeText(aiNotes)} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {templates.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => setUserNotes(t.content)}
              style={{
                padding: '4px 10px', fontSize: 11, fontFamily: 'var(--font-mono)',
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 6, color: 'var(--fg-muted)', cursor: 'pointer',
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
      <textarea
        value={userNotes}
        onChange={e => setUserNotes(e.target.value)}
        placeholder="// write your notes template here..."
        style={{
          width: '100%', minHeight: 120, padding: 12,
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 8, color: 'var(--fg)', fontSize: 13,
          fontFamily: 'var(--font-mono)', resize: 'vertical', outline: 'none',
        }}
      />
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onTransform}
        disabled={transforming || !userNotes.trim()}
        style={{
          marginTop: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--accent)', color: 'var(--bg)',
          border: 'none', borderRadius: 8, fontSize: 12,
          fontFamily: 'var(--font-mono)', fontWeight: 600,
          cursor: transforming || !userNotes.trim() ? 'not-allowed' : 'pointer',
          opacity: transforming || !userNotes.trim() ? 0.5 : 1,
        }}
      >
        <VscSparkle size={14} />
        {transforming ? 'transforming...' : 'ai transform'}
      </motion.button>
    </div>
  );
}
