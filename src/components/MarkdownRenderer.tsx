const HIGHLIGHT_COLORS = [
  '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#ddd6fe', '#fed7aa', '#a5f3fc', '#fde68a',
];
let highlightIdx = 0;

export function MarkdownRenderer({ text }: { text: string }) {
  highlightIdx = 0;
  const lines = text.split('\n');
  return (
    <div>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} style={{ height: 10 }} />;
        if (trimmed.startsWith('### '))
          return <h4 key={i} style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f', margin: '16px 0 6px' }}>{renderInline(trimmed.slice(4))}</h4>;
        if (trimmed.startsWith('## '))
          return <h3 key={i} style={{ fontSize: 17, fontWeight: 700, color: '#1d1d1f', margin: '20px 0 8px' }}>{renderInline(trimmed.slice(3))}</h3>;
        if (trimmed.startsWith('# '))
          return <h2 key={i} style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1f', margin: '20px 0 8px' }}>{renderInline(trimmed.slice(2))}</h2>;
        if (trimmed.startsWith('> '))
          return <blockquote key={i} style={{ borderLeft: '3px solid #d2d2d7', paddingLeft: 14, margin: '8px 0', color: '#86868b', fontSize: 15, lineHeight: 1.7 }}>{renderInline(trimmed.slice(2))}</blockquote>;
        if (trimmed.startsWith('- [x] '))
          return <div key={i} style={{ display: 'flex', gap: 8, margin: '4px 0', fontSize: 15, color: '#86868b', lineHeight: 1.6 }}><span style={{ color: '#34c759' }}>{'\u2713'}</span><span style={{ textDecoration: 'line-through' }}>{renderInline(trimmed.slice(6))}</span></div>;
        if (trimmed.startsWith('- [ ] '))
          return <div key={i} style={{ display: 'flex', gap: 8, margin: '4px 0', fontSize: 15, color: '#1d1d1f', lineHeight: 1.6 }}><span style={{ color: '#aeaeb2' }}>{'\u25CB'}</span><span>{renderInline(trimmed.slice(6))}</span></div>;
        if (trimmed.startsWith('- '))
          return <div key={i} style={{ display: 'flex', gap: 8, margin: '3px 0', fontSize: 15, color: '#424245', lineHeight: 1.6 }}><span style={{ color: '#aeaeb2' }}>&bull;</span><span>{renderInline(trimmed.slice(2))}</span></div>;
        return <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: '#424245', margin: '4px 0' }}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Split on ==highlight== and **bold** markers
  const parts = text.split(/(==.+?==|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('==') && part.endsWith('==')) {
      const color = HIGHLIGHT_COLORS[highlightIdx % HIGHLIGHT_COLORS.length];
      highlightIdx++;
      return <mark key={i} style={{ background: color, padding: '1px 4px', borderRadius: 3, color: '#1d1d1f', fontWeight: 500 }}>{part.slice(2, -2)}</mark>;
    }
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ fontWeight: 600, color: '#1d1d1f' }}>{part.slice(2, -2)}</strong>;
    return <span key={i}>{part}</span>;
  });
}
