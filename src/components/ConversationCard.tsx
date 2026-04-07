import { Link } from 'react-router-dom';
import type { Conversation } from '../lib/types';
import { displayTitle, conversationDuration, safeStructured, safeSegments } from '../lib/types';

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  processing: 'bg-yellow-100 text-yellow-700',
  inProgress: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
};

interface Props {
  conv: Conversation;
  onStar?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ConversationCard({ conv, onStar, onDelete }: Props) {
  const duration = conversationDuration(conv);
  const structured = safeStructured(conv);
  const segments = safeSegments(conv);
  const date = new Date(conv.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm transition-all">
      <Link to={`/conversation/${conv.id}`} className="block p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {structured.emoji && (
              <span className="text-xl shrink-0">{structured.emoji}</span>
            )}
            <h3 className="font-medium text-gray-900 truncate">
              {displayTitle(conv)}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {conv.starred && <span className="text-yellow-500">&#9733;</span>}
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[conv.status] || 'bg-gray-100 text-gray-600'}`}>
              {conv.status}
            </span>
          </div>
        </div>

        {structured.overview && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {structured.overview}
          </p>
        )}

        <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
          <span>{date}</span>
          {duration && <span>{duration}</span>}
          {structured.category && structured.category !== 'general' && (
            <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
              {structured.category}
            </span>
          )}
          <span>{segments.length} segments</span>
        </div>

        {structured.actionItems.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {structured.actionItems.filter(a => !a.completed).length} action items pending
          </div>
        )}
      </Link>

      <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-3">
        {onStar && (
          <button
            onClick={(e) => { e.preventDefault(); onStar(conv.id); }}
            className={`text-xs px-2 py-1 rounded hover:bg-gray-100 transition-colors ${
              conv.starred ? 'text-yellow-500' : 'text-gray-400'
            }`}
          >
            {conv.starred ? '&#9733; Unstar' : '&#9734; Star'}
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.preventDefault(); onDelete(conv.id); }}
            className="text-xs px-2 py-1 rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
