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

// Inline token parser for rich formatting (Bold, Italic, Code, Links, Badges)
export const renderInlineFormatting = (text: string, isDark: boolean = true): React.ReactNode => {
  if (!text) return null;

  // Regex tokenizer covering:
  // 1. Double Asterisk Bold: **text** or ** text **
  // 2. Double Underscore Bold: __text__
  // 3. Single Asterisk Bold / Loose Bold: *text* or * text * (common typo support)
  // 4. Inline Code: `code`
  // 5. Markdown Links: [label](url)
  // 6. Badges: [GET], [POST], [PUT], [DELETE], [REQUIRED], [OPTIONAL], [SANDBOX], [LIVE]
  const pattern = /(\*\*[^*]+\*\*|\*[\s\S]+?\*|__[^_]+__|`[^`]+`|\[([^\]]+)\]\((https?:\/\/[^\)]+)\)|\[(GET|POST|PUT|DELETE|PATCH|GUIDE|REQUIRED|OPTIONAL|SANDBOX|LIVE|ENTERPRISE|PRO|FREE)\])/g;

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
        <strong key={match.index} className="font-extrabold text-white">
          {inner}
        </strong>
      );
    } else if (token.startsWith('__') && token.endsWith('__')) {
      // Bold (Double Underscore)
      const inner = token.slice(2, -2).trim();
      parts.push(
        <strong key={match.index} className="font-extrabold text-white">
          {inner}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      // Inline Code
      const inner = token.slice(1, -1);
      parts.push(
        <code
          key={match.index}
          className="font-mono text-[11px] md:text-xs font-semibold px-1.5 py-0.5 rounded-md bg-[#161f33] text-indigo-200 border border-[#29385c] mx-0.5"
        >
          {inner}
        </code>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      // Link [text](url)
      const label = match[2];
      const url = match[3];
      parts.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 font-semibold text-indigo-400 hover:underline hover:text-indigo-300"
        >
          <span>{label}</span>
          <ArrowUpRight className="w-3 h-3 inline-block ml-0.5" />
        </a>
      );
    } else if (token.startsWith('[') && token.endsWith(']')) {
      // Badge [METHOD] / [STATUS] - Aesthetic, Muted, Mature Luxury Tones (Zero Neon)
      const badgeText = token.slice(1, -1);
      let badgeStyle = 'bg-[#151a24] text-slate-300 border-[#263145]';
      if (badgeText === 'GET') badgeStyle = 'bg-[#0f1d2e] text-[#93c5fd] border-[#1e3a5f]';
      if (badgeText === 'POST') badgeStyle = 'bg-[#0e2318] text-[#86efac] border-[#1b4330]';
      if (badgeText === 'PUT') badgeStyle = 'bg-[#241a0d] text-[#fde047] border-[#483318]';
      if (badgeText === 'DELETE') badgeStyle = 'bg-[#241014] text-[#fca5a5] border-[#481f26]';
      if (badgeText === 'GUIDE') badgeStyle = 'bg-[#19142b] text-[#c4b5fd] border-[#352a5c]';
      if (badgeText === 'REQUIRED') badgeStyle = 'bg-[#241014] text-[#fca5a5] border-[#481f26]';
      if (badgeText === 'OPTIONAL') badgeStyle = 'bg-[#161a24] text-slate-300 border-[#263145]';
      if (badgeText === 'LIVE' || badgeText === 'PRO' || badgeText === 'ENTERPRISE') badgeStyle = 'bg-[#17142e] text-[#c4b5fd] border-[#372b5c]';
      if (badgeText === 'SANDBOX' || badgeText === 'FREE') badgeStyle = 'bg-[#101d24] text-[#7dd3fc] border-[#1f3847]';
      
      parts.push(
        <span
          key={match.index}
          className={`inline-block font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeStyle} mx-1 align-middle`}
        >
          {badgeText}
        </span>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      // Single Asterisk Bold / Loose bold (e.g., *Bold*, * Bold *)
      const inner = token.slice(1, -1).trim();
      parts.push(
        <strong key={match.index} className="font-extrabold text-white">
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

// Component for rendering copyable syntax code blocks
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
    <div className="relative my-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 text-xs font-mono text-slate-400">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-[11px] font-semibold cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-xs leading-relaxed text-slate-200">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

// Component for rendering Markdown Tables
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
    <div className="my-5 overflow-hidden rounded-xl border border-slate-200 dark:border-[#1e2638] bg-white dark:bg-[#0a0d14] shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-[#121824] border-b border-slate-200 dark:border-[#1e2638] text-slate-800 dark:text-white">
              {headers.map((h, idx) => (
                <th key={idx} className="p-3.5 font-bold uppercase tracking-wider text-[11px] text-slate-900 dark:text-white">
                  {renderInlineFormatting(h, isDark)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1e2638] text-slate-700 dark:text-slate-100">
            {dataRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-[#111724] transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-3.5 leading-relaxed align-top text-slate-700 dark:text-slate-100">
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
    <div className={`space-y-4 text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-700'} ${className}`}>
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
              className="my-6 border-0 border-t border-slate-200 dark:border-[#1e2638]" 
            />
          );
        }

        // 4. Headings
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={bIdx} className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-6 mb-2">
              {renderInlineFormatting(trimmed.replace('# ', ''), isDark)}
            </h1>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={bIdx} className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-6 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-indigo-500 inline-block" />
              <span>{renderInlineFormatting(trimmed.replace('## ', ''), isDark)}</span>
            </h2>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={bIdx} className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight mt-5 mb-1.5 flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{renderInlineFormatting(trimmed.replace('### ', ''), isDark)}</span>
            </h3>
          );
        }
        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={bIdx} className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 mt-4 mb-1">
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
              bg: 'bg-indigo-50/70 dark:bg-[#121629] border-indigo-200 dark:border-[#263158] text-indigo-950 dark:text-slate-100',
              icon: <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            },
            tip: {
              bg: 'bg-emerald-50/70 dark:bg-[#0e211a] border-emerald-200 dark:border-[#1d4233] text-emerald-950 dark:text-slate-100',
              icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            },
            warning: {
              bg: 'bg-amber-50/70 dark:bg-[#211b0f] border-amber-200 dark:border-[#43351d] text-amber-950 dark:text-slate-100',
              icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            },
            alert: {
              bg: 'bg-rose-50/70 dark:bg-[#241116] border-rose-200 dark:border-[#461e27] text-rose-950 dark:text-slate-100',
              icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            }
          }[calloutType];

          return (
            <div 
              key={bIdx} 
              className={`my-3 p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${styleConfig.bg}`}
            >
              {styleConfig.icon}
              <div className="flex-1 text-slate-100">
                {renderInlineFormatting(stripped, isDark)}
              </div>
            </div>
          );
        }

        // 6. Unordered Bullet Lists (- item or * item)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const listItems = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
          return (
            <ul key={bIdx} className="my-2.5 space-y-2 pl-1">
              {listItems.map((li, liIdx) => {
                const cleanLi = li.replace(/^[-*]\s+/, '');
                return (
                  <li key={liIdx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                    <span className="flex-1 leading-relaxed text-slate-100">
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
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-[#161e2e] text-slate-700 dark:text-slate-100 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-slate-200 dark:border-[#27354f]">
                      {num}
                    </span>
                    <span className="flex-1 leading-relaxed text-slate-100">
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
          <p key={bIdx} className="leading-relaxed text-slate-100">
            {renderInlineFormatting(trimmed, isDark)}
          </p>
        );
      })}
    </div>
  );
};
