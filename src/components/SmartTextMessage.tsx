import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Code, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface SmartTextMessageProps {
  text: string;
  isMe: boolean;
  isSentDark?: boolean;
  isReceivedDark?: boolean;
  isSenderServiceAccount?: boolean;
  onToast?: (msg: string) => void;
  maxTextLength?: number;
}

/**
 * Checks if string contains only 1-3 emojis
 */
function isEmojiOnly(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed) return false;
  // Emoji regex matching Unicode emojis
  const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]){1,3}$/u;
  try {
    return emojiRegex.test(trimmed);
  } catch {
    // Fallback simple length check
    return trimmed.length <= 6 && /[\u{1F300}-\u{1F9FF}]/u.test(trimmed);
  }
}

/**
 * Smart Inline Formatter for Markdown, URLs, Mentions, and Formatting
 */
function parseInlineContent(
  text: string, 
  isMe: boolean, 
  isSentDark: boolean, 
  isReceivedDark: boolean,
  onToast?: (msg: string) => void
): React.ReactNode[] {
  if (!text) return [];

  // Regex matching inline formatting tokens:
  // 1. Code: `code`
  // 2. Bold: **bold** or __bold__
  // 3. Strikethrough: ~~strike~~ or ~strike~
  // 4. Italic: *italic* or _italic_
  // 5. URL: http(s)://... or www....
  // 6. Mention: @username
  const tokenRegex = /(\*\*[\s\S]+?\*\*|__[\s\S]+?__|~~[\s\S]+?~~|`[^`]+`|\*[^\*\n]+\*|_[^\_\n]+_|~[^~\n]+~|https?:\/\/[^\s<]+|www\.[^\s<]+|@[a-zA-Z0-9_]{3,30})/g;

  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // 1. Inline Code
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      const codeContent = part.slice(1, -1);
      return (
        <code 
          key={idx}
          className={`px-1.5 py-0.5 mx-0.5 rounded font-mono text-[11px] select-all border ${
            isMe 
              ? isSentDark ? 'bg-black/30 text-amber-200 border-white/20' : 'bg-black/10 text-amber-900 border-black/15'
              : isReceivedDark ? 'bg-white/10 text-amber-300 border-white/15' : 'bg-neutral-100 text-amber-800 border-neutral-300 dark:bg-neutral-800 dark:text-amber-300 dark:border-neutral-700'
          }`}
        >
          {codeContent}
        </code>
      );
    }

    // 2. Bold (**text** or __text__)
    if ((part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
        (part.startsWith('__') && part.endsWith('__') && part.length >= 4)) {
      const boldContent = part.slice(2, -2);
      return (
        <strong key={idx} className="font-extrabold tracking-tight">
          {parseInlineContent(boldContent, isMe, isSentDark, isReceivedDark, onToast)}
        </strong>
      );
    }

    // 3. Strikethrough (~~text~~ or ~text~)
    if ((part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) ||
        (part.startsWith('~') && part.endsWith('~') && part.length >= 2)) {
      const strikeContent = part.startsWith('~~') ? part.slice(2, -2) : part.slice(1, -1);
      return (
        <del key={idx} className="line-through opacity-80">
          {parseInlineContent(strikeContent, isMe, isSentDark, isReceivedDark, onToast)}
        </del>
      );
    }

    // 4. Italic (*text* or _text_)
    if ((part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
        (part.startsWith('_') && part.endsWith('_') && part.length >= 2)) {
      const italicContent = part.slice(1, -1);
      return (
        <em key={idx} className="italic opacity-95">
          {parseInlineContent(italicContent, isMe, isSentDark, isReceivedDark, onToast)}
        </em>
      );
    }

    // 5. URL Link
    if (part.match(/^(https?:\/\/|www\.)/i)) {
      const href = part.startsWith('www.') ? `https://${part}` : part;
      return (
        <a
          key={idx}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-0.5 underline font-semibold break-all transition-opacity hover:opacity-80 ${
            isMe 
              ? isSentDark ? 'text-blue-200 underline' : 'text-blue-800 underline'
              : isReceivedDark ? 'text-blue-400 underline' : 'text-blue-600 dark:text-blue-400 underline'
          }`}
        >
          <span>{part}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
        </a>
      );
    }

    // 6. Username Mention (@username)
    if (part.startsWith('@') && part.length > 3) {
      return (
        <span
          key={idx}
          className={`font-bold px-1 py-0.2 mx-0.5 rounded text-[11px] ${
            isMe 
              ? 'bg-black/20 text-white' 
              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
          }`}
        >
          {part}
        </span>
      );
    }

    // Plain text
    return <span key={idx}>{part}</span>;
  });
}

/**
 * Code Block Component with Language Header and Copy Button
 */
const CodeBlock: React.FC<{ code: string; language?: string; onToast?: (msg: string) => void }> = ({
  code,
  language = 'code',
  onToast
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    if (onToast) onToast('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-lg text-left font-mono text-[11px] max-w-full">
      {/* Code Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-400 font-sans select-none">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-zinc-300">
          <Code className="h-3.5 w-3.5 text-indigo-400" />
          <span>{language || 'code'}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 font-semibold transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 text-zinc-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="p-3 overflow-x-auto max-h-80 leading-relaxed font-mono whitespace-pre select-all text-emerald-300 bg-zinc-950/90">
        <code>{code}</code>
      </div>
    </div>
  );
};

export const SmartTextMessage: React.FC<SmartTextMessageProps> = ({
  text,
  isMe,
  isSentDark = true,
  isReceivedDark = false,
  isSenderServiceAccount = false,
  onToast,
  maxTextLength = 280
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  if (!text) return null;

  // 1. Emoji-only rendering
  if (isEmojiOnly(text)) {
    return (
      <div className="text-4xl py-1 animate-scale-in select-none">
        {text}
      </div>
    );
  }

  // 2. Detect OTP / Verification Code
  // Pattern matches 4 to 8 digit numbers in text
  const otpMatch = text.match(/\b(\d{4,8})\b/);
  const hasOtpContext = /otp|verification|passcode|security code|verify|login code|authorization code|auth code/i.test(text) || isSenderServiceAccount;
  const detectedOtp = (otpMatch && hasOtpContext) ? otpMatch[1] : null;

  // Detect Security Alert
  const isSecurityAlert = /SECURITY ALERT/i.test(text);

  const handleCopyOtp = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedOtp(true);
    if (onToast) onToast(`Authentication Code ${code} copied to clipboard.`);
    setTimeout(() => setCopiedOtp(false), 2500);
  };

  // Truncate logic for long messages
  const shouldTruncate = text.length > maxTextLength;
  const displayText = shouldTruncate && !isExpanded ? `${text.slice(0, maxTextLength)}...` : text;

  // 3. Parse Code Blocks (```lang\ncode\n```)
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const blocks: { type: 'text' | 'code'; content: string; lang?: string }[] = [];

  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(displayText)) !== null) {
    if (match.index > lastIdx) {
      blocks.push({ type: 'text', content: displayText.substring(lastIdx, match.index) });
    }
    blocks.push({ type: 'code', lang: match[1] || 'code', content: match[2].trim() });
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < displayText.length) {
    blocks.push({ type: 'text', content: displayText.substring(lastIdx) });
  }

  return (
    <div className="text-xs leading-relaxed break-words min-w-0 [overflow-wrap:anywhere] max-w-full space-y-1">
      {/* Smart Security Alert Banner */}
      {isSecurityAlert && (
        <div className={`my-1 p-2 rounded-xl border flex items-center gap-2 ${
          isMe
            ? 'bg-black/20 border-white/20 text-white'
            : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
        }`}>
          <ShieldCheck className="h-4 w-4 text-indigo-500 shrink-0" />
          <div className="text-left min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-90">Official Security Advisory</span>
          </div>
        </div>
      )}

      {/* Smart OTP Copy Quick Action Banner */}
      {detectedOtp && (
        <div 
          onClick={(e) => handleCopyOtp(e, detectedOtp)}
          className={`my-1.5 p-2 rounded-xl border flex items-center justify-between gap-2 shadow-sm transition-all cursor-pointer ${
            isMe
              ? 'bg-black/20 border-white/20 text-white hover:bg-black/30'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <div className="text-left min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Verification Code</span>
              <span className="font-mono font-black text-sm tracking-widest block">{detectedOtp}</span>
            </div>
          </div>

          <button
            type="button"
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-transform active:scale-95 ${
              copiedOtp
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700'
            }`}
          >
            {copiedOtp ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Render Text / Code Blocks */}
      {blocks.map((block, i) => {
        if (block.type === 'code') {
          return <CodeBlock key={i} code={block.content} language={block.lang} onToast={onToast} />;
        }

        // Render line-by-line text block
        const lines = block.content.split('\n');
        return (
          <div key={i} className="space-y-0.5">
            {lines.map((line, lineIdx) => {
              // Check Blockquote (> text)
              if (line.startsWith('> ')) {
                return (
                  <blockquote
                    key={lineIdx}
                    className={`pl-2 py-0.5 my-0.5 border-l-2 italic opacity-90 ${
                      isMe
                        ? 'border-white/40 bg-black/10'
                        : 'border-indigo-500/80 bg-indigo-500/10'
                    }`}
                  >
                    {parseInlineContent(line.slice(2), isMe, isSentDark, isReceivedDark, onToast)}
                  </blockquote>
                );
              }

              // Check Bullet Points (- or *)
              if (line.match(/^[\-\*]\s+/)) {
                return (
                  <div key={lineIdx} className="flex items-start gap-1.5 pl-1">
                    <span className="font-bold text-indigo-400">•</span>
                    <span>{parseInlineContent(line.replace(/^[\-\*]\s+/, ''), isMe, isSentDark, isReceivedDark, onToast)}</span>
                  </div>
                );
              }

              return (
                <div key={lineIdx} className="min-h-[1.25rem]">
                  {parseInlineContent(line, isMe, isSentDark, isReceivedDark, onToast)}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Expand / Collapse Toggle for Very Long Messages */}
      {shouldTruncate && (
        <div className="pt-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`font-bold text-[11px] underline cursor-pointer inline-flex items-center gap-0.5 ${
              isMe
                ? (isSentDark ? 'text-white underline hover:opacity-90' : 'text-slate-900 underline font-bold')
                : (isReceivedDark ? 'text-indigo-300 underline' : 'text-neutral-900 dark:text-neutral-100 underline')
            }`}
          >
            <span>{isExpanded ? 'See Less' : 'See More'}</span>
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      )}
    </div>
  );
};
