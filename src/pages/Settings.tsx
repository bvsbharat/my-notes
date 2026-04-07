import { Link } from 'react-router-dom';
import { VscArrowLeft } from 'react-icons/vsc';
import { useAuth } from '../hooks/useAuth';
import { useTemplates } from '../hooks/useTemplates';
import { useSettings } from '../hooks/useSettings';
import { TemplateManager } from '../components/TemplateManager';
import type { AIPreferences } from '../lib/types';

export function Settings() {
  const { user } = useAuth();
  const { templates, saveTemplate, deleteTemplate } = useTemplates(user?.uid);
  const { preferences, updatePreferences } = useSettings(user?.uid);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e8e8ed', display: 'flex', alignItems: 'center', padding: '0 20px', height: 52 }}>
        <Link to="/" style={{ color: '#0071e3', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
          <VscArrowLeft size={16} /> Back
        </Link>
        <span style={{ flex: 1 }} />
        <span style={{ fontWeight: 600, fontSize: 15, color: '#1d1d1f' }}>Settings</span>
        <span style={{ flex: 1 }} />
      </header>

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 80px' }}>
        <Section title="AI Preferences">
          <Label text="Style" />
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Toggle label="Concise" active={preferences.style === 'concise'} onClick={() => updatePreferences({ style: 'concise' })} />
            <Toggle label="Detailed" active={preferences.style === 'detailed'} onClick={() => updatePreferences({ style: 'detailed' })} />
          </div>
          <Label text="Tone" />
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Toggle label="Professional" active={preferences.tone === 'professional'} onClick={() => updatePreferences({ tone: 'professional' })} />
            <Toggle label="Casual" active={preferences.tone === 'casual'} onClick={() => updatePreferences({ tone: 'casual' })} />
          </div>
          <Check label="Include speaker quotes" checked={preferences.includeSpeakerQuotes} onChange={v => updatePreferences({ includeSpeakerQuotes: v })} />
          <Check label="Include timestamps" checked={preferences.includeTimestamps} onChange={v => updatePreferences({ includeTimestamps: v })} />
        </Section>

        <Section title="Note Templates">
          <TemplateManager templates={templates} onSave={saveTemplate} onDelete={deleteTemplate} />
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 16, border: '1px solid #e8e8ed' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>{title}</h3>
      {children}
    </div>
  );
}
function Label({ text }: { text: string }) {
  return <div style={{ fontSize: 13, color: '#86868b', marginBottom: 6, fontWeight: 500 }}>{text}</div>;
}
function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 18px', fontSize: 14, fontWeight: 500,
      background: active ? '#0071e3' : '#f0f0f2', color: active ? '#fff' : '#86868b',
      border: 'none', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
    }}>{label}</button>
  );
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10, fontSize: 14, color: '#1d1d1f' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: '#0071e3', width: 16, height: 16 }} />
      {label}
    </label>
  );
}
