import React from 'react';
import { Bell, X, UserCheck, UserPlus, Check, CheckCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppNotification, FollowRequest } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  followRequests: FollowRequest[];
  onAcceptFollowRequest: (request: FollowRequest) => void;
  onDeclineFollowRequest: (requestId: string) => void;
  onMarkAllAsRead: () => void;
  renderAvatar: (seed?: string, name?: string, url?: string, sizeClasses?: string) => React.ReactNode;
  themeMode?: 'light' | 'dark';
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  followRequests,
  onAcceptFollowRequest,
  onDeclineFollowRequest,
  onMarkAllAsRead,
  renderAvatar,
  themeMode = 'light'
}) => {
  if (!isOpen) return null;

  const totalItems = followRequests.length + notifications.length;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-2xl border border-neutral-200/80 dark:border-neutral-800 flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  Notifications
                </h3>
                <p className="text-[11px] text-neutral-400">
                  {totalItems > 0 
                    ? `${totalItems} total alert${totalItems === 1 ? '' : 's'}`
                    : 'Activity and requests'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
            {/* 1. Follow Requests Section */}
            {followRequests.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Follow Requests
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    {followRequests.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {followRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700/60 gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {renderAvatar(req.fromAvatar, req.fromName, undefined, 'h-10 w-10 text-xs shrink-0')}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                            {req.fromName}
                          </p>
                          <p className="text-[11px] text-neutral-400 truncate">
                            @{req.fromUsername}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onAcceptFollowRequest(req)}
                          className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs transition-colors cursor-pointer shadow-xs active:scale-95"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => onDeclineFollowRequest(req.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-neutral-200/80 hover:bg-neutral-200 dark:bg-neutral-700/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-xs transition-colors cursor-pointer active:scale-95"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. General Notifications Section */}
            {notifications.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                  Activity
                </span>
                <div className="space-y-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 p-3 rounded-2xl transition-colors ${
                        !n.read 
                          ? 'bg-neutral-100/70 dark:bg-neutral-800/70' 
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                      }`}
                    >
                      {renderAvatar(n.fromAvatar, n.fromName, undefined, 'h-9 w-9 text-xs shrink-0')}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-snug">
                          <span className="font-bold text-neutral-900 dark:text-white">{n.fromName}</span>{' '}
                          {n.type === 'follow_accept' && 'accepted your follow request.'}
                          {n.type === 'new_follower' && 'started following you.'}
                          {n.type === 'follow_request' && 'requested to follow your account.'}
                          {n.type === 'mention' && 'mentioned you in a conversation.'}
                          {!['follow_accept', 'new_follower', 'follow_request', 'mention'].includes(n.type) && 'sent an update.'}
                        </p>
                        <span className="text-[10px] text-neutral-400 mt-1 block font-mono">
                          {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                        </span>
                      </div>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Empty State */}
            {followRequests.length === 0 && notifications.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                <div className="h-14 w-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-3 border border-neutral-200/50 dark:border-neutral-700/50">
                  <Bell className="h-6 w-6 stroke-[1.6]" />
                </div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                  No notifications
                </h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                  You have no new alerts or pending follow requests right now.
                </p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
