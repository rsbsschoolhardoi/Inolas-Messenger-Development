import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { getAppleEmojiUrl } from '../utils/appleEmoji';

// Fast non-global test for any extended pictographic or emoji character
const HAS_EMOJI_REGEX = /(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\u{1f1e6}-\u{1f1ff})/u;

// Global regex used strictly when parsing text into emoji images
const EMOJI_EXTRACTOR_REGEX = /(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\u{1f1e6}-\u{1f1ff})(?:[\u{1f3fb}-\u{1f3ff}]|\ufe0f|\u200d(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\u{1f1e6}-\u{1f1ff}))*/gu;

export interface AppleComposerInputHandle {
  focus: () => void;
  blur: () => void;
  insertEmoji: (emoji: string) => void;
  getElement: () => HTMLDivElement | null;
}

interface AppleComposerInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function createEmojiElement(emoji: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.contentEditable = 'false';
  span.setAttribute('data-emoji', emoji);
  span.className = 'inline-flex items-center justify-center align-middle mx-0.5 select-all';

  const img = document.createElement('img');
  img.src = getAppleEmojiUrl(emoji);
  img.alt = emoji;
  img.className = 'inline-block w-5 h-5 align-middle pointer-events-none select-none';
  img.setAttribute('referrerpolicy', 'no-referrer');
  img.draggable = false;

  span.appendChild(img);
  return span;
}

function getTextFromNode(node: Node): string {
  let text = '';
  if (node.nodeType === Node.TEXT_NODE) {
    text += node.textContent || '';
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const emoji = el.getAttribute('data-emoji');
    if (emoji) {
      text += emoji;
    } else if (el.tagName === 'BR') {
      text += '\n';
    } else {
      for (let i = 0; i < el.childNodes.length; i++) {
        text += getTextFromNode(el.childNodes[i]);
      }
    }
  }
  return text;
}

function getCleanTextFromElement(el: HTMLElement): string {
  if (!el.hasChildNodes() || (el.childNodes.length === 1 && el.childNodes[0].nodeName === 'BR')) {
    return '';
  }
  const raw = getTextFromNode(el);
  if (raw === '\n' && el.innerHTML === '<br>') {
    return '';
  }
  return raw;
}

function renderValueToElement(el: HTMLElement, val: string) {
  el.innerHTML = '';
  if (!val) return;

  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  const re = new RegExp(EMOJI_EXTRACTOR_REGEX.source, 'gu');
  let match: RegExpExecArray | null;

  while ((match = re.exec(val)) !== null) {
    const textBefore = val.substring(lastIndex, match.index);
    if (textBefore) {
      fragment.appendChild(document.createTextNode(textBefore));
    }
    fragment.appendChild(createEmojiElement(match[0]));
    lastIndex = re.lastIndex;
  }

  const remainingText = val.substring(lastIndex);
  if (remainingText) {
    fragment.appendChild(document.createTextNode(remainingText));
  } else {
    // Trailing empty text node ensures the browser can always anchor the caret AFTER the final emoji
    fragment.appendChild(document.createTextNode(''));
  }

  el.appendChild(fragment);
}

function getCaretPosition(root: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return -1;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.startContainer)) return -1;

  try {
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(root);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    const fragment = preCaretRange.cloneContents();
    return getTextFromNode(fragment).length;
  } catch {
    return -1;
  }
}

function setCaretPosition(root: HTMLElement, targetOffset: number) {
  const sel = window.getSelection();
  if (!sel) return;

  let currentOffset = 0;
  let targetNode: Node | null = null;
  let targetNodeOffset = 0;

  function traverse(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = (node.textContent || '').length;
      if (currentOffset + len >= targetOffset) {
        targetNode = node;
        targetNodeOffset = targetOffset - currentOffset;
        return true;
      }
      currentOffset += len;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const emoji = el.getAttribute('data-emoji');
      if (emoji) {
        const len = emoji.length;
        if (currentOffset + len >= targetOffset) {
          targetNode = el;
          targetNodeOffset = -1; // Indicates caret right after this atomic element
          return true;
        }
        currentOffset += len;
      } else {
        for (let i = 0; i < el.childNodes.length; i++) {
          if (traverse(el.childNodes[i])) return true;
        }
      }
    }
    return false;
  }

  traverse(root);

  const range = document.createRange();
  const selectedNode = targetNode as Node | null;
  if (selectedNode) {
    try {
      if (targetNodeOffset === -1) {
        if (selectedNode.nextSibling && selectedNode.nextSibling.nodeType === Node.TEXT_NODE) {
          range.setStart(selectedNode.nextSibling, 0);
        } else {
          range.setStartAfter(selectedNode);
        }
      } else {
        range.setStart(selectedNode, Math.min(targetNodeOffset, (selectedNode.textContent || '').length));
      }
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch {
      // Fallback
    }
  } else {
    try {
      range.selectNodeContents(root);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch {}
  }
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
  const containerRef = useRef<HTMLDivElement>(null);
  const currentValueRef = useRef<string>(value);
  const lastEmittedValueRef = useRef<string>(value);
  const lastCaretPosRef = useRef<number>(-1);

  // Sync cursor position on click, touch, or key navigation
  const recordCaret = useCallback(() => {
    if (!containerRef.current) return;
    const pos = getCaretPosition(containerRef.current);
    if (pos >= 0) {
      lastCaretPosRef.current = pos;
    }
  }, []);

  // Imperative handle: Guaranteed Left-to-Right insertion and focus management
  useImperativeHandle(ref, () => ({
    focus: () => {
      containerRef.current?.focus();
    },
    blur: () => {
      containerRef.current?.blur();
    },
    insertEmoji: (emoji: string) => {
      const el = containerRef.current;
      if (!el) return;

      // Always read latest synchronous text to eliminate race conditions
      const currentVal = currentValueRef.current;
      let pos = lastCaretPosRef.current;

      // If caret is unset, negative, or beyond length, anchor strictly at end
      if (pos < 0 || pos > currentVal.length) {
        pos = currentVal.length;
      }

      // Natural Left-to-Right text splicing
      const newText = currentVal.slice(0, pos) + emoji + currentVal.slice(pos);
      const nextPos = pos + emoji.length;

      // Synchronously update refs before re-render
      currentValueRef.current = newText;
      lastEmittedValueRef.current = newText;
      lastCaretPosRef.current = nextPos;

      // Render fresh atomic elements and position caret immediately after inserted emoji
      renderValueToElement(el, newText);
      el.focus();
      setCaretPosition(el, nextPos);

      onChange(newText);
    },
    getElement: () => containerRef.current
  }), [onChange]);

  // Synchronize DOM with external value changes (e.g. cleared on send or changed outside)
  useEffect(() => {
    currentValueRef.current = value;
    const el = containerRef.current;
    if (!el) return;

    if (value === lastEmittedValueRef.current) {
      return;
    }

    lastEmittedValueRef.current = value;
    renderValueToElement(el, value);

    if (document.activeElement === el) {
      const pos = lastCaretPosRef.current >= 0 ? Math.min(lastCaretPosRef.current, value.length) : value.length;
      setCaretPosition(el, pos);
    }
  }, [value]);

  const handleInput = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    // Check if raw typed characters contain OS-level unicode emojis
    if (HAS_EMOJI_REGEX.test(el.textContent || '')) {
      const rawText = getCleanTextFromElement(el);
      const currentPos = getCaretPosition(el);

      currentValueRef.current = rawText;
      lastEmittedValueRef.current = rawText;
      lastCaretPosRef.current = currentPos;

      renderValueToElement(el, rawText);
      if (currentPos >= 0) {
        setCaretPosition(el, currentPos);
      }

      onChange(rawText);
      return;
    }

    const text = getCleanTextFromElement(el);
    const caretPos = getCaretPosition(el);

    currentValueRef.current = text;
    lastEmittedValueRef.current = text;
    if (caretPos >= 0) {
      lastCaretPosRef.current = caretPos;
    }

    onChange(text);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onKeyDown?.(e);
      return;
    }

    // Instant, lag-free multiple emoji Backspace / Delete
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed && containerRef.current) {
        const range = sel.getRangeAt(0);
        if (containerRef.current.contains(range.commonAncestorContainer)) {
          const preRange = range.cloneRange();
          preRange.selectNodeContents(containerRef.current);
          preRange.setEnd(range.startContainer, range.startOffset);
          const startPos = getTextFromNode(preRange.cloneContents()).length;

          range.deleteContents();
          e.preventDefault();

          const newText = getCleanTextFromElement(containerRef.current);
          currentValueRef.current = newText;
          lastEmittedValueRef.current = newText;
          lastCaretPosRef.current = startPos;

          setCaretPosition(containerRef.current, startPos);
          onChange(newText);
          return;
        }
      }
    }

    onKeyDown?.(e);
  };

  // Lag-free native Cut handler for multiple selected emojis
  const handleCut = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !containerRef.current) return;

    const range = sel.getRangeAt(0);
    const container = range.cloneContents();
    const cutText = getTextFromNode(container);

    if (cutText) {
      e.preventDefault();
      e.clipboardData.setData('text/plain', cutText);

      const preRange = range.cloneRange();
      preRange.selectNodeContents(containerRef.current);
      preRange.setEnd(range.startContainer, range.startOffset);
      const startPos = getTextFromNode(preRange.cloneContents()).length;

      range.deleteContents();

      const newText = getCleanTextFromElement(containerRef.current);
      currentValueRef.current = newText;
      lastEmittedValueRef.current = newText;
      lastCaretPosRef.current = startPos;

      setCaretPosition(containerRef.current, startPos);
      onChange(newText);
    }
  };

  const handleCopy = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const container = range.cloneContents();
    const copiedText = getTextFromNode(container);

    if (copiedText) {
      e.preventDefault();
      e.clipboardData.setData('text/plain', copiedText);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    if (!pastedText) return;

    const el = containerRef.current;
    if (!el) return;

    const currentVal = currentValueRef.current;
    let pos = lastCaretPosRef.current;
    if (pos < 0 || pos > currentVal.length) {
      pos = getCaretPosition(el);
      if (pos < 0 || pos > currentVal.length) pos = currentVal.length;
    }

    const newText = currentVal.slice(0, pos) + pastedText + currentVal.slice(pos);
    const nextPos = pos + pastedText.length;

    currentValueRef.current = newText;
    lastEmittedValueRef.current = newText;
    lastCaretPosRef.current = nextPos;

    renderValueToElement(el, newText);
    setCaretPosition(el, nextPos);

    onChange(newText);
  };

  return (
    <div className="relative flex-1 flex items-center min-w-0" dir="ltr">
      <div
        ref={containerRef}
        contentEditable={!disabled}
        role="textbox"
        aria-multiline="true"
        dir="ltr"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onKeyUp={recordCaret}
        onMouseUp={recordCaret}
        onTouchEnd={recordCaret}
        onSelect={recordCaret}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onFocus={() => {
          recordCaret();
          onFocus?.();
        }}
        data-placeholder={placeholder}
        className={`w-full max-h-28 overflow-y-auto outline-none break-words whitespace-pre-wrap text-left ${className}`}
        style={{
          wordBreak: 'break-word',
          minHeight: '22px',
          direction: 'ltr',
          textAlign: 'left',
          unicodeBidi: 'plaintext'
        }}
      />
      {/* Placeholder display when empty */}
      {!value && (
        <span 
          onClick={() => containerRef.current?.focus()}
          className="absolute left-2 text-sm text-current opacity-40 pointer-events-none select-none truncate"
          dir="ltr"
        >
          {placeholder}
        </span>
      )}
    </div>
  );
});

AppleComposerInput.displayName = 'AppleComposerInput';
