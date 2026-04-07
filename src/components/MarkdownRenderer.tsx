// Simple markdown renderer for AI-enhanced notes
// Handles: headings, bold, bullets, blockquotes, checkboxes

export function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // Headings
        if (trimmed.startsWith('### '))
          return <h4 key={i} className="text-sm font-semibold text-gray-800 mt-3 mb-1">{renderInline(trimmed.slice(4))}</h4>;
        if (trimmed.startsWith('## '))
          return <h3 key={i} className="text-base font-semibold text-gray-900 mt-4 mb-1">{renderInline(trimmed.slice(3))}</h3>;
        if (trimmed.startsWith('# '))
          return <h2 key={i} className="text-lg font-bold text-gray-900 mt-4 mb-2">{renderInline(trimmed.slice(2))}</h2>;

        // Blockquote
        if (trimmed.startsWith('> '))
          return <blockquote key={i} className="border-l-2 border-gray-300 pl-3 text-sm text-gray-500 italic">{renderInline(trimmed.slice(2))}</blockquote>;

        // Checkbox
        if (trimmed.startsWith('- [x] '))
          return <div key={i} className="flex items-start gap-2 text-sm text-gray-400 line-through ml-4"><span>&#9745;</span><span>{renderInline(trimmed.slice(6))}</span></div>;
        if (trimmed.startsWith('- [ ] '))
          return <div key={i} className="flex items-start gap-2 text-sm text-gray-700 ml-4"><span>&#9744;</span><span>{renderInline(trimmed.slice(6))}</span></div>;

        // Bullet
        if (trimmed.startsWith('- '))
          return <div key={i} className="flex items-start gap-2 text-sm text-gray-700 ml-4"><span className="text-gray-400 mt-1.5 text-[6px]">&#9679;</span><span>{renderInline(trimmed.slice(2))}</span></div>;

        // Numbered
        const numMatch = trimmed.match(/^(\d+)\.\s/);
        if (numMatch)
          return <div key={i} className="flex items-start gap-2 text-sm text-gray-700 ml-4"><span className="text-gray-400 text-xs w-4 shrink-0">{numMatch[1]}.</span><span>{renderInline(trimmed.slice(numMatch[0].length))}</span></div>;

        // Paragraph
        return <p key={i} className="text-sm text-gray-700 leading-relaxed">{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Handle **bold** markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}
