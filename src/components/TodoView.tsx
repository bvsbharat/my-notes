import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink } from '@fortawesome/free-solid-svg-icons';

interface Task {
  id: string;
  description: string;
  completed: boolean;
  convId: string;
  convTitle: string;
  convEmoji: string;
  convDate: string;
}

const CARD_COLORS = [
  '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#f3e8ff',
  '#ffedd5', '#e0f2fe', '#fef9c3', '#d1fae5', '#fdf2f8',
];

interface Props {
  tasks: Task[];
  onSelectConversation: (id: string) => void;
  onToggleTask?: (convId: string, taskId: string, completed: boolean) => void;
  onDeleteTask?: (convId: string, taskId: string) => void;
}

export function TodoView({ tasks, onSelectConversation, onToggleTask, onDeleteTask }: Props) {
  const [filter, setFilter] = useState<'pending' | 'done' | 'all'>('pending');

  const filtered = tasks.filter(t => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  const pending = tasks.filter(t => !t.completed).length;
  const done = tasks.filter(t => t.completed).length;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 60px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 700, color: '#1d1d1f', letterSpacing: -0.5 }}>To-do</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#86868b' }}>
          {pending} pending &middot; {done} completed
        </p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {(['pending', 'done', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 16px', fontSize: 13, fontWeight: 500, border: 'none', borderRadius: 8, cursor: 'pointer',
            background: filter === f ? '#1d1d1f' : 'transparent', color: filter === f ? '#fff' : '#86868b',
          }}>
            {f === 'pending' ? `Pending (${pending})` : f === 'done' ? `Done (${done})` : `All (${tasks.length})`}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <AnimatePresence>
          {filtered.map((task, i) => {
            const bg = task.completed ? '#f5f5f7' : CARD_COLORS[i % CARD_COLORS.length];
            const dateStr = task.convDate
              ? new Date(task.convDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : '';

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  padding: 18, borderRadius: 14,
                  background: bg,
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 120, cursor: 'pointer',
                  position: 'relative',
                }}
                onClick={() => onToggleTask?.(task.convId, task.id, !task.completed)}
              >
                {/* Task text */}
                <div style={{
                  fontSize: 15, fontWeight: 600, lineHeight: 1.5,
                  color: task.completed ? '#aeaeb2' : '#1d1d1f',
                  textDecoration: task.completed ? 'line-through' : 'none',
                }}>
                  {task.description}
                </div>

                {/* Bottom: link icon + date */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectConversation(task.convId); }}
                    style={{
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 11, color: task.completed ? '#aeaeb2' : 'rgba(0,0,0,0.35)',
                    }}
                  >
                    <FontAwesomeIcon icon={faLink} style={{ fontSize: 10 }} />
                    <span style={{ textDecoration: 'underline' }}>open note</span>
                  </button>

                  <span style={{ fontSize: 11, color: task.completed ? '#aeaeb2' : 'rgba(0,0,0,0.3)', fontStyle: 'italic' }}>
                    {dateStr}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#aeaeb2', fontSize: 15 }}>
          {filter === 'pending' ? 'All caught up!' : filter === 'done' ? 'No completed tasks yet' : 'No tasks found'}
        </div>
      )}
    </div>
  );
}
