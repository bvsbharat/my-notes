// TypeScript types ported from Dart schemas in lib/backend/schema/

export type ConversationStatus = 'inProgress' | 'processing' | 'completed' | 'failed';
export type ConversationSource = 'phone' | 'wearable' | 'import_';

export interface TranscriptSegment {
  id: string;
  text: string;
  speaker: string;
  speakerId: number;
  isUser: boolean;
  start: number; // seconds from recording start
  end: number;
  personId?: string;
}

export interface ActionItem {
  id: string;
  description: string;
  completed: boolean;
  dueDate?: string;
  completedAt?: string;
  conversationId?: string;
  indentLevel: number;
  sortOrder: number;
}

export interface StructuredEvent {
  title: string;
  startTime?: string;
  durationMinutes: number;
  description: string;
}

export interface Structured {
  title: string;
  overview: string;
  emoji: string;
  category: string;
  actionItems: ActionItem[];
  events: StructuredEvent[];
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
  status: ConversationStatus;
  source: ConversationSource;
  structured: Structured;
  transcriptSegments: TranscriptSegment[];
  starred: boolean;
  deleted: boolean;
  folderId?: string;
  language?: string;
}

export interface DailySummary {
  date: string;
  topics: string[];
  decisions: string[];
  insights: string[];
  conversationIds: string[];
  totalConversations: number;
  totalMinutes: number;
}

// --- Smart Notes types ---

export interface NoteTemplate {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SmartNote {
  id: string;
  conversationId: string;
  userNotes: string;
  aiNotes: string;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIPreferences {
  style: 'concise' | 'detailed';
  tone: 'professional' | 'casual';
  includeSpeakerQuotes: boolean;
  includeTimestamps: boolean;
}

export const DEFAULT_AI_PREFERENCES: AIPreferences = {
  style: 'detailed',
  tone: 'professional',
  includeSpeakerQuotes: true,
  includeTimestamps: false,
};

export const DEFAULT_TEMPLATES: Omit<NoteTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Meeting Summary',
    content: `## Meeting Summary\n\n**Date:** [date]\n**Attendees:** [attendees]\n\n### Key Discussion Points\n- \n\n### Decisions Made\n- \n\n### Action Items\n- [ ] \n\n### Next Steps\n- `,
    isDefault: true,
  },
  {
    name: 'Action Items Only',
    content: `## Action Items\n\n**From:** [conversation title]\n\n### High Priority\n- [ ] \n\n### Follow-ups\n- [ ] \n\n### Deadlines\n- `,
    isDefault: true,
  },
  {
    name: 'Decision Log',
    content: `## Decision Log\n\n**Context:** [brief context]\n\n### Decision\n\n### Reasoning\n- \n\n### Alternatives Considered\n- \n\n### Impact\n- `,
    isDefault: true,
  },
];

// Safe accessors that handle missing/null Firestore data
const emptyStructured: Structured = {
  title: '', overview: '', emoji: '', category: 'general',
  actionItems: [], events: [],
};

export function safeStructured(conv: Conversation): Structured {
  return conv.structured ?? emptyStructured;
}

export function safeSegments(conv: Conversation): TranscriptSegment[] {
  return Array.isArray(conv.transcriptSegments) ? conv.transcriptSegments : [];
}

export function displayTitle(conv: Conversation): string {
  const s = safeStructured(conv);
  if (s.title) return s.title;
  const segs = safeSegments(conv);
  if (segs.length > 0) {
    const preview = segs[0].text;
    return preview.length > 50 ? preview.substring(0, 50) + '...' : preview;
  }
  return 'Untitled Conversation';
}

export function formatTimestamp(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function segmentsAsString(segments: TranscriptSegment[]): string {
  return segments.map(s => `${s.speaker}: ${s.text}`).join('\n');
}

export function conversationDuration(conv: Conversation): string | null {
  if (!conv.startedAt || !conv.finishedAt) return null;
  const diff = new Date(conv.finishedAt).getTime() - new Date(conv.startedAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '<1 min';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}
