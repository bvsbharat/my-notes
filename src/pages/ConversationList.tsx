import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useConversations } from '../hooks/useConversations';
import { SearchBar } from '../components/SearchBar';
import { displayTitle, safeStructured, safeSegments, conversationDuration } from '../lib/types';
import { toggleStar, softDelete } from '../lib/actions';

export function ConversationList() {
  const { user, logOut } = useAuth();
  const { conversations, loading, error } = useConversations(user?.uid);
  const [search, setSearch] = useState('');

  const activeConversation = useMemo(
    () => conversations.find(c => c.status === 'inProgress' && !c.deleted),
    [conversations]
  );

  const notes = useMemo(() => {
    let list = conversations.filter(c => !c.deleted);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => {
        const s = safeStructured(c);
        const segs = safeSegments(c);
        return (
          displayTitle(c).toLowerCase().includes(q) ||
          (s.overview || '').toLowerCase().includes(q) ||
          segs.some(seg => seg.text.toLowerCase().includes(q))
        );
      });
    }
    return list;
  }, [conversations, search]);

  const handleStar = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    const conv = conversations.find(c => c.id === id);
    if (conv) toggleStar(user.uid, id, conv.starred);
  }, [user, conversations]);

  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    if (confirm('Delete this conversation?')) {
      softDelete(user.uid, id);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold text-gray-900">SuperNotes</h1>
            <nav className="flex items-center gap-4 text-sm">
              <span className="text-gray-900 font-medium">Notes</span>
              <Link to="/settings" className="text-gray-400 hover:text-gray-600">Settings</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.displayName}</span>
            <button onClick={() => logOut()} className="text-sm text-gray-400 hover:text-gray-600">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-0 pb-6">
        {/* Gradient Hero - Active Transcript or Placeholder */}
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 my-4 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
          <div className="relative z-10">
            {activeConversation ? (
              <Link to={`/conversation/${activeConversation.id}`} className="block">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Live Transcript</span>
                </div>
                <h2 className="text-xl font-bold mb-1">{displayTitle(activeConversation)}</h2>
                <p className="text-sm text-white/70">
                  {safeSegments(activeConversation).length} segments captured
                  {conversationDuration(activeConversation) && ` \u00b7 ${conversationDuration(activeConversation)}`}
                </p>
                <div className="mt-3 text-xs text-white/60">
                  Tap to view live transcript &rarr;
                </div>
              </Link>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-white/30" />
                  <span className="text-xs font-medium text-white/60 uppercase tracking-wider">No Active Transcript</span>
                </div>
                <h2 className="text-xl font-bold mb-1">Start a Conversation</h2>
                <p className="text-sm text-white/70">
                  Open the SuperNotes mobile app to begin recording and transcribing.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-2xl">&#127908;</span>
                  <span className="text-sm text-white/50">Waiting for transcript...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Search notes..." />
        </div>

        {/* Notes List */}
        {loading && (
          <div className="text-center py-12 text-gray-400">Loading notes...</div>
        )}

        {error && (
          <div className="text-center py-12 text-red-500">Error: {error}</div>
        )}

        {!loading && !error && notes.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {search ? 'No notes match your search' : 'No notes yet. Start a conversation to create your first note.'}
          </div>
        )}

        <div className="space-y-2">
          {notes.map(conv => {
            const structured = safeStructured(conv);
            const segments = safeSegments(conv);
            const duration = conversationDuration(conv);
            const date = new Date(conv.createdAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric',
            });
            const time = new Date(conv.createdAt).toLocaleTimeString('en-US', {
              hour: '2-digit', minute: '2-digit',
            });

            return (
              <Link
                key={conv.id}
                to={`/conversation/${conv.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {structured.emoji && <span className="text-base">{structured.emoji}</span>}
                      <h3 className="font-semibold text-gray-900 truncate text-sm">
                        {displayTitle(conv)}
                      </h3>
                      {conv.starred && <span className="text-yellow-500 text-xs">&#9733;</span>}
                    </div>

                    {structured.overview && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">
                        {structured.overview}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                      <span>{date} {time}</span>
                      {duration && <><span>&middot;</span><span>{duration}</span></>}
                      <span>&middot;</span>
                      <span>{segments.length} segments</span>
                      {structured.actionItems.length > 0 && (
                        <><span>&middot;</span><span>{structured.actionItems.filter(a => !a.completed).length} tasks</span></>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleStar(e, conv.id)}
                      className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${conv.starred ? 'text-yellow-500' : 'text-gray-300'}`}
                    >
                      <span className="text-sm">{conv.starred ? '\u2605' : '\u2606'}</span>
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors"
                    >
                      <span className="text-sm">&times;</span>
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
