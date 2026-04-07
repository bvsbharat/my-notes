import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../hooks/useAuth';
import { useConversations } from '../hooks/useConversations';
import { useTemplates } from '../hooks/useTemplates';
import { useNotes } from '../hooks/useNotes';
import { useSettings } from '../hooks/useSettings';
import { ConversationPicker } from '../components/ConversationPicker';
import { NoteEditor } from '../components/NoteEditor';
import { NotePreview } from '../components/NotePreview';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { downloadText } from '../lib/actions';
import type { NoteTemplate, SmartNote } from '../lib/types';

export function SmartNotes() {
  const { user, logOut } = useAuth();
  const { conversations } = useConversations(user?.uid);
  const { templates } = useTemplates(user?.uid);
  const { notes, saveNote, deleteNote } = useNotes(user?.uid);
  const { preferences } = useSettings(user?.uid);

  const [conversationId, setConversationId] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [aiNotes, setAiNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [tab, setTab] = useState<'new' | 'saved'>('new');

  const handleSelectTemplate = (t: NoteTemplate) => {
    setUserNotes(t.content);
    setAiNotes('');
  };

  const handleTransform = async () => {
    if (!conversationId || !userNotes.trim()) return;
    setLoading(true);
    try {
      const functions = getFunctions();
      const transform = httpsCallable<
        { conversationId: string; userNotes: string; preferences: typeof preferences },
        { enhancedNotes: string }
      >(functions, 'transformNotes');

      const result = await transform({ conversationId, userNotes, preferences });
      setAiNotes(result.data.enhancedNotes);

      // Auto-save
      const id = await saveNote({
        id: activeNoteId ?? undefined,
        conversationId,
        userNotes,
        aiNotes: result.data.enhancedNotes,
      });
      if (id) setActiveNoteId(id);
    } catch (err) {
      alert('Transform failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setUserNotes(aiNotes);
    setAiNotes('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(aiNotes);
  };

  const handleExport = () => {
    downloadText('smart-notes.md', aiNotes);
  };

  const handleLoadSavedNote = (note: SmartNote) => {
    setConversationId(note.conversationId);
    setUserNotes(note.userNotes);
    setAiNotes(note.aiNotes);
    setActiveNoteId(note.id);
    setTab('new');
  };

  const handleNewNote = () => {
    setConversationId('');
    setUserNotes('');
    setAiNotes('');
    setActiveNoteId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-bold text-gray-900">SuperNotes</Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link to="/" className="text-gray-400 hover:text-gray-600">Conversations</Link>
              <span className="text-gray-900 font-medium">Smart Notes</span>
              <Link to="/settings" className="text-gray-400 hover:text-gray-600">Settings</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.displayName}</span>
            <button onClick={() => logOut()} className="text-sm text-gray-400 hover:text-gray-600">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setTab('new')}
            className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
              tab === 'new' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {activeNoteId ? 'Editor' : 'New Note'}
          </button>
          <button
            onClick={() => setTab('saved')}
            className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
              tab === 'saved' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            Saved Notes ({notes.length})
          </button>
          {tab === 'new' && (
            <button onClick={handleNewNote} className="text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 ml-auto">
              + New
            </button>
          )}
        </div>

        {tab === 'new' && (
          <div className="space-y-4">
            <ConversationPicker
              conversations={conversations}
              selected={conversationId}
              onChange={setConversationId}
            />

            {aiNotes ? (
              <NotePreview
                aiNotes={aiNotes}
                onEdit={handleEdit}
                onRegenerate={handleTransform}
                onCopy={handleCopy}
                onExport={handleExport}
                loading={loading}
              />
            ) : (
              <>
                <NoteEditor
                  value={userNotes}
                  onChange={setUserNotes}
                  templates={templates}
                  onSelectTemplate={handleSelectTemplate}
                />
                <button
                  onClick={handleTransform}
                  disabled={loading || !userNotes.trim() || !conversationId}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <><span className="animate-spin">&#9881;</span> Transforming...</>
                  ) : (
                    <><span>&#10024;</span> AI Transform</>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {tab === 'saved' && (
          <div className="space-y-3">
            {notes.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No saved notes yet. Create one from the editor tab.
              </div>
            )}
            {notes.map(note => (
              <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {note.aiNotes.split('\n')[0]?.replace(/^#+\s*/, '').slice(0, 60) || 'Untitled Note'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(note.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadSavedNote(note)}
                      className="text-xs px-2.5 py-1 rounded border border-gray-200 text-gray-600 hover:border-gray-400"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-xs px-2.5 py-1 rounded border border-red-200 text-red-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 line-clamp-3">
                  <MarkdownRenderer text={note.aiNotes.split('\n').slice(0, 5).join('\n')} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
