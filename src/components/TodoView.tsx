import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Task {
  id: string;
  description: string;
  completed: boolean;
  convId: string;
  convTitle: string;
  convEmoji: string;
}

const TASK_COLORS = [
  { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  { bg: '#dcfce7', border: '#4ade80', text: '#166534' },
  { bg: '#dbeafe', border: '#60a5fa', text: '#1e40af' },
  { bg: '#fce7f3', border: '#f472b6', text: '#9d174d' },
  { bg: '#f3e8ff', border: '#c084fc', text: '#6b21a8' },
  { bg: '#ffedd5', border: '#fb923c', text: '#9a3412' },
];

interface Props {
  tasks: Task[];
  onSelectConversation: (id: string) => void;
}

export function TodoView({ tasks, onSelectConversation }: Props) {
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

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['pending', 'done', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 16px', fontSize: 13, fontWeight: 500, border: 'none', borderRadius: 8, cursor: 'pointer',
            background: filter === f ? '#1d1d1f' : '#f0f0f2', color: filter === f ? '#fff' : '#86868b',
            transition: 'all 0.15s',
          }}>
            {f === 'pending' ? `Pending (${pending})` : f === 'done' ? `Done (${done})` : `All (${tasks.length})`}
          </button>
        ))}
      </div>

      {/* Tasks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <AnimatePresence>
          {filtered.map((task, i) => {
            const c = TASK_COLORS[i % TASK_COLORS.length];
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '14px 16px', borderRadius: 12,
                  background: task.completed ? '#f9f9fb' : c.bg,
                  borderLeft: `4px solid ${task.completed ? '#d2d2d7' : c.border}`,
                }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
                  background: task.completed ? '#34c759' : '#fff',
                  border: task.completed ? 'none' : `2px solid ${c.border}`,
                  color: '#fff',
                }}>
                  {task.completed && '\u2713'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 500, lineHeight: 1.5,
                    color: task.completed ? '#aeaeb2' : c.text,
                    textDecoration: task.completed ? 'line-through' : 'none',
                  }}>
                    {task.description}
                  </div>
                  <button
                    onClick={() => onSelectConversation(task.convId)}
                    style={{
                      marginTop: 4, fontSize: 12, color: '#86868b', background: 'none',
                      border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    {task.convEmoji && <span>{task.convEmoji}</span>}
                    <span style={{ textDecoration: 'underline' }}>{task.convTitle}</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#aeaeb2', fontSize: 15 }}>
            {filter === 'pending' ? 'All caught up!' : filter === 'done' ? 'No completed tasks yet' : 'No tasks found'}
          </div>
        )}
      </div>
    </div>
  );
}
