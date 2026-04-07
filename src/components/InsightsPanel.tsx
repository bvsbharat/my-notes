import type { Structured } from '../lib/types';

export function InsightsPanel({ structured }: { structured: Structured }) {
  const actionItems = structured.actionItems ?? [];
  const events = structured.events ?? [];
  const hasContent = structured.title || structured.overview || actionItems.length > 0;

  if (!hasContent) {
    return <p className="text-gray-400 italic text-sm">No insights extracted yet</p>;
  }

  return (
    <div className="space-y-4">
      {structured.overview && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Overview
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{structured.overview}</p>
        </div>
      )}

      {structured.category && structured.category !== 'general' && (
        <div>
          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
            {structured.category}
          </span>
        </div>
      )}

      {actionItems.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Action Items
          </h4>
          <ul className="space-y-1.5">
            {actionItems.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm">
                <span className={`mt-0.5 shrink-0 ${item.completed ? 'text-green-500' : 'text-gray-300'}`}>
                  {item.completed ? '\u2713' : '\u25CB'}
                </span>
                <span className={item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}>
                  {item.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {events.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Events
          </h4>
          <ul className="space-y-1.5">
            {events.map((event, i) => (
              <li key={i} className="text-sm text-gray-700">
                <span className="font-medium">{event.title}</span>
                {event.description && (
                  <span className="text-gray-500"> - {event.description}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
