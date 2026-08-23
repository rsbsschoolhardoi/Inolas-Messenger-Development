import React, { useState } from 'react';
import { 
  Check, CheckCheck, MoreVertical, Maximize2, FileText, 
  MapPin, ExternalLink, Download, UserPlus, BarChart2, 
  Ban, Shield, Pin, Forward as ForwardIcon, Star, ChevronDown, ChevronUp
} from 'lucide-react';
import { Message, UserData } from '../types';
import { InlineVideoPlayer } from './InlineVideoPlayer';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { getThemeById } from '../chatThemes';

interface MessageCardProps {
  msg: Message;
  isMe: boolean;
  senderName: string;
  senderUsername: string;
  isFirstInGroup: boolean;
  privacyReadReceipts: boolean;
  isDelivered: boolean;
  themeId?: string;
  onOpenActions: (msg: Message) => void;
  onReact: (msgId: string, emoji: string) => void;
  onVotePoll: (msgId: string, optionId: string) => void;
  onOpenMediaPlayer: (type: 'image' | 'video' | 'document' | 'audio', url: string, meta: any) => void;
  onToast: (text: string) => void;
}

const EMOJIS = ['❤️', '👍', '🔥', '😂', '🎉', '👏', '😮', '🙏'];
const MAX_TEXT_LENGTH = 280;

export const MessageCard: React.FC<MessageCardProps> = ({
  msg,
  isMe,
  senderName,
  senderUsername,
  isFirstInGroup,
  privacyReadReceipts,
  isDelivered,
  themeId,
  onOpenActions,
  onReact,
  onVotePoll,
  onOpenMediaPlayer,
  onToast,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const isRead = msg.read_by && msg.read_by.some(u => u !== (isMe ? 'me' : senderUsername));
  const activeTheme = getThemeById(themeId);
  const isMediaOnly = (msg.type === 'image' || msg.type === 'video') && !msg.text;

  return (
    <div 
      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative my-0.5 max-w-full`}
      onContextMenu={(e) => {
        e.preventDefault();
        onOpenActions(msg);
      }}
    >
      {/* Reply banner preview if replying to another message */}
      {msg.reply_to && !msg.deleted_for_everyone && (
        <div 
          className={`text-[11px] py-1 px-3 rounded-t-xl max-w-[85%] md:max-w-md border-b text-left truncate select-none ${
            isMe 
              ? 'bg-black/20 text-white border-white/20' 
              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
          }`}
        >
          <span className="font-bold">Replying to {msg.reply_sender || 'message'}: </span>
          <span className="italic opacity-90">{msg.reply_preview || '...'}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex items-center gap-1.5 max-w-[88%] sm:max-w-md md:max-w-lg min-w-0">
        
        {/* Left Action trigger for sent messages */}
        {isMe && (
          <button
            onClick={() => onOpenActions(msg)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-black/20 text-neutral-400 hover:text-white transition-opacity shrink-0 cursor-pointer"
            title="Message Options"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Message Bubble Card */}
        <div
          className={`text-left min-w-[110px] break-words [overflow-wrap:anywhere] transition-all ${
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
                : `${activeTheme.bubble.receivedBg || 'bg-white dark:bg-neutral-900'} ${activeTheme.bubble.receivedText || 'text-neutral-900 dark:text-neutral-100'} rounded-tl-xs border border-neutral-200/70 dark:border-neutral-800 shadow-neutral-900/5`
          }`}
        >
          {/* SENDER USERNAME AT TOP INSIDE CARD */}
          {!isMe && isFirstInGroup && !msg.deleted_for_everyone && (
            <div className="flex items-center gap-1 mb-1 pb-0.5 border-b border-black/5 dark:border-white/5 select-none">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                {senderName}
              </span>
              <span className="text-[10px] text-neutral-400 font-medium">
                @{senderUsername || 'user'}
              </span>
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
                <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold mb-1 opacity-70 select-none">
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
              {msg.type === 'image' && msg.media_url && (
                <div 
                  onClick={() => onOpenMediaPlayer('image', msg.media_url!, {
                    title: msg.file_name || 'Photo Attachment',
                    quality: msg.media_quality === 'hd' ? 'HD High' : 'Standard',
                    senderName,
                  })}
                  className="relative rounded-2xl overflow-hidden max-w-xs mb-1 group/media cursor-pointer border border-neutral-200/50 dark:border-neutral-800/80 shadow-xs hover:shadow-md transition-all"
                >
                  <img 
                    src={msg.media_url} 
                    alt="Photo Attachment" 
                    className="w-full max-h-64 object-cover rounded-xl group-hover/media:scale-102 transition-transform duration-300" 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/20 transition-colors flex items-center justify-center">
                    <Maximize2 className="h-5 w-5 text-white opacity-0 group-hover/media:opacity-100 transition-opacity drop-shadow" />
                  </div>
                  {msg.media_quality === 'hd' && (
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
                    src={msg.media_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
                    fileName={msg.file_name || 'Shared Video'}
                    isMe={isMe}
                    onExpand={() => {
                      onOpenMediaPlayer('video', msg.media_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', {
                        title: msg.file_name || 'Shared Video',
                        quality: msg.media_quality === 'hd' ? 'HD 1080p' : 'Standard',
                        senderName,
                      });
                    }}
                  />
                </div>
              )}

              {/* VOICE NOTE & AUDIO ATTACHMENT WITH WAVEFORM & SOUND */}
              {msg.type === 'voice' && (
                <VoiceNotePlayer
                  audioUrl={msg.audio_url}
                  durationStr={msg.file_size || '0:12'}
                  isMe={isMe}
                  messageId={msg.id}
                />
              )}

              {/* DOCUMENT / FILE ATTACHMENT */}
              {msg.type === 'document' && (
                <div 
                  className={`p-3 rounded-xl flex items-center gap-3 mb-1 text-xs border transition-colors ${
                    isMe 
                      ? 'bg-indigo-700/80 border-indigo-500/50 text-white' 
                      : 'bg-neutral-50 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100'
                  }`}
                >
                  <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl shrink-0">
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
                      if (!msg.media_url) {
                        onToast(`File not found`);
                        return;
                      }
                      onToast(`Downloading ${msg.file_name || 'document'}... 📥`);
                      const link = document.createElement('a');
                      link.href = msg.media_url;
                      link.download = msg.file_name || 'document';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className={`p-2 rounded-xl transition-colors shrink-0 cursor-pointer ${
                      isMe 
                        ? 'hover:bg-white/20 text-white' 
                        : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
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
                  className={`p-3.5 rounded-xl space-y-3 mb-1 min-w-[240px] text-left border ${
                    isMe 
                      ? 'bg-indigo-700/80 border-indigo-500/40 text-white' 
                      : 'bg-neutral-50 dark:bg-neutral-800/90 border-neutral-200 dark:border-neutral-700/80 text-neutral-800 dark:text-neutral-100'
                  }`}
                >
                  <div className="flex justify-between items-start border-b border-black/10 dark:border-white/10 pb-2">
                    <div>
                      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold opacity-75">
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
                          onClick={() => onVotePoll(msg.id, opt.id)}
                          className={`w-full p-2.5 rounded-xl relative overflow-hidden border text-left transition-all cursor-pointer ${
                            hasVoted 
                              ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-500/30 font-bold shadow-xs' 
                              : 'border-neutral-200 dark:border-neutral-700/80 hover:border-indigo-300 bg-black/5 dark:bg-white/5'
                          }`}
                        >
                          {/* Animated Progress bar */}
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-indigo-500/30 dark:bg-indigo-500/40 transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          />
                          <div className="relative z-10 flex justify-between items-center text-xs">
                            <span className="flex items-center gap-2">
                              {hasVoted ? (
                                <span className="h-4 w-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">✓</span>
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
                  className={`p-3 rounded-xl space-y-2 mb-1 min-w-[220px] border ${
                    isMe 
                      ? 'bg-indigo-700/80 border-indigo-500/40 text-white' 
                      : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-500/20 rounded-xl text-rose-500 shrink-0">
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
                  className={`p-3 rounded-xl space-y-2 mb-1 min-w-[220px] border ${
                    isMe 
                      ? 'bg-indigo-700/80 border-indigo-500/40 text-white' 
                      : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {msg.contact_data.name.charAt(0).toUpperCase()}
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
                      className="flex-1 py-1 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 text-[10px] font-semibold text-center cursor-pointer"
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
              {msg.type === 'gif' && msg.media_url && (
                <img 
                  src={msg.media_url} 
                  alt="GIF" 
                  className="rounded-xl max-w-full sm:max-w-xs h-36 object-cover mb-1.5" 
                  referrerPolicy="no-referrer" 
                />
              )}

              {/* PLAIN TEXT CONTENT WITH SEE MORE / SEE LESS UNIFORM WRAPPING */}
              {msg.text && msg.type === 'text' && (
                <div className="text-xs leading-relaxed whitespace-pre-wrap break-words min-w-0 [overflow-wrap:anywhere] max-w-full overflow-hidden">
                  {msg.text.length > MAX_TEXT_LENGTH && !isExpanded ? (
                    <>
                      <span>{msg.text.slice(0, MAX_TEXT_LENGTH)}...</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsExpanded(true);
                        }}
                        className={`font-bold ml-1 text-[11px] underline cursor-pointer inline-flex items-center gap-0.5 ${
                          isMe ? 'text-white/90 hover:text-white' : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700'
                        }`}
                      >
                        <span>See More</span>
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span>{msg.text}</span>
                      {msg.text.length > MAX_TEXT_LENGTH && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(false);
                          }}
                          className={`font-bold ml-1.5 text-[11px] underline cursor-pointer inline-flex items-center gap-0.5 ${
                            isMe ? 'text-white/90 hover:text-white' : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700'
                          }`}
                        >
                          <span>See Less</span>
                          <ChevronUp className="h-3 w-3" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* MESSAGE FOOTER: TIMESTAMP, EDITED & TICKS */}
              <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-70 select-none">
                {msg.starred && <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 mr-0.5" />}
                <span>{msg.timestamp}</span>
                {msg.edited && <span>• Edited</span>}
                {isMe && (
                  <span className="ml-0.5">
                    {(() => {
                      if (!privacyReadReceipts) {
                        return <Check className="h-3 w-3 stroke-[2]" />;
                      }
                      if (isRead) {
                        return <CheckCheck className="h-3 w-3 stroke-[2.5] text-sky-300 dark:text-sky-400" />;
                      }
                      if (isDelivered) {
                        return <CheckCheck className="h-3 w-3 stroke-[2]" />;
                      }
                      return <Check className="h-3 w-3 stroke-[2]" />;
                    })()}
                  </span>
                )}
              </div>
            </>
          )}

          {/* REACTION PILLS ON CARD */}
          {msg.reactions && msg.reactions.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {msg.reactions.map((react, rIdx) => (
                <button 
                  key={rIdx}
                  onClick={() => onReact(msg.id, react.emoji)}
                  className={`text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 hover:scale-105 transition-transform cursor-pointer ${
                    react.users.includes('me') || react.users.includes(senderUsername) 
                      ? 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold' 
                      : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  <span>{react.emoji}</span>
                  <span className="font-mono">{react.users.length}</span>
                </button>
              ))}
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
