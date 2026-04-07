import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTemplates } from '../hooks/useTemplates';
import { useSettings } from '../hooks/useSettings';
import { TemplateManager } from '../components/TemplateManager';
import type { AIPreferences } from '../lib/types';

export function Settings() {
  const { user, logOut } = useAuth();
  const { templates, saveTemplate, deleteTemplate } = useTemplates(user?.uid);
  const { preferences, updatePreferences } = useSettings(user?.uid);

  const handlePrefChange = <K extends keyof AIPreferences>(key: K, value: AIPreferences[K]) => {
    updatePreferences({ [key]: value });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-bold text-gray-900">SuperNotes</Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link to="/" className="text-gray-400 hover:text-gray-600">Conversations</Link>
              <Link to="/notes" className="text-gray-400 hover:text-gray-600">Smart Notes</Link>
              <span className="text-gray-900 font-medium">Settings</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.displayName}</span>
            <button onClick={() => logOut()} className="text-sm text-gray-400 hover:text-gray-600">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* AI Preferences */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">AI Enhancement Preferences</h2>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Output Style</label>
              <div className="flex gap-3">
                {(['concise', 'detailed'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => handlePrefChange('style', s)}
                    className={`text-sm px-4 py-2 rounded-lg border transition-colors capitalize ${
                      preferences.style === s
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {preferences.style === 'concise' ? 'Short, to-the-point outputs' : 'Thorough, context-rich outputs'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Tone</label>
              <div className="flex gap-3">
                {(['professional', 'casual'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => handlePrefChange('tone', t)}
                    className={`text-sm px-4 py-2 rounded-lg border transition-colors capitalize ${
                      preferences.tone === t
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.includeSpeakerQuotes}
                  onChange={(e) => handlePrefChange('includeSpeakerQuotes', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm text-gray-700">Include speaker quotes</span>
                  <p className="text-xs text-gray-400">Add relevant direct quotes from transcript speakers</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.includeTimestamps}
                  onChange={(e) => handlePrefChange('includeTimestamps', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm text-gray-700">Include timestamps</span>
                  <p className="text-xs text-gray-400">Add timestamps from the transcript alongside quotes</p>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* Templates */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <TemplateManager
            templates={templates}
            onSave={saveTemplate}
            onDelete={deleteTemplate}
          />
        </section>
      </main>
    </div>
  );
}
