import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';

export interface AppleComposerInputHandle {
  focus: () => void;
  blur: () => void;
  insertEmoji: (emoji: string) => void;
  getElement: () => HTMLTextAreaElement | null;
}

interface AppleComposerInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const AppleComposerInput = forwardRef<AppleComposerInputHandle, AppleComposerInputProps>(({
  value,
  onChange,
  onKeyDown,
  onFocus,
  placeholder = 'Type a message...',
  className = '',
  disabled = false
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastEmittedValueRef = useRef<string>(value);

  // Auto-resize textarea height seamlessly based on content (1 to 5 lines)
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    // Cap maximum height to around 120px (approx 5 lines) with smooth scrolling
    const targetHeight = Math.min(Math.max(scrollHeight, 24), 120);
    textarea.style.height = `${targetHeight}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Imperative handle: Rock-solid, lag-free Left-to-Right emoji insertion and focus management
  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    },
    blur: () => {
      textareaRef.current?.blur();
    },
    insertEmoji: (emoji: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const currentVal = textarea.value;
      const start = textarea.selectionStart ?? currentVal.length;
      const end = textarea.selectionEnd ?? currentVal.length;

      // Natural Left-to-Right string insertion
      const newText = currentVal.substring(0, start) + emoji + currentVal.substring(end);
      const newCursorPos = start + emoji.length;

      lastEmittedValueRef.current = newText;
      onChange(newText);

      // Immediately focus and position the caret AFTER the newly inserted emoji
      requestAnimationFrame(() => {
        if (textarea) {
          textarea.focus();
          try {
            textarea.setSelectionRange(newCursorPos, newCursorPos);
          } catch {}
          adjustHeight();
        }
      });
    },
    getElement: () => textareaRef.current
  }), [onChange, adjustHeight]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    lastEmittedValueRef.current = nextVal;
    onChange(nextVal);
    adjustHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onKeyDown?.(e);
      return;
    }
    onKeyDown?.(e);
  };

  return (
    <div className="relative flex-1 flex items-center min-w-0" dir="ltr">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
        dir="ltr"
        className={`font-chat w-full resize-none bg-transparent outline-none text-left break-words overflow-y-auto font-[460] tracking-[-0.012em] leading-relaxed transition-none ${className}`}
        style={{
          minHeight: '24px',
          maxHeight: '120px',
          paddingTop: '2px',
          paddingBottom: '2px',
          direction: 'ltr',
          textAlign: 'left',
          unicodeBidi: 'plaintext'
        }}
      />
    </div>
  );
});

AppleComposerInput.displayName = 'AppleComposerInput';
