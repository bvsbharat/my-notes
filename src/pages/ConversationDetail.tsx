import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../hooks/useAuth';
import { useConversation } from '../hooks/useConversation';
import { useTemplates } from '../hooks/useTemplates';
import { useNotes } from '../hooks/useNotes';
import { useSettings } from '../hooks/useSettings';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { InsightsPanel } from '../components/InsightsPanel';
import { NoteEditor } from '../components/NoteEditor';
import { NotePreview } from '../components/NotePreview';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { displayTitle, conversationDuration, safeStructured, safeSegments } from '../lib/types';
import { toggleStar, softDelete, exportAsText, downloadText, reprocessConversation } from '../lib/actions';

type Tab = 'overview' | 'transcript' | 'smartnotes';

export function ConversationDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { conversation, loading, error } = useConversation(user?.uid, id);
  const { templates } = useTemplates(user?.uid);
  const { notes, saveNote } = useNotes(user?.uid);
  const { preferences } = useSettings(user?.uid);
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('overview');
  const [reprocessing, setReprocessing] = useState(false);

  // Smart notes state
  const [userNotes, setUserNotes] = useState('');
  const [aiNotes, setAiNotes] = useState('');
  const [transforming, setTransforming] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">{error ? `Error: ${error}` : 'Conversation not found'}</div>
      </div>
    );
  }

  const structured = safeStructured(conversation);
  const segments = safeSegments(conversation);
  const duration = conversationDuration(conversation);
  const date = new Date(conversation.createdAt).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const isFailed = conversation.status === 'failed';
  const isProcessing = conversation.status === 'processing' || reprocessing;

  // Existing saved note for this conversation
  const savedNote = notes.find(n => n.conversationId === conversation.id);
  if (savedNote && !activeNoteId && !aiNotes && !userNotes) {
    // Load saved note on mount
    setTimeout(() => {
      setUserNotes(savedNote.userNotes);
      setAiNotes(savedNote.aiNotes);
      setActiveNoteId(savedNote.id);
    }, 0);
  }

  const handleStar = () => {
    if (user) toggleStar(user.uid, conversation.id, conversation.starred);
  };

  const handleDelete = () => {
    if (!user) return;
    if (confirm('Delete this conversation?')) {
      softDelete(user.uid, conversation.id);
      navigate('/');
    }
  };

  const handleExport = () => {
    const text = exportAsText(conversation);
    const title = displayTitle(conversation).replace(/[^a-zA-Z0-9]/g, '_');
    downloadText(`${title}.md`, text);
  };

  const handleReprocess = async () => {
    setReprocessing(true);
    try { await reprocessConversation(conversation.id); }
    catch (err) { alert('Failed: ' + (err instanceof Error ? err.message : 'Unknown')); }
    finally { setReprocessing(false); }
  };

  const handleTransform = async () => {
    if (!userNotes.trim()) return;
    setTransforming(true);
    try {
      const functions = getFunctions();
      const transform = httpsCallable<
        { conversationId: string; userNotes: string; preferences: typeof preferences },
        { enhancedNotes: string }
      >(functions, 'transformNotes');
      const result = await transform({ conversationId: conversation.id, userNotes, preferences });
      setAiNotes(result.data.enhancedNotes);

      const noteId = await saveNote({
        id: activeNoteId ?? undefined,
        conversationId: conversation.id,
        userNotes,
        aiNotes: result.data.enhancedNotes,
      });
      if (noteId) setActiveNoteId(noteId);
    } catch (err) {
      alert('Transform failed: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setTransforming(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'transcript', label: `Transcript (${segments.length})` },
    { key: 'smartnotes', label: 'Smart Notes' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with title & summary */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          {/* Top bar */}
          <div className="flex items-center justify-between py-3">
            <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">&larr; Back</Link>
            <div className="flex items-center gap-2">
              <button onClick={handleStar} className={`text-sm px-2.5 py-1 rounded-lg border transition-colors ${conversation.starred ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'text-gray-400 border-gray-200 hover:border-gray-400'}`}>
                {conversation.starred ? '\u2605' : '\u2606'}
              </button>
              <button onClick={handleExport} className="text-sm px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400">Export</button>
              <button onClick={handleReprocess} disabled={isProcessing} className="text-sm px-2.5 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50">
                {isProcessing ? '...' : 'Re-generate'}
              </button>
              <button onClick={handleDelete} className="text-sm px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">Delete</button>
            </div>
          </div>

          {/* Title & meta */}
          <div className="pb-3">
            <div className="flex items-center gap-2 mb-1">
              {structured.emoji && <span className="text-2xl">{structured.emoji}</span>}
              <h1 className="text-xl font-bold text-gray-900">{displayTitle(conversation)}</h1>
            </div>
            {structured.overview && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-2">{structured.overview}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{date}</span>
              {duration && <span>{duration}</span>}
              <span className="capitalize">{conversation.status}</span>
              {structured.category && structured.category !== 'general' && (
                <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{structured.category}</span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b-0">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {isFailed && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 flex items-center justify-between">
            <span>AI processing failed. The transcript is still available.</span>
            <button onClick={handleReprocess} disabled={isProcessing} className="ml-4 px-3 py-1 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 disabled:opacity-50">
              {isProcessing ? 'Processing...' : 'Retry'}
            </button>
          </div>
        )}

        {isProcessing && !isFailed && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-600 flex items-center gap-2">
            <span className="animate-spin">&#9881;</span>
            <span>AI is processing this conversation...</span>
          </div>
        )}

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {structured.overview || structured.actionItems.length > 0 || structured.events.length > 0 ? (
              <InsightsPanel structured={structured} />
            ) : (
              <p className="text-gray-400 italic text-sm">No AI insights yet. Click "Re-generate" to process this conversation.</p>
            )}
          </div>
        )}

        {/* Transcript Tab */}
        {tab === 'transcript' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Transcript</h2>
              <button
                onClick={() => {
                  const text = segments.map(s => `${s.speaker}: ${s.text}`).join('\n');
                  navigator.clipboard.writeText(text);
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400"
              >
                Copy All
              </button>
            </div>
            <TranscriptViewer segments={segments} />
          </div>
        )}

        {/* Smart Notes Tab */}
        {tab === 'smartnotes' && (
          <div className="space-y-4">
            {aiNotes ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <NotePreview
                  aiNotes={aiNotes}
                  onEdit={() => { setUserNotes(aiNotes); setAiNotes(''); }}
                  onRegenerate={handleTransform}
                  onCopy={() => navigator.clipboard.writeText(aiNotes)}
                  onExport={() => downloadText('smart-notes.md', aiNotes)}
                  loading={transforming}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <NoteEditor
                  value={userNotes}
                  onChange={setUserNotes}
                  templates={templates}
                  onSelectTemplate={(t) => { setUserNotes(t.content); setAiNotes(''); }}
                />
                <div className="mt-4">
                  <button
                    onClick={handleTransform}
                    disabled={transforming || !userNotes.trim()}
                    className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {transforming ? (
                      <><span className="animate-spin">&#9881;</span> Transforming...</>
                    ) : (
                      <><span>&#10024;</span> AI Transform</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
