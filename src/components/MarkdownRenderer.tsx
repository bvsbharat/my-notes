export function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} style={{ height: 6 }} />;

        if (trimmed.startsWith('### '))
          return <h4 key={i} style={{ fontSize: 13, fontWeight: 600, color: 'var(--cyan)', margin: '8px 0 2px', fontFamily: 'var(--font-mono)' }}>{renderInline(trimmed.slice(4))}</h4>;
        if (trimmed.startsWith('## '))
          return <h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', margin: '10px 0 4px', fontFamily: 'var(--font-mono)' }}>{renderInline(trimmed.slice(3))}</h3>;
        if (trimmed.startsWith('# '))
          return <h2 key={i} style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', margin: '10px 0 4px', fontFamily: 'var(--font-mono)' }}>{renderInline(trimmed.slice(2))}</h2>;

        if (trimmed.startsWith('> '))
          return <blockquote key={i} style={{ borderLeft: '2px solid var(--fg-muted)', paddingLeft: 10, margin: '4px 0', color: 'var(--fg-muted)', fontSize: 13, fontStyle: 'italic' }}>{renderInline(trimmed.slice(2))}</blockquote>;

        if (trimmed.startsWith('- [x] '))
          return <div key={i} style={{ display: 'flex', gap: 6, marginLeft: 8, color: 'var(--fg-muted)', fontSize: 13 }}><span style={{ color: 'var(--green)' }}>{'\u2713'}</span><span style={{ textDecoration: 'line-through' }}>{renderInline(trimmed.slice(6))}</span></div>;
        if (trimmed.startsWith('- [ ] '))
          return <div key={i} style={{ display: 'flex', gap: 6, marginLeft: 8, fontSize: 13, color: 'var(--fg)' }}><span style={{ color: 'var(--fg-muted)' }}>{'\u25CB'}</span><span>{renderInline(trimmed.slice(6))}</span></div>;

        if (trimmed.startsWith('- '))
          return <div key={i} style={{ display: 'flex', gap: 6, marginLeft: 8, fontSize: 13, color: 'var(--fg)' }}><span style={{ color: 'var(--accent)' }}>{'\u2022'}</span><span>{renderInline(trimmed.slice(2))}</span></div>;

        return <p key={i} style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--fg)', margin: 0 }}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ fontWeight: 600, color: 'var(--fg)' }}>{part.slice(2, -2)}</strong>;
    return <span key={i}>{part}</span>;
  });
}
