export function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} style={{ height: 8 }} />;
        if (trimmed.startsWith('### '))
          return <h4 key={i} style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f', margin: '12px 0 4px' }}>{renderInline(trimmed.slice(4))}</h4>;
        if (trimmed.startsWith('## '))
          return <h3 key={i} style={{ fontSize: 17, fontWeight: 700, color: '#1d1d1f', margin: '16px 0 6px' }}>{renderInline(trimmed.slice(3))}</h3>;
        if (trimmed.startsWith('# '))
          return <h2 key={i} style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1f', margin: '16px 0 6px' }}>{renderInline(trimmed.slice(2))}</h2>;
        if (trimmed.startsWith('> '))
          return <blockquote key={i} style={{ borderLeft: '3px solid #d2d2d7', paddingLeft: 14, margin: '6px 0', color: '#86868b', fontSize: 14, lineHeight: 1.6 }}>{renderInline(trimmed.slice(2))}</blockquote>;
        if (trimmed.startsWith('- [x] '))
          return <div key={i} style={{ display: 'flex', gap: 8, marginLeft: 4, color: '#86868b', fontSize: 15, lineHeight: 1.6 }}><span style={{ color: '#34c759' }}>{'\u2713'}</span><span style={{ textDecoration: 'line-through' }}>{renderInline(trimmed.slice(6))}</span></div>;
        if (trimmed.startsWith('- [ ] '))
          return <div key={i} style={{ display: 'flex', gap: 8, marginLeft: 4, fontSize: 15, color: '#1d1d1f', lineHeight: 1.6 }}><span style={{ color: '#86868b' }}>{'\u25CB'}</span><span>{renderInline(trimmed.slice(6))}</span></div>;
        if (trimmed.startsWith('- '))
          return <div key={i} style={{ display: 'flex', gap: 8, marginLeft: 4, fontSize: 15, color: '#424245', lineHeight: 1.6 }}><span style={{ color: '#86868b' }}>&bull;</span><span>{renderInline(trimmed.slice(2))}</span></div>;
        return <p key={i} style={{ fontSize: 15, lineHeight: 1.7, color: '#424245', margin: 0 }}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ fontWeight: 600, color: '#1d1d1f' }}>{part.slice(2, -2)}</strong>;
    return <span key={i}>{part}</span>;
  });
}
