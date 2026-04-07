import type { TranscriptSegment } from '../lib/types';
import { formatTimestamp } from '../lib/types';

const speakerColors = [
  'bg-blue-50 border-blue-200',
  'bg-green-50 border-green-200',
  'bg-purple-50 border-purple-200',
  'bg-orange-50 border-orange-200',
  'bg-pink-50 border-pink-200',
  'bg-teal-50 border-teal-200',
];

const speakerTextColors = [
  'text-blue-700',
  'text-green-700',
  'text-purple-700',
  'text-orange-700',
  'text-pink-700',
  'text-teal-700',
];

export function TranscriptViewer({ segments }: { segments: TranscriptSegment[] }) {
  if (segments.length === 0) {
    return <p className="text-gray-400 italic">No transcript segments</p>;
  }

  // Build speaker color map
  const speakerMap = new Map<number, number>();
  let colorIdx = 0;
  for (const seg of segments) {
    if (!speakerMap.has(seg.speakerId)) {
      speakerMap.set(seg.speakerId, colorIdx % speakerColors.length);
      colorIdx++;
    }
  }

  return (
    <div className="space-y-2">
      {segments.map((seg) => {
        const ci = speakerMap.get(seg.speakerId) ?? 0;
        return (
          <div
            key={seg.id}
            className={`rounded-lg border p-3 ${speakerColors[ci]}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold ${speakerTextColors[ci]}`}>
                {seg.isUser ? 'You' : seg.speaker}
              </span>
              <span className="text-xs text-gray-400">
                {formatTimestamp(seg.start)} - {formatTimestamp(seg.end)}
              </span>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">{seg.text}</p>
          </div>
        );
      })}
    </div>
  );
}
