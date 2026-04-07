import { useState } from 'react';
import { motion } from 'motion/react';
import { VscAdd, VscEdit, VscTrash } from 'react-icons/vsc';
import type { NoteTemplate } from '../lib/types';

interface Props {
  templates: NoteTemplate[];
  onSave: (template: Partial<NoteTemplate> & { name: string; content: string }) => void;
  onDelete: (id: string) => void;
}

export function TemplateManager({ templates, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<NoteTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  const startCreate = () => { setCreating(true); setEditing(null); setName(''); setContent(''); };
  const startEdit = (t: NoteTemplate) => { setEditing(t); setCreating(false); setName(t.name); setContent(t.content); };
  const handleSave = () => {
    if (!name.trim() || !content.trim()) return;
    onSave({ id: editing?.id, name: name.trim(), content: content.trim(), isDefault: editing?.isDefault ?? false, createdAt: editing?.createdAt });
    setEditing(null); setCreating(false); setName(''); setContent('');
  };
  const cancel = () => { setEditing(null); setCreating(false); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: 'var(--accent)', color: 'var(--bg)', border: 'none', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
          <VscAdd size={12} /> new
        </motion.button>
      </div>

      {(creating || editing) && (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 10 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="template name"
            style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--fg)', fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none', marginBottom: 8 }} />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="template content..." rows={6}
            style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--fg)', fontSize: 12, fontFamily: 'var(--font-mono)', resize: 'vertical', outline: 'none', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleSave} style={{ padding: '5px 12px', background: 'var(--accent)', color: 'var(--bg)', border: 'none', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>save</button>
            <button onClick={cancel} style={{ padding: '5px 12px', background: 'var(--bg-surface)', color: 'var(--fg-muted)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>cancel</button>
          </div>
        </div>
      )}

      {templates.map(t => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
          <div>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}>{t.name}</span>
            {t.isDefault && <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--fg-muted)', background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 4 }}>default</span>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => startEdit(t)} style={{ background: 'none', border: 'none', color: 'var(--fg-muted)', cursor: 'pointer' }}><VscEdit size={14} /></button>
            <button onClick={() => onDelete(t.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}><VscTrash size={14} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
