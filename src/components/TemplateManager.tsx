import { useState } from 'react';
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

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setName('');
    setContent('');
  };

  const startEdit = (t: NoteTemplate) => {
    setEditing(t);
    setCreating(false);
    setName(t.name);
    setContent(t.content);
  };

  const handleSave = () => {
    if (!name.trim() || !content.trim()) return;
    onSave({
      id: editing?.id,
      name: name.trim(),
      content: content.trim(),
      isDefault: editing?.isDefault ?? false,
      createdAt: editing?.createdAt,
    });
    setEditing(null);
    setCreating(false);
    setName('');
    setContent('');
  };

  const cancel = () => {
    setEditing(null);
    setCreating(false);
    setName('');
    setContent('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Note Templates</h3>
        <button
          onClick={startCreate}
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        >
          + New Template
        </button>
      </div>

      {(creating || editing) && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Template content with ## headings, - bullets, [placeholders]..."
            rows={8}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 resize-none focus:outline-none focus:border-gray-400 font-mono"
          />
          <div className="flex gap-2">
            <button onClick={handleSave} className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800">
              Save
            </button>
            <button onClick={cancel} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {templates.map(t => (
          <div key={t.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
            <div>
              <span className="text-sm font-medium text-gray-800">{t.name}</span>
              {t.isDefault && <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Default</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(t)} className="text-xs text-gray-400 hover:text-gray-600">Edit</button>
              <button onClick={() => onDelete(t.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
