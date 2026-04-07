import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComments, faBrain, faUser, faGraduationCap, faCalendarCheck,
  faLightbulb, faMicrophone, faFileLines, faListCheck, faHandshake,
  faBullseye, faChartLine, faCode, faPuzzlePiece,
} from '@fortawesome/free-solid-svg-icons';

const CATEGORY_ICONS: Record<string, { icon: typeof faComments; color: string }> = {
  meeting: { icon: faHandshake, color: '#0071e3' },
  brainstorm: { icon: faLightbulb, color: '#ff9500' },
  personal: { icon: faUser, color: '#af52de' },
  learning: { icon: faGraduationCap, color: '#34c759' },
  planning: { icon: faCalendarCheck, color: '#ff2d55' },
  general: { icon: faComments, color: '#5ac8fa' },
};

const EMOJI_ICONS: Record<string, { icon: typeof faComments; color: string }> = {
  '\uD83D\uDCDD': { icon: faFileLines, color: '#0071e3' },    // 📝
  '\uD83D\uDCA1': { icon: faLightbulb, color: '#ff9500' },    // 💡
  '\uD83C\uDFAF': { icon: faBullseye, color: '#ff2d55' },     // 🎯
  '\uD83D\uDCCA': { icon: faChartLine, color: '#34c759' },    // 📊
  '\uD83E\uDD1D': { icon: faHandshake, color: '#0071e3' },    // 🤝
  '\uD83D\uDCBB': { icon: faCode, color: '#5856d6' },         // 💻
  '\uD83E\uDDE9': { icon: faPuzzlePiece, color: '#ff9500' },  // 🧩
  '\u2705': { icon: faListCheck, color: '#34c759' },           // ✅
  '\uD83C\uDF99\uFE0F': { icon: faMicrophone, color: '#ff2d55' }, // 🎙️
  '\uD83E\uDDE0': { icon: faBrain, color: '#af52de' },        // 🧠
};

export function NoteIcon({ emoji, category, size = 20 }: { emoji?: string; category?: string; size?: number }) {
  // Try emoji match first
  if (emoji && EMOJI_ICONS[emoji]) {
    const { icon, color } = EMOJI_ICONS[emoji];
    return <FontAwesomeIcon icon={icon} style={{ color, fontSize: size }} />;
  }

  // Fall back to category
  if (category && CATEGORY_ICONS[category]) {
    const { icon, color } = CATEGORY_ICONS[category];
    return <FontAwesomeIcon icon={icon} style={{ color, fontSize: size }} />;
  }

  // Default
  return <FontAwesomeIcon icon={faComments} style={{ color: '#5ac8fa', fontSize: size }} />;
}
