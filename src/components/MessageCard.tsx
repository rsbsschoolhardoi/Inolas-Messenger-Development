import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, CheckCheck, MoreVertical, Maximize2, FileText, 
  MapPin, ExternalLink, Download, UserPlus, BarChart2, 
  Ban, Shield, Pin, Forward as ForwardIcon, Star, ChevronDown, ChevronUp,
  Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video, VideoOff, Clock
} from 'lucide-react';
import { Message, UserData } from '../types';
import { PurpleVerifiedBadge } from './PurpleVerifiedBadge';
import { InlineVideoPlayer } from './InlineVideoPlayer';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { getThemeById } from '../chatThemes';
import { getMediaUrlFromDrive } from '../lib/googleDrive';
import { decryptFile } from '../cryptoUtils';
import { decodeMessage } from '../chatUtils';
import { SmartTextMessage } from './SmartTextMessage';
import { formatMessageTime } from '../dateUtils';

interface MessageCardProps {
  msg: Message;
  isMe: boolean;
  senderName: string;
  senderUsername: string;
  isFirstInGroup: boolean;
  isGroup?: boolean;
  privacyReadReceipts: boolean;
  isDelivered: boolean;
  themeId?: string;
  onOpenActions: (msg: Message) => void;
  onReact: (msgId: string, emoji: string) => void;
  onVotePoll: (msgId: string, optionId: string) => void;
  onOpenMediaPlayer: (type: 'image' | 'video' | 'document' | 'audio', url: string, meta: any) => void;
  onToast: (text: string) => void;
  driveAccessToken?: string | null;
  isSenderVerified?: boolean;
  isSenderServiceAccount?: boolean;
  isSelected?: boolean;
  isInSelectionMode?: boolean;
  onToggleSelect?: (msgId: string, mode?: 'select' | 'unselect' | 'toggle') => void;
}

const EMOJIS = ['❤️', '👍', '🔥', '😂', '🎉', '👏', '😮', '🙏'];
const MAX_TEXT_LENGTH = 280;

export const MessageCard: React.FC<MessageCardProps> = ({
  msg,
  isMe,
  senderName,
  senderUsername,
  isFirstInGroup,
  isGroup = false,
  privacyReadReceipts,
  isDelivered,
  themeId,
  onOpenActions,
  onReact,
  onVotePoll,
  onOpenMediaPlayer,
  onToast,
  driveAccessToken,
  isSenderVerified = false,
  isSenderServiceAccount = false,
  isSelected = false,
  isInSelectionMode = false,
  onToggleSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [resolvedMediaUrl, setResolvedMediaUrl] = useState<string | null>(null);
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string | null>(null);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isTouchRef = useRef<boolean>(false);
  const longPressFiredRef = useRef<boolean>(false);

  const triggerSelection = (mode: 'select' | 'unselect' | 'toggle' = 'toggle') => {
    if (onToggleSelect && !msg.deleted_for_everyone) {
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        try { window.navigator.vibrate(50); } catch (_) {}
      }
      onToggleSelect(msg.id, mode);
    }
  };

  const startLongPressTimer = (x: number, y: number) => {
    longPressFiredRef.current = false;
    touchStartPosRef.current = { x, y };
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      triggerSelection('toggle');
      touchTimerRef.current = null;
    }, 280); // Butter smooth 280ms threshold
  };

  const cancelLongPressTimer = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isTouchRef.current = true;
    if (e.touches && e.touches[0]) {
      startLongPressTimer(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    cancelLongPressTimer();
    if (longPressFiredRef.current) {
      if (e.cancelable) e.preventDefault();
      setTimeout(() => {
        longPressFiredRef.current = false;
      }, 100);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartPosRef.current && e.touches && e.touches[0]) {
      const dx = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);
      if (dx > 12 || dy > 12) {
        cancelLongPressTimer();
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isTouchRef.current) return;
    if (e.button === 0) {
      startLongPressTimer(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    if (!isTouchRef.current) {
      cancelLongPressTimer();
      if (longPressFiredRef.current) {
        setTimeout(() => {
          longPressFiredRef.current = false;
        }, 100);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cancelLongPressTimer();
    longPressFiredRef.current = true;
    triggerSelection('toggle');
    setTimeout(() => {
      longPressFiredRef.current = false;
    }, 100);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (longPressFiredRef.current) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    if (isInSelectionMode) {
      e.stopPropagation();
      e.preventDefault();
      triggerSelection('toggle');
    }
  };



  
  const isRead = Array.isArray(msg.read_by) && msg.read_by.some(u => 
    u && 
    u !== 'me' && 
    u !== senderUsername && 
    u !== msg.sender &&
    (!isMe || (u !== senderUsername && u !== 'me'))
  );
  const activeTheme = getThemeById(themeId);
  // Fix service account text formatting
  let displayMsgText = decodeMessage(msg.text || '');
  if (isSenderServiceAccount) {
    if (displayMsgText.startsWith('📢 **[Direct Message]**\n\n')) {
      displayMsgText = displayMsgText.replace('📢 **[Direct Message]**\n\n', '');
    } else if (displayMsgText.startsWith('**[Direct Message]**\n\n')) {
      displayMsgText = displayMsgText.replace('**[Direct Message]**\n\n', '');
    } else if (displayMsgText.startsWith('📢 [Direct Message] ')) {
      displayMsgText = displayMsgText.replace('📢 [Direct Message] ', '');
    } else if (displayMsgText.startsWith('[Direct Message] ')) {
      displayMsgText = displayMsgText.replace('[Direct Message] ', '');
    }
  }

  const isMediaOnly = (msg.type === 'image' || msg.type === 'video') && !displayMsgText;

  if (isSenderServiceAccount) {
    if (displayMsgText.startsWith('📢 **[Direct Message]**\n\n')) {
      displayMsgText = displayMsgText.replace('📢 **[Direct Message]**\n\n', '');
    } else if (displayMsgText.startsWith('**[Direct Message]**\n\n')) {
      displayMsgText = displayMsgText.replace('**[Direct Message]**\n\n', '');
    } else if (displayMsgText.startsWith('📢 [Direct Message] ')) {
      displayMsgText = displayMsgText.replace('📢 [Direct Message] ', '');
    } else if (displayMsgText.startsWith('[Direct Message] ')) {
      displayMsgText = displayMsgText.replace('[Direct Message] ', '');
    }
  }


  useEffect(() => {
    const resolveUrl = async (url: string | undefined | null, setter: (val: string | null) => void) => {
      if (!url) {
        setter(null);
        return;
      }

      if (url.startsWith('drive://') && driveAccessToken) {
        const fileId = url.replace('drive://', '');
        try {
          const resolved = await getMediaUrlFromDrive(driveAccessToken, fileId);
          setter(resolved);
        } catch (err) {
          console.error('Drive media resolution failed:', err);
        }
      } else if (url.startsWith('enc:')) {
        const encryptedUrl = url.replace('enc:', '');
        try {
          const response = await fetch(encryptedUrl);
          const encryptedBlob = await response.blob();
          const decryptedBlob = await decryptFile(encryptedBlob, msg.chat_id, msg.type === 'image' ? 'image/jpeg' : msg.type === 'video' ? 'video/mp4' : 'application/octet-stream');
          setter(URL.createObjectURL(decryptedBlob));
        } catch (err) {
          console.error('Decryption failed for media:', err);
          setter(null);
        }
      } else {
        setter(url);
      }
    };

    resolveUrl(msg.media_url, setResolvedMediaUrl);
    resolveUrl(msg.audio_url, setResolvedAudioUrl);
  }, [msg.media_url, msg.audio_url, driveAccessToken, msg.chat_id, msg.type]);

  const displayMediaUrl = resolvedMediaUrl || msg.media_url;
  const displayAudioUrl = resolvedAudioUrl || msg.audio_url;

  const isSentDark = activeTheme.bubble.isSentDark ?? true;
  const isReceivedDark = activeTheme.bubble.isReceivedDark ?? false;

  const cardBgClass = isMe
    ? (activeTheme.bubble.cardBgSent || (isSentDark ? 'bg-black/25 border-white/20 text-white' : 'bg-black/5 border-black/15 text-slate-900'))
    : (activeTheme.bubble.cardBgReceived || (isReceivedDark ? 'bg-neutral-800/80 border-neutral-700 text-neutral-100' : 'bg-stone-50 border-stone-200 text-stone-900'));

  if (msg.type === 'system') {
    return (
      <div className="flex justify-center my-2.5 px-4 select-none w-full">
        <div className="px-4 py-1.5 rounded-full text-[11px] font-medium tracking-wide bg-neutral-100/90 dark:bg-neutral-800/90 text-neutral-600 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs backdrop-blur-xs max-w-md text-center">
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative my-0.5 max-w-full transition-all duration-200 ${
        isSelected ? 'bg-black/15 dark:bg-white/15 backdrop-blur-xs -mx-3 px-3 py-1 rounded-xl transition-all' : ''
      }`}
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
    >

      {/* Reply banner preview if replying to another message */}
      {msg.reply_to && !msg.deleted_for_everyone && (
        <div 
          className={`text-[11px] py-1 px-3 rounded-t-xl max-w-[85%] md:max-w-md border-b text-left truncate select-none ${
            isMe 
              ? isSentDark 
                ? 'bg-black/30 text-white/95 border-white/20' 
                : 'bg-black/10 text-slate-900 border-black/15'
              : isReceivedDark
                ? 'bg-white/10 text-neutral-200 border-white/15'
                : 'bg-neutral-200/90 text-neutral-800 border-neutral-300'
          }`}
        >
          <span className="font-bold">Replying to {msg.reply_sender || 'message'}: </span>
          <span className="italic opacity-90">{msg.reply_preview || '...'}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex items-center gap-1.5 max-w-[88%] sm:max-w-md md:max-w-lg min-w-0">
        
        {/* Left Action trigger for sent messages */}
        {isMe && !isInSelectionMode && (
          <button
            onClick={() => {
              if (onToggleSelect) {
                onToggleSelect(msg.id);
              } else {
                onOpenActions(msg);
              }
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-black/20 text-neutral-400 hover:text-white transition-opacity shrink-0 cursor-pointer"
            title="Select Message"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Message Bubble Card */}
        <div
          className={`text-left min-w-[110px] break-words [overflow-wrap:anywhere] transition-all relative ${
            isMediaOnly ? 'p-1 bg-transparent border-0' : 'p-3 shadow-xs'
          } ${
            msg.reply_to ? 'rounded-b-2xl' : 'rounded-2xl'
          } ${
            isMe
              ? isMediaOnly 
                ? 'rounded-tr-xs' 
                : `${activeTheme.bubble.sentBg} ${activeTheme.bubble.sentText} ${activeTheme.bubble.borderStyle || ''} rounded-tr-xs`
              : isMediaOnly
                ? 'rounded-tl-xs'
                : `${activeTheme.bubble.receivedBg || 'bg-white dark:bg-neutral-900'} ${activeTheme.bubble.receivedText || 'text-neutral-900 dark:text-neutral-100'} rounded-tl-xs ${activeTheme.bubble.borderStyle || 'border border-neutral-200/70 dark:border-neutral-800'} shadow-neutral-900/5`
          }`}
        >

          {/* SENDER NAME AT TOP INSIDE CARD (Group chats only) */}
          {!isMe && isGroup && isFirstInGroup && !msg.deleted_for_everyone && (
            <div className="flex items-center gap-1 mb-1 pb-0.5 border-b border-black/5 dark:border-white/5 select-none">
              <span className={`text-[11px] font-bold ${isReceivedDark ? 'text-indigo-300' : 'text-neutral-900 dark:text-neutral-100'}`}>
                {senderName}
              </span>
              {isSenderVerified && (
                <PurpleVerifiedBadge size="xs"  />
              )}
            </div>
          )}

          {/* DELETED FOR EVERYONE PLACEHOLDER */}
          {msg.deleted_for_everyone ? (
            <div className="flex items-center gap-2 py-0.5 text-neutral-400 dark:text-neutral-500 italic text-xs select-none">
              <Ban className="h-3.5 w-3.5 text-neutral-400" />
              <span>This message was deleted</span>
            </div>
          ) : (
            <>
              {/* Forwarded Header */}
              {msg.forwarded && (
                <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold mb-1 opacity-75 select-none">
                  <ForwardIcon className="h-3 w-3" />
                  <span>Forwarded</span>
                </div>
              )}

              {/* Pin indicator */}
              {msg.pinned && (
                <div className="flex items-center gap-1 text-[9px] font-bold mb-1 text-amber-300 dark:text-amber-400 select-none">
                  <Pin className="h-3 w-3 rotate-45" />
                  <span>Pinned Message</span>
                </div>
              )}

              {/* PHOTO / IMAGE ATTACHMENT */}
              {msg.type === 'image' && displayMediaUrl && (
                <div 
                  onClick={(e) => {
                    if (longPressFiredRef.current) {
                      e.stopPropagation();
                      e.preventDefault();
                      return;
                    }
                    if (isInSelectionMode) {
                      e.stopPropagation();
                      e.preventDefault();
                      if (onToggleSelect) onToggleSelect(msg.id, 'toggle');
                      return;
                    }
                    onOpenMediaPlayer('image', displayMediaUrl!, {
                      title: msg.file_name || 'Photo Attachment',
                      quality: (msg.media_quality === 'hd' || isSenderServiceAccount) ? 'HD High' : 'Standard',
                      senderName,
                    });
                  }}
                  className={`relative rounded-2xl overflow-hidden ${isSenderServiceAccount ? 'max-w-md' : 'max-w-xs'} mb-1 group/media cursor-pointer border border-neutral-200/50 dark:border-neutral-800/80 shadow-xs hover:shadow-md transition-all`}
                >
                  <img 
                    src={displayMediaUrl} 
                    alt="Photo Attachment" 
                    className={`w-full ${isSenderServiceAccount ? 'max-h-[600px] object-contain' : 'max-h-64 object-cover'} rounded-xl group-hover/media:scale-102 transition-transform duration-300`} 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/20 transition-colors flex items-center justify-center">
                    <Maximize2 className="h-5 w-5 text-white opacity-0 group-hover/media:opacity-100 transition-opacity drop-shadow" />
                  </div>
                  {(msg.media_quality === 'hd' || isSenderServiceAccount) && (
                    <span className="absolute top-2 right-2 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur">
                      HD
                    </span>
                  )}
                </div>
              )}

              {/* VIDEO ATTACHMENT WITH INBUILT VIDEO PLAYER */}
              {msg.type === 'video' && (
                <div className="my-0.5 max-w-full">
                  <InlineVideoPlayer
                    src={displayMediaUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
                    fileName={msg.file_name || 'Shared Video'}
                    isMe={isMe}
                    onExpand={() => {
                      if (longPressFiredRef.current) {
                        return;
                      }
                      if (isInSelectionMode) {
                        if (onToggleSelect) onToggleSelect(msg.id, 'toggle');
                        return;
                      }
                      onOpenMediaPlayer('video', displayMediaUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', {
                        title: msg.file_name || 'Shared Video',
                        quality: (msg.media_quality === 'hd' || isSenderServiceAccount) ? 'HD 1080p' : 'Standard',
                        senderName,
                      });
                    }}
                  />
                </div>
              )}

              {/* VOICE NOTE & AUDIO ATTACHMENT WITH WAVEFORM & SOUND */}
              {msg.type === 'voice' && (
                <VoiceNotePlayer
                  audioUrl={displayAudioUrl}
                  durationStr={msg.file_size || '0:12'}
                  isMe={isMe}
                  isSentDark={isSentDark}
                  messageId={msg.id}
                />
              )}

              {/* DOCUMENT / FILE ATTACHMENT */}
              {msg.type === 'document' && (
                <div 
                  className={`p-3 rounded-xl flex items-center gap-3 mb-1 text-xs border transition-colors ${cardBgClass}`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${isSentDark && isMe ? 'bg-white/20 text-white' : 'bg-neutral-800 dark:bg-neutral-200/20 text-neutral-900 dark:text-neutral-100 dark:text-neutral-400 dark:text-neutral-600'}`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-bold truncate text-xs">{msg.file_name || 'Document.pdf'}</p>
                    <p className="text-[10px] opacity-75 font-mono">{msg.file_size || '1.4 MB'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (longPressFiredRef.current) {
                        return;
                      }
                      if (isInSelectionMode) {
                        if (onToggleSelect) onToggleSelect(msg.id, 'toggle');
                        return;
                      }
                      if (!displayMediaUrl) {
                        onToast(`File not found`);
                        return;
                      }
                      onToast(`Downloading ${msg.file_name || 'document'}...`);
                      const link = document.createElement('a');
                      link.href = displayMediaUrl;
                      link.download = msg.file_name || 'document';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className={`p-2 rounded-xl transition-colors shrink-0 cursor-pointer ${
                      isMe 
                        ? 'hover:bg-black/20 text-inherit' 
                        : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-inherit'
                    }`}
                    title="Download File"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* INTERACTIVE POLL */}
              {msg.type === 'poll' && msg.poll_data && (
                <div 
                  className={`p-3.5 rounded-xl space-y-3 mb-1 min-w-[240px] text-left border ${cardBgClass}`}
                >
                  <div className="flex justify-between items-start border-b border-black/10 dark:border-white/10 pb-2">
                    <div>
                      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold opacity-80">
                        <BarChart2 className="h-3 w-3 text-teal-400" />
                        <span>Interactive Poll</span>
                      </div>
                      <h4 className="font-bold text-xs leading-snug mt-0.5">{msg.poll_data.question}</h4>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/20 dark:bg-white/10 opacity-90 shrink-0 ml-2">
                      {msg.poll_data.total_votes} {msg.poll_data.total_votes === 1 ? 'vote' : 'votes'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {msg.poll_data.options.map((opt) => {
                      const voter = isMe ? 'me' : senderUsername;
                      const hasVoted = opt.votes.includes(voter) || opt.votes.includes('me');
                      const percentage = msg.poll_data!.total_votes > 0 
                        ? Math.round((opt.votes.length / msg.poll_data!.total_votes) * 100) 
                        : 0;

                      return (
                        <button
                          key={opt.id}
                          onClick={(e) => {
                            if (longPressFiredRef.current) {
                              e.stopPropagation();
                              return;
                            }
                            if (isInSelectionMode) {
                              e.stopPropagation();
                              if (onToggleSelect) onToggleSelect(msg.id, 'toggle');
                              return;
                            }
                            onVotePoll(msg.id, opt.id);
                          }}
                          className={`w-full p-2.5 rounded-xl relative overflow-hidden border text-left transition-all cursor-pointer ${
                            hasVoted 

                              ? 'border-neutral-700 dark:border-neutral-300 dark:border-neutral-400 bg-neutral-800 dark:bg-neutral-200/30 font-bold shadow-xs' 
                              : 'border-black/10 dark:border-white/10 hover:border-neutral-400 bg-black/5 dark:bg-white/5'
                          }`}
                        >
                          {/* Animated Progress bar */}
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-neutral-800 dark:bg-neutral-200/30 dark:bg-neutral-800 dark:bg-neutral-200/40 transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          />
                          <div className="relative z-10 flex justify-between items-center text-xs">
                            <span className="flex items-center gap-2">
                              {hasVoted ? (
                                <span className="h-4 w-4 rounded-full bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 flex items-center justify-center text-[10px]">✓</span>
                              ) : (
                                <span className="h-4 w-4 rounded-full border border-neutral-400 dark:border-neutral-600 shrink-0"></span>
                              )}
                              <span className="truncate">{opt.text}</span>
                            </span>
                            <span className="text-[10px] font-mono opacity-85 shrink-0 ml-2">
                              {percentage}% ({opt.votes.length})
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* LOCATION CARD */}
              {msg.type === 'location' && msg.location_data && (
                <div 
                  className={`p-3 rounded-xl space-y-2 mb-1 min-w-[220px] border ${cardBgClass}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-neutral-200 dark:bg-neutral-800 rounded-xl text-neutral-700 dark:text-neutral-300 shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="font-bold text-xs truncate">{msg.location_data.title}</p>
                      <p className="text-[10px] opacity-75 truncate">{msg.location_data.address}</p>
                    </div>
                  </div>
                  <a 
                    href={`https://maps.google.com/?q=${msg.location_data.lat},${msg.location_data.lng}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 text-[10px] font-bold transition-colors"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* CONTACT CARD */}
              {msg.type === 'contact' && msg.contact_data && (
                <div 
                  className={`p-3 rounded-xl space-y-2 mb-1 min-w-[220px] border ${cardBgClass}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 font-bold flex items-center justify-center text-xs shrink-0">
                      {(msg.contact_data?.name || "C").charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="font-bold text-xs truncate">{msg.contact_data.name}</p>
                      <p className="text-[10px] opacity-75 truncate">{msg.contact_data.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <button 
                      onClick={() => onToast(`Calling ${msg.contact_data?.phone}...`)} 
                      className="flex-1 py-1 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 text-[10px] font-semibold text-center cursor-pointer"
                    >
                      Call
                    </button>
                    <button 
                      onClick={() => onToast(`Opening conversation with ${msg.contact_data?.name}...`)} 
                      className="flex-1 py-1 rounded-lg bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 hover:bg-neutral-900 dark:bg-neutral-100 text-[10px] font-semibold text-center cursor-pointer"
                    >
                      Message
                    </button>
                  </div>
                </div>
              )}

              {/* STICKER */}
              {msg.type === 'sticker' && (
                <span className="text-4xl block py-1 select-none">{msg.text}</span>
              )}

              {/* GIF */}
              {msg.type === 'gif' && displayMediaUrl && (
                <img 
                  src={displayMediaUrl} 
                  alt="GIF" 
                  className="rounded-xl max-w-full sm:max-w-xs h-36 object-cover mb-1.5" 
                  referrerPolicy="no-referrer" 
                />
              )}

              {/* CALL LOG CARD WITH CLEAR TIMINGS AND PROPER SPACING */}
              {(msg.type === 'call' || msg.call_data) && (
                <div 
                  className={`p-3 rounded-2xl flex flex-col gap-2 min-w-[240px] sm:min-w-[270px] border select-none my-0.5 ${cardBgClass}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Call Icon Badge */}
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      msg.call_data?.status === 'answered'
                        ? (msg.call_data?.call_type === 'video' ? 'bg-neutral-800 dark:bg-neutral-200/25 text-neutral-400 dark:text-neutral-600' : 'bg-emerald-500/25 text-emerald-400')
                        : 'bg-rose-500/25 text-rose-400'
                    }`}>
                      {msg.call_data?.status === 'answered' ? (
                        msg.call_data?.call_type === 'video' ? (
                          <Video className="h-5 w-5" />
                        ) : isMe ? (
                          <PhoneOutgoing className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <PhoneIncoming className="h-5 w-5 text-emerald-400" />
                        )
                      ) : (
                        msg.call_data?.call_type === 'video' ? (
                          <VideoOff className="h-5 w-5 text-rose-400" />
                        ) : (
                          <PhoneMissed className="h-5 w-5 text-rose-400" />
                        )
                      )}
                    </div>

                    {/* Call Title & Info */}
                    <div className="text-left min-w-0 flex-1">
                      <h4 className="font-bold text-xs">
                        {msg.call_data?.status === 'answered'
                          ? (msg.call_data?.call_type === 'video' ? 'Video Call' : 'Voice Call')
                          : (isMe 
                              ? (msg.call_data?.call_type === 'video' ? 'Unanswered Video Call' : 'Unanswered Voice Call')
                              : (msg.call_data?.call_type === 'video' ? 'Missed Video Call' : 'Missed Voice Call')
                            )
                        }
                      </h4>

                      {/* Answered: Start time, End time, and duration */}
                      {msg.call_data?.status === 'answered' ? (
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium opacity-90">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 opacity-70" />
                            <span>Started: {msg.call_data.start_time}</span>
                          </span>
                          {msg.call_data.end_time && (
                            <>
                              <span className="opacity-40">•</span>
                              <span>Ended: {msg.call_data.end_time}</span>
                            </>
                          )}
                          {msg.call_data.duration_formatted && (
                            <>
                              <span className="opacity-40">•</span>
                              <span className="font-mono font-bold bg-black/20 dark:bg-white/10 px-1.5 py-0.2 rounded text-[10px]">
                                {msg.call_data.duration_formatted}
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        /* Truly Unanswered / Missed: Only start time with clean spacing */
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-rose-400 dark:text-rose-300">
                          <Clock className="h-3 w-3 opacity-70" />
                          <span>Started: {msg.call_data?.start_time || msg.timestamp}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SMART INTELLIGENT TEXT CONTENT WITH MARKDOWN, CODE BLOCKS, OTP & SEE MORE */}
              {displayMsgText && msg.type === 'text' && (
                <SmartTextMessage
                  text={displayMsgText}
                  isMe={isMe}
                  isSentDark={isSentDark}
                  isReceivedDark={isReceivedDark}
                  isSenderServiceAccount={isSenderServiceAccount}
                  onToast={onToast}
                  maxTextLength={MAX_TEXT_LENGTH}
                />
              )}

              {/* MESSAGE FOOTER: TIMESTAMP, EDITED & TICKS */}
              <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] select-none font-medium ${
                isMe
                  ? activeTheme.bubble.subtextSent || (isSentDark ? 'text-white/70' : 'text-slate-600')
                  : activeTheme.bubble.subtextReceived || (isReceivedDark ? 'text-neutral-400' : 'text-slate-500')
              }`}>
                {msg.starred && <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 mr-0.5" />}
                <span>{formatMessageTime(msg.created_at, msg.timestamp)}</span>
                {msg.edited && <span>• Edited</span>}
                {isMe && (
                  <span className="ml-0.5 inline-flex items-center" title={msg.status === 'sending' ? 'Sending...' : isRead ? 'Read' : isDelivered ? 'Delivered' : 'Sent'}>
                    {(() => {
                      if (msg.status === 'sending') {
                        return <Clock className="h-3 w-3 text-neutral-400 animate-pulse" />;
                      }
                      if (!privacyReadReceipts) {
                        return <Check className="h-3.5 w-3.5 stroke-[2] text-neutral-400/90" />;
                      }
                      if (isRead) {
                        return <CheckCheck className="h-3.5 w-3.5 stroke-[2.5] text-sky-400 dark:text-sky-300 drop-shadow-[0_0_2px_rgba(56,189,248,0.4)]" />;
                      }
                      if (isDelivered) {
                        return <CheckCheck className="h-3.5 w-3.5 stroke-[2] text-neutral-400 dark:text-neutral-500" />;
                      }
                      return <Check className="h-3.5 w-3.5 stroke-[2] text-neutral-400 dark:text-neutral-500" />;
                    })()}
                  </span>
                )}
              </div>
            </>
          )}

          {/* REACTION PILLS ON CARD */}
          {msg.reactions && msg.reactions.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {msg.reactions.map((react, rIdx) => {
                const hasMyReaction = react.users.includes('me') || react.users.includes(senderUsername);
                return (
                  <button 
                    key={rIdx}
                    onClick={() => onReact(msg.id, react.emoji)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 hover:scale-105 transition-transform cursor-pointer shadow-2xs ${
                      hasMyReaction 
                        ? isSentDark
                          ? 'bg-indigo-950/80 border-indigo-500 text-neutral-300 dark:text-neutral-700 font-bold'
                          : 'bg-indigo-100 border-neutral-700 dark:border-neutral-300 text-indigo-800 font-bold'
                        : isSentDark
                          ? 'bg-neutral-900/80 border-neutral-700 text-neutral-200'
                          : 'bg-white/90 border-neutral-300 text-neutral-800'
                    }`}
                  >
                    <span>{react.emoji}</span>
                    <span className="font-mono">{react.users.length}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Action trigger for received messages */}
        {!isMe && (
          <button
            onClick={() => onOpenActions(msg)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-opacity shrink-0 cursor-pointer"
            title="Message Options"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* QUICK EMOJI REACTION POPUP ON HOVER */}
      <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 mt-0.5 px-2 transition-opacity select-none">
        {EMOJIS.slice(0, 5).map(emoji => (
          <button 
            key={emoji}
            onClick={() => onReact(msg.id, emoji)}
            className="text-[11px] p-0.5 hover:scale-130 transition-transform cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
