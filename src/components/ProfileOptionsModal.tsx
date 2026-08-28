import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, UserCheck, UserX, AlertCircle } from 'lucide-react';

interface ProfileOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProfileUsername: string;
  isBlocked: boolean;
  onToggleBlock: (username: string) => void;
  onReport: (username: string) => void;
  onShare: () => void;
}

export const ProfileOptionsModal: React.FC<ProfileOptionsModalProps> = ({
  isOpen,
  onClose,
  selectedProfileUsername,
  isBlocked,
  onToggleBlock,
  onReport,
  onShare,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xl z-10 space-y-3"
          >
            <div className="flex items-center justify-between pb-1 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Contact Options</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => {
                  onClose();
                  onShare();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors"
              >
                <Share2 className="h-4 w-4 text-neutral-500" />
                <span>Share Contact Profile</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onToggleBlock(selectedProfileUsername);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors"
              >
                {isBlocked ? (
                  <UserCheck className="h-4 w-4 text-emerald-500" />
                ) : (
                  <UserX className="h-4 w-4 text-neutral-500" />
                )}
                <span>{isBlocked ? 'Unblock User' : 'Block Contact'}</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onReport(selectedProfileUsername);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors"
              >
                <AlertCircle className="h-4 w-4 text-rose-500" />
                <span>Report Account</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
