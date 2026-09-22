import React, { useState } from 'react';
import { 
  Copy, Check, ExternalLink, Info, AlertTriangle, 
  CheckCircle2, Sparkles, AlertCircle, Hash, ArrowUpRight 
} from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  isDark?: boolean;
  className?: string;
}

/**
 * Robust, high-contrast inline Markdown tokenizer.
 * Correctly parses:
 * - Double asterisk bold: **text**
 * - Single asterisk bold / loose bold: *text*, * text *, * Bold * (Example)
 * - Double underscore bold: __text__
 * - Single underscore italic: _text_
 * - Backtick inline code: `code`
 * - Strikethrough: ~~text~~
 * - Highlight: ==text==
 * - Links: [label](url)
 * - Badges: [GET], [POST], [PUT], [DELETE], [PATCH], [GUIDE], [OAUTH], [REQUIRED], [OPTIONAL], etc.
 * Uses high-contrast pure white text for optimal readability on Charcoal Black surfaces.
 */
export const renderInlineFormatting = (text: string, isDark: boolean = true): React.ReactNode => {
  if (!text) return null;

  // Regex breakdown:
  // 1. Double Asterisk: \*\*([^*\n]+?)\*\*
  // 2. Double Underscore: __([^_]+?)__
  // 3. Backtick Code: `([^`\n]+?)`
  // 4. Strikethrough: ~~([^~\n]+?)~~
  // 5. Highlight: ==([^=\n]+?)==
  // 6. Links: \[([^\]]+)\]\((https?:\/\/[^\)]+)\)
  // 7. Method & Status Badges: \[(GET|POST|PUT|DELETE|PATCH|GUIDE|OAUTH|WEBHOOK|REQUIRED|OPTIONAL|SANDBOX|LIVE|ENTERPRISE|PRO|FREE)\]
  // 8. Single Asterisk Bold / Loose Bold: \*([^*\n]+?)\* (supports *Bold*, * Bold *, * Bold * (Example))
  // 9. Single Underscore Italic: (?<=\s|^)_([^_]+?)_(?=\s|$|[.,:;!?])
  const pattern = /(\*\*[^*\n]+?\*\*|__[^_\n]+?__|`[^`\n]+?`|~~[^~\n]+?~~|==[^=\n]+?==|\[([^\]]+)\]\((https?:\/\/[^\)]+)\)|\[(GET|POST|PUT|DELETE|PATCH|GUIDE|OAUTH|WEBHOOK|REQUIRED|OPTIONAL|SANDBOX|LIVE|ENTERPRISE|PRO|FREE)\]|\*[^*\n]+?\*)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith('**') && token.endsWith('**')) {
      // Bold (Double Asterisk)
      const inner = token.slice(2, -2).trim();
      parts.push(
        <strong key={`b-${match.index}`} className="font-extrabold text-white tracking-normal">
          {inner}
        </strong>
      );
    } else if (token.startsWith('__') && token.endsWith('__')) {
      // Bold (Double Underscore)
      const inner = token.slice(2, -2).trim();
      parts.push(
        <strong key={`u-${match.index}`} className="font-extrabold text-white tracking-normal">
          {inner}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      // Inline Code
      const inner = token.slice(1, -1);
      parts.push(
        <code
          key={`c-${match.index}`}
          className="font-mono text-[11px] md:text-xs font-semibold px-2 py-0.5 rounded-md bg-[#191b22] text-[#93c5fd] border border-[#2a3447] mx-0.5"
        >
          {inner}
        </code>
      );
    } else if (token.startsWith('~~') && token.endsWith('~~')) {
      // Strikethrough
      const inner = token.slice(2, -2).trim();
      parts.push(
        <del key={`del-${match.index}`} className="line-through text-[#94a3b8]">
          {inner}
        </del>
      );
    } else if (token.startsWith('==') && token.endsWith('==')) {
      // Highlight
      const inner = token.slice(2, -2).trim();
      parts.push(
        <mark key={`m-${match.index}`} className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
          {inner}
        </mark>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      // Markdown Link [text](url)
      const label = match[2];
      const url = match[3];
      parts.push(
        <a
          key={`l-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 font-semibold text-[#818cf8] hover:text-[#a5b4fc] underline underline-offset-2 transition-colors"
        >
          <span>{label}</span>
          <ArrowUpRight className="w-3 h-3 inline-block ml-0.5 opacity-80" />
        </a>
      );
    } else if (token.startsWith('[') && token.endsWith(']')) {
      // Badge [METHOD] / [STATUS] - Aesthetic, Muted Luxury Tones (Zero Neon)
      const badgeText = token.slice(1, -1);
      let badgeStyle = 'bg-[#181a22] text-[#cbd5e1] border-[#293042]';
      if (badgeText === 'GET') badgeStyle = 'bg-[#142032] text-[#93c5fd] border-[#223554]';
      if (badgeText === 'POST') badgeStyle = 'bg-[#12261e] text-[#86efac] border-[#1f4535]';
      if (badgeText === 'PUT') badgeStyle = 'bg-[#281e12] text-[#fcd34d] border-[#4a361e]';
      if (badgeText === 'DELETE') badgeStyle = 'bg-[#291319] text-[#fca5a5] border-[#4e222d]';
      if (badgeText === 'PATCH') badgeStyle = 'bg-[#112428] text-[#5eead4] border-[#1d4348]';
      if (badgeText === 'GUIDE') badgeStyle = 'bg-[#1c1935] text-[#c7d2fe] border-[#362f62]';
      if (badgeText === 'OAUTH') badgeStyle = 'bg-[#241738] text-[#e9d5ff] border-[#462c6d]';
      if (badgeText === 'WEBHOOK') badgeStyle = 'bg-[#132332] text-[#bae6fd] border-[#203c54]';
      if (badgeText === 'REQUIRED') badgeStyle = 'bg-[#271418] text-[#fda4af] border-[#4a2027]';
      if (badgeText === 'OPTIONAL') badgeStyle = 'bg-[#181d28] text-[#cbd5e1] border-[#293245]';
      if (badgeText === 'LIVE' || badgeText === 'PRO' || badgeText === 'ENTERPRISE') badgeStyle = 'bg-[#1c1935] text-[#c7d2fe] border-[#362f62]';
      if (badgeText === 'SANDBOX' || badgeText === 'FREE') badgeStyle = 'bg-[#132332] text-[#7dd3fc] border-[#203c54]';
      
      parts.push(
        <span
          key={`badge-${match.index}`}
          className={`inline-block font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeStyle} mx-1 align-middle`}
        >
          {badgeText}
        </span>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      // Single Asterisk Bold / Loose bold (handles *Bold*, * Bold *, * Bold * (Example))
      const inner = token.slice(1, -1).trim();
      parts.push(
        <strong key={`sb-${match.index}`} className="font-extrabold text-white tracking-normal">
          {inner}
        </strong>
      );
    } else {
      parts.push(token);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
};

// Component for rendering copyable syntax code blocks on Charcoal Black
const CodeBlock: React.FC<{ code: string; language?: string; isDark?: boolean }> = ({ 
  code, 
  language = 'bash', 
  isDark = true 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl border border-[#262b3a] bg-[#0e1015] text-[#f1f5f9] overflow-hidden shadow-md">
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#141720] border-b border-[#242938] text-xs font-mono text-[#94a3b8]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#cbd5e1]">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1a1f2c] hover:bg-[#232a3b] text-[#cbd5e1] hover:text-white transition-all text-[11px] font-semibold cursor-pointer border border-[#2b3345]"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#86efac]" />
              <span className="text-[#86efac]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-[#94a3b8]" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-xs leading-relaxed text-[#f1f5f9]">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

// Component for rendering Markdown Tables on Charcoal Black
const MarkdownTable: React.FC<{ rawTable: string; isDark?: boolean }> = ({ rawTable, isDark = true }) => {
  const lines = rawTable.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const parseRow = (line: string) => {
    return line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(c => c.trim());
  };

  const headers = parseRow(lines[0]);
  // Filter out separator row (e.g., |---|---|)
  const dataRows = lines.slice(1).filter(l => !l.replace(/[-|:\s]/g, '').length ? false : true).map(parseRow);

  return (
    <div className="my-5 overflow-hidden rounded-xl border border-[#262b3a] bg-[#12141a] shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#171a22] border-b border-[#262b3a] text-white">
              {headers.map((h, idx) => (
                <th key={idx} className="p-3.5 font-bold uppercase tracking-wider text-[11px] text-white">
                  {renderInlineFormatting(h, isDark)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222736] text-[#f1f5f9]">
            {dataRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-[#181b24] transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-3.5 leading-relaxed align-top text-[#f1f5f9]">
                    {renderInlineFormatting(cell, isDark)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  isDark = true,
  className = '' 
}) => {
  if (!content) return null;

  // Split by double newlines or block structures
  const rawBlocks = content.split('\n\n');

  return (
    <div className={`space-y-4 text-xs sm:text-sm leading-relaxed text-[#f1f5f9] ${className}`}>
      {rawBlocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. Code Blocks (```lang ... ```)
        if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
          const lines = trimmed.split('\n');
          const firstLine = lines[0].replace('```', '').trim();
          const language = firstLine || 'bash';
          const code = lines.slice(1, -1).join('\n');
          return <CodeBlock key={bIdx} code={code} language={language} isDark={isDark} />;
        }

        // 2. Markdown Tables (| Col 1 | Col 2 |)
        if (trimmed.startsWith('|') && trimmed.includes('\n|')) {
          return <MarkdownTable key={bIdx} rawTable={trimmed} isDark={isDark} />;
        }

        // 3. Horizontal Rule
        if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
          return (
            <hr 
              key={bIdx} 
              className="my-6 border-0 border-t border-[#262b3a]" 
            />
          );
        }

        // 4. Headings
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={bIdx} className="text-xl sm:text-2xl font-black text-white tracking-tight mt-6 mb-2">
              {renderInlineFormatting(trimmed.replace('# ', ''), isDark)}
            </h1>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={bIdx} className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-6 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-[#6366f1] inline-block" />
              <span>{renderInlineFormatting(trimmed.replace('## ', ''), isDark)}</span>
            </h2>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={bIdx} className="text-sm sm:text-base font-bold text-white tracking-tight mt-5 mb-1.5 flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-[#818cf8] shrink-0" />
              <span>{renderInlineFormatting(trimmed.replace('### ', ''), isDark)}</span>
            </h3>
          );
        }
        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={bIdx} className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white mt-4 mb-1">
              {renderInlineFormatting(trimmed.replace('#### ', ''), isDark)}
            </h4>
          );
        }

        // 5. Callouts / Blockquotes
        if (trimmed.startsWith('> ')) {
          const cleanText = trimmed.replace(/^>\s*/gm, '');
          let calloutType: 'info' | 'tip' | 'warning' | 'alert' = 'info';

          if (cleanText.includes('[!WARNING]') || cleanText.toLowerCase().startsWith('warning:')) {
            calloutType = 'warning';
          } else if (cleanText.includes('[!TIP]') || cleanText.toLowerCase().startsWith('tip:')) {
            calloutType = 'tip';
          } else if (cleanText.includes('[!IMPORTANT]') || cleanText.includes('[!DANGER]') || cleanText.toLowerCase().startsWith('important:') || cleanText.toLowerCase().startsWith('alert:')) {
            calloutType = 'alert';
          }

          const stripped = cleanText
            .replace(/\[!(NOTE|TIP|WARNING|IMPORTANT|DANGER)\]\s*/i, '')
            .replace(/^(Note|Tip|Warning|Important|Alert):\s*/i, '');

          const styleConfig = {
            info: {
              bg: 'bg-[#141824] border-[#28324a] text-[#f1f5f9]',
              icon: <Info className="w-4 h-4 text-[#818cf8] shrink-0 mt-0.5" />
            },
            tip: {
              bg: 'bg-[#11221b] border-[#204234] text-[#f1f5f9]',
              icon: <CheckCircle2 className="w-4 h-4 text-[#86efac] shrink-0 mt-0.5" />
            },
            warning: {
              bg: 'bg-[#241c12] border-[#483620] text-[#f1f5f9]',
              icon: <AlertTriangle className="w-4 h-4 text-[#fcd34d] shrink-0 mt-0.5" />
            },
            alert: {
              bg: 'bg-[#271419] border-[#4e222c] text-[#f1f5f9]',
              icon: <AlertCircle className="w-4 h-4 text-[#fca5a5] shrink-0 mt-0.5" />
            }
          }[calloutType];

          return (
            <div 
              key={bIdx} 
              className={`my-3 p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${styleConfig.bg}`}
            >
              {styleConfig.icon}
              <div className="flex-1 text-[#f1f5f9]">
                {renderInlineFormatting(stripped, isDark)}
              </div>
            </div>
          );
        }

        // 6. Unordered Bullet Lists
        // Only treat as list if starting with '- ' or '* ' where the line does NOT immediately close a bold match like '* Bold *'
        const isBulletList = trimmed.startsWith('- ') || (
          trimmed.startsWith('* ') && 
          !/^\*\s+[^*]+?\s*\*(\s|$)/.test(trimmed)
        );

        if (isBulletList) {
          const listItems = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
          return (
            <ul key={bIdx} className="my-2.5 space-y-2 pl-1">
              {listItems.map((li, liIdx) => {
                const cleanLi = li.replace(/^[-*]\s+/, '');
                return (
                  <li key={liIdx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8] mt-2 shrink-0" />
                    <span className="flex-1 leading-relaxed text-[#f1f5f9]">
                      {renderInlineFormatting(cleanLi, isDark)}
                    </span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // 7. Numbered Ordered Lists (1. item)
        if (/^\d+\.\s/.test(trimmed)) {
          const listItems = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
          return (
            <ol key={bIdx} className="my-2.5 space-y-2 pl-1">
              {listItems.map((li, liIdx) => {
                const match = li.match(/^(\d+)\.\s+(.*)/);
                const num = match ? match[1] : `${liIdx + 1}`;
                const text = match ? match[2] : li;
                return (
                  <li key={liIdx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#181b24] text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-[#2d3548]">
                      {num}
                    </span>
                    <span className="flex-1 leading-relaxed text-[#f1f5f9]">
                      {renderInlineFormatting(text, isDark)}
                    </span>
                  </li>
                );
              })}
            </ol>
          );
        }

        // 8. Standard Paragraph
        return (
          <p key={bIdx} className="leading-relaxed text-[#f1f5f9]">
            {renderInlineFormatting(trimmed, isDark)}
          </p>
        );
      })}
    </div>
  );
};
