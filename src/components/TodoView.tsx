import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VscTrash } from 'react-icons/vsc';

interface Task {
  id: string;
  description: string;
  completed: boolean;
  convId: string;
  convTitle: string;
  convEmoji: string;
}

const CARD_COLORS = [
  { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  { bg: '#dcfce7', border: '#4ade80', text: '#166534' },
  { bg: '#dbeafe', border: '#60a5fa', text: '#1e40af' },
  { bg: '#fce7f3', border: '#f472b6', text: '#9d174d' },
  { bg: '#f3e8ff', border: '#c084fc', text: '#6b21a8' },
  { bg: '#ffedd5', border: '#fb923c', text: '#9a3412' },
  { bg: '#e0f2fe', border: '#38bdf8', text: '#075985' },
  { bg: '#fef9c3', border: '#facc15', text: '#854d0e' },
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
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px 60px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 700, color: '#1d1d1f', letterSpacing: -0.5 }}>To-do</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#86868b' }}>
          {pending} pending &middot; {done} completed &middot; {tasks.length} total
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

      {/* Task cards - colored like reference image */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        <AnimatePresence>
          {filtered.map((task, i) => {
            const c = CARD_COLORS[i % CARD_COLORS.length];
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
                  background: task.completed ? '#f9f9fb' : c.bg,
                  display: 'flex', flexDirection: 'column', gap: 10,
                  minHeight: 100,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                  {/* Checkbox */}
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    onClick={() => onToggleTask?.(task.convId, task.id, !task.completed)}
                    style={{
                      width: 24, height: 24, borderRadius: 7, flexShrink: 0, marginTop: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      background: task.completed ? '#34c759' : 'rgba(255,255,255,0.7)',
                      border: task.completed ? 'none' : `2px solid ${c.border}`,
                      color: '#fff',
                    }}
                  >
                    {task.completed && '\u2713'}
                  </motion.button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 15, fontWeight: 600, lineHeight: 1.5,
                      color: task.completed ? '#aeaeb2' : '#1d1d1f',
                      textDecoration: task.completed ? 'line-through' : 'none',
                    }}>
                      {task.description}
                    </div>
                  </div>

                  {/* Delete button */}
                  {onDeleteTask && (
                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.8 }}
                      onClick={() => onDeleteTask(task.convId, task.id)}
                      style={{ background: 'none', border: 'none', color: task.completed ? '#aeaeb2' : '#86868b', cursor: 'pointer', padding: 2 }}
                    >
                      <VscTrash size={14} />
                    </motion.button>
                  )}
                </div>

                {/* Source note */}
                <button
                  onClick={() => onSelectConversation(task.convId)}
                  style={{
                    fontSize: 11, color: task.completed ? '#aeaeb2' : '#86868b',
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4, textAlign: 'left',
                  }}
                >
                  {task.convEmoji && <span>{task.convEmoji}</span>}
                  <span style={{ textDecoration: 'underline' }}>{task.convTitle}</span>
                </button>
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
