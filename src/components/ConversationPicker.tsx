import type { Conversation } from '../lib/types';
import { displayTitle, safeSegments } from '../lib/types';

interface Props {
  conversations: Conversation[];
  selected: string;
  onChange: (id: string) => void;
}

export function ConversationPicker({ conversations, selected, onChange }: Props) {
  const valid = conversations.filter(c => !c.deleted && safeSegments(c).length > 0);

  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 bg-white"
    >
      <option value="">Select a conversation for context...</option>
      {valid.map(c => (
        <option key={c.id} value={c.id}>
          {c.structured?.emoji || ''} {displayTitle(c)} ({safeSegments(c).length} segments)
        </option>
      ))}
    </select>
  );
}
