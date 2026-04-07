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
  'bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-red-100',
  'bg-purple-100', 'bg-green-100', 'bg-blue-100', 'bg-yellow-100',
  'bg-red-100', 'bg-green-100', 'bg-purple-100', 'bg-blue-100',
];

interface Props {
  tasks: Task[];
  onSelectConversation: (id: string) => void;
  onToggleTask?: (convId: string, taskId: string, completed: boolean) => void;
  onDeleteTask?: (convId: string, taskId: string) => void;
}

export function TodoView({ tasks, onSelectConversation, onToggleTask }: Props) {
  const [filter, setFilter] = useState<'pending' | 'done' | 'all'>('pending');

  const filtered = tasks.filter(t => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  const pending = tasks.filter(t => !t.completed).length;
  const done = tasks.filter(t => t.completed).length;

  return (
    <div className="flex items-start justify-center p-8">
      <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] w-full max-w-[1200px] p-10 lg:p-14">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">To-do</h2>
          <p className="text-sm text-gray-400">{pending} pending &middot; {done} completed</p>
        </div>

        <div className="flex gap-2 mb-8">
          {(['pending', 'done', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs font-semibold border-none rounded-lg cursor-pointer transition-all ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'bg-transparent text-gray-400 hover:text-gray-600'
              }`}>
              {f === 'pending' ? `Pending (${pending})` : f === 'done' ? `Done (${done})` : `All (${tasks.length})`}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((task, i) => {
              const color = task.completed ? 'bg-gray-100' : CARD_COLORS[i % CARD_COLORS.length];
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
                  onClick={() => onToggleTask?.(task.convId, task.id, !task.completed)}
                  className={`${color} p-5 rounded-2xl flex flex-col justify-between cursor-pointer`}
                  style={{ aspectRatio: '1' }}
                >
                  <p className={`text-[15px] font-medium leading-snug ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {task.description}
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectConversation(task.convId); }}
                      className="bg-transparent border-none p-0 cursor-pointer flex items-center gap-1.5 text-[11px] text-black/30 hover:text-black/50 transition-colors"
                    >
                      <FontAwesomeIcon icon={faLink} className="text-[10px]" />
                      <span className="underline">open note</span>
                    </button>
                    <span className="text-[11px] text-black/25 italic">{dateStr}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <p className="text-center py-12 text-gray-300 text-sm">
            {filter === 'pending' ? 'All caught up!' : filter === 'done' ? 'No completed tasks yet' : 'No tasks found'}
          </p>
        )}
      </div>
    </div>
  );
}
