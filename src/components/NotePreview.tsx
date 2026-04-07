import { MarkdownRenderer } from './MarkdownRenderer';

interface Props {
  aiNotes: string;
  onEdit: () => void;
  onRegenerate: () => void;
  onCopy: () => void;
  onExport: () => void;
  loading: boolean;
}

export function NotePreview({ aiNotes, onEdit, onRegenerate, onCopy, onExport, loading }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-amber-500">&#10024;</span>
        <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
          AI Enhanced Notes
        </span>
      </div>

      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 min-h-[300px]">
        <MarkdownRenderer text={aiNotes} />
      </div>

      <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100">
        <button
          onClick={onEdit}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
        >
          Edit Notes
        </button>
        <button
          onClick={onRegenerate}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Regenerate'}
        </button>
        <button
          onClick={onCopy}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
        >
          Copy
        </button>
        <button
          onClick={onExport}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
        >
          Export .md
        </button>
      </div>
    </div>
  );
}
