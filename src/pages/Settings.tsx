import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { VscArrowLeft, VscColorMode } from 'react-icons/vsc';
import { useAuth } from '../hooks/useAuth';
import { useTemplates } from '../hooks/useTemplates';
import { useSettings } from '../hooks/useSettings';
import { TemplateManager } from '../components/TemplateManager';
import type { AIPreferences } from '../lib/types';

interface Props {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export function Settings({ theme, toggleTheme }: Props) {
  const { user } = useAuth();
  const { templates, saveTemplate, deleteTemplate } = useTemplates(user?.uid);
  const { preferences, updatePreferences } = useSettings(user?.uid);

  const toggle = (key: keyof AIPreferences, a: string, b: string) => {
    updatePreferences({ [key]: preferences[key] === a ? b : a } as any);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/" style={{ color: 'var(--fg-muted)', display: 'flex' }}><VscArrowLeft size={18} /></Link>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>settings</span>
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 80px' }}>
        {/* Theme */}
        <Section title="// theme">
          <div style={{ display: 'flex', gap: 8 }}>
            <ToggleBtn label="dark" active={theme === 'dark'} onClick={() => theme !== 'dark' && toggleTheme()} />
            <ToggleBtn label="light" active={theme === 'light'} onClick={() => theme !== 'light' && toggleTheme()} />
          </div>
        </Section>

        {/* AI prefs */}
        <Section title="// ai preferences">
          <Label text="style" />
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <ToggleBtn label="concise" active={preferences.style === 'concise'} onClick={() => updatePreferences({ style: 'concise' })} />
            <ToggleBtn label="detailed" active={preferences.style === 'detailed'} onClick={() => updatePreferences({ style: 'detailed' })} />
          </div>

          <Label text="tone" />
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <ToggleBtn label="professional" active={preferences.tone === 'professional'} onClick={() => updatePreferences({ tone: 'professional' })} />
            <ToggleBtn label="casual" active={preferences.tone === 'casual'} onClick={() => updatePreferences({ tone: 'casual' })} />
          </div>

          <CheckRow label="include speaker quotes" checked={preferences.includeSpeakerQuotes} onChange={v => updatePreferences({ includeSpeakerQuotes: v })} />
          <CheckRow label="include timestamps" checked={preferences.includeTimestamps} onChange={v => updatePreferences({ includeTimestamps: v })} />
        </Section>

        {/* Templates */}
        <Section title="// templates">
          <TemplateManager templates={templates} onSave={saveTemplate} onDelete={deleteTemplate} />
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function Label({ text }: { text: string }) {
  return <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)', marginBottom: 6 }}>{text}</div>;
}

function ToggleBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        padding: '6px 14px', fontSize: 12, fontFamily: 'var(--font-mono)',
        background: active ? 'var(--accent)' : 'var(--bg-surface)',
        color: active ? 'var(--bg)' : 'var(--fg-muted)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 6, cursor: 'pointer',
      }}
    >
      {label}
    </motion.button>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 8, fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
      {label}
    </label>
  );
}
