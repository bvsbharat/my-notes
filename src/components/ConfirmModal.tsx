import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ open, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'default', onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            className="fixed inset-0 z-[200]"
            style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.25)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.25, type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed inset-0 z-[201] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white/90 backdrop-blur-2xl rounded-2xl p-6 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.15)] border border-gray-200/50 max-w-sm w-full mx-4 pointer-events-auto">
              <h3 className="text-base font-bold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
              <div className="flex gap-2.5 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCancel}
                  className="px-4 py-2 bg-gray-100 text-gray-600 border-none rounded-xl text-sm font-semibold cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  {cancelText}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  className={`px-4 py-2 border-none rounded-xl text-sm font-semibold cursor-pointer transition-colors ${
                    variant === 'danger'
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {confirmText}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook for easy confirm modal usage
import { useState, useCallback } from 'react';

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  variant: 'danger' | 'default';
  resolve: ((value: boolean) => void) | null;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    open: false, title: '', message: '', confirmText: 'Confirm', variant: 'default', resolve: null,
  });

  const confirm = useCallback(({ title, message, confirmText = 'Confirm', variant = 'default' as const }: {
    title: string; message: string; confirmText?: string; variant?: 'danger' | 'default';
  }): Promise<boolean> => {
    return new Promise(resolve => {
      setState({ open: true, title, message, confirmText, variant, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState(s => ({ ...s, open: false, resolve: null }));
  }, [state]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState(s => ({ ...s, open: false, resolve: null }));
  }, [state]);

  const modal = (
    <ConfirmModal
      open={state.open}
      title={state.title}
      message={state.message}
      confirmText={state.confirmText}
      variant={state.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, modal };
}
