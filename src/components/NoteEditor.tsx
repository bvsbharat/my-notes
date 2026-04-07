import type { NoteTemplate } from '../lib/types';

interface Props {
  value: string;
  onChange: (value: string) => void;
  templates: NoteTemplate[];
  onSelectTemplate: (template: NoteTemplate) => void;
}

export function NoteEditor({ value, onChange, templates, onSelectTemplate }: Props) {
  return (
    <div className="flex flex-col h-full">
      {templates.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs text-gray-400">Templates:</span>
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => onSelectTemplate(t)}
              className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"Type your notes here using your own structure...\n\nUse headings (## Section), bullets (- item), and placeholders like [date], [attendees].\n\nThen click AI Transform to enhance with transcript context."}
        className="flex-1 w-full text-sm text-gray-800 resize-none focus:outline-none leading-relaxed placeholder:text-gray-300 p-3 border border-gray-200 rounded-lg min-h-[300px]"
      />
    </div>
  );
}
