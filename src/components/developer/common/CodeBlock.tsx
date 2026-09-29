import React, { useMemo } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  themeMode?: 'light' | 'dark';
  maxHeight?: string;
  className?: string;
  showLineNumbers?: boolean;
}

interface Token {
  text: string;
  type: 'keyword' | 'string' | 'comment' | 'number' | 'function' | 'type' | 'variable' | 'env' | 'tag' | 'operator' | 'plain';
}

/**
 * High-performance, zero-dependency multi-language syntax tokenizer.
 * Formats tokens with modern, OpenRouter-style syntax highlighting.
 */
function tokenizeCode(code: string, language: string = 'typescript'): Token[] {
  const tokens: Token[] = [];
  
  // High-level regex pattern matching code features
  const tokenRegex = new RegExp(
    [
      // Comments (//..., /*...*/, #..., <!--...-->)
      '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/|#[^\\n]*|<!--[\\s\\S]*?-->)',
      // Strings ("...", '...', `...`)
      '("(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'|`[\\s\\S]*?`)',
      // Env variables and placeholders ($ZENOA_API_KEY, YOUR_ZENOA_API_KEY, process.env.ZENOA_API_KEY, os.getenv)
      '(\\$[A-Z0-9_]+|YOUR_[A-Z0-9_]+|ZENOA_[A-Z0-9_]+|process\\.env\\.[A-Z0-9_]+)',
      // Numbers and Booleans
      '\\b(\\d+(?:\\.\\d+)?|true|false|null|nil|undefined)\\b',
      // Keywords
      '\\b(import|export|from|default|class|interface|type|extends|implements|function|def|func|package|async|await|const|let|var|return|new|this|public|private|protected|static|readonly|if|else|switch|case|try|catch|finally|throw|for|while|struct|map|chan|use|namespace|echo)\\b',
      // HTTP Methods and cURL flags
      '\\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\\b|(-[XHd]|--header|--data|--request)\\b',
      // Common types and classes
      '\\b(string|number|boolean|any|void|Record|Array|Promise|Response|Request|HttpClient|HttpRequest|HttpResponse|URI|Zenoa[A-Za-z0-9_]*)\\b',
      // Function calls (word followed by open paren)
      '\\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\\s*\\()',
      // HTML/XML tags
      '(<\\/?[a-zA-Z0-9_-]+(?:\\s+[^>]*?)?\\/?>)',
      // Operators and punctuation
      '([=+\\-*\\/&|!<>?:;.,{}()\\[\\]\\\\])',
      // Whitespace and other characters
      '([^\\s]+|\\s+)'
    ].join('|'),
    'g'
  );

  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(code)) !== null) {
    const [
      full,
      comment,
      str,
      envVar,
      numBool,
      keyword,
      httpOrFlag,
      typeName,
      funcName,
      htmlTag,
      operator
    ] = match;

    if (comment) {
      tokens.push({ text: comment, type: 'comment' });
    } else if (envVar) {
      tokens.push({ text: envVar, type: 'env' });
    } else if (str) {
      tokens.push({ text: str, type: 'string' });
    } else if (numBool) {
      tokens.push({ text: numBool, type: 'number' });
    } else if (keyword) {
      tokens.push({ text: keyword, type: 'keyword' });
    } else if (httpOrFlag) {
      tokens.push({ text: httpOrFlag, type: 'variable' });
    } else if (typeName) {
      tokens.push({ text: typeName, type: 'type' });
    } else if (funcName) {
      tokens.push({ text: funcName, type: 'function' });
    } else if (htmlTag) {
      tokens.push({ text: htmlTag, type: 'tag' });
    } else if (operator) {
      tokens.push({ text: operator, type: 'operator' });
    } else {
      tokens.push({ text: full, type: 'plain' });
    }
  }

  return tokens;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'typescript',
  themeMode = 'light',
  maxHeight = '500px',
  className = '',
  showLineNumbers = true
}) => {
  const isDark = themeMode === 'dark';
  const tokens = useMemo(() => tokenizeCode(code, language), [code, language]);

  // Color tokens mapping (OpenRouter / Linear / Stripe high-craft palette)
  const getTokenClass = (type: Token['type']): string => {
    switch (type) {
      case 'comment':
        return isDark ? 'text-[#64748b] italic' : 'text-[#8292a2] italic';
      case 'keyword':
        return isDark ? 'text-[#c084fc] font-semibold' : 'text-[#7c3aed] font-semibold';
      case 'string':
        return isDark ? 'text-[#34d399]' : 'text-[#059669]';
      case 'function':
        return isDark ? 'text-[#60a5fa]' : 'text-[#2563eb]';
      case 'type':
        return isDark ? 'text-[#22d3ee]' : 'text-[#0891b2] font-medium';
      case 'env':
        return isDark ? 'text-[#fbbf24] font-semibold bg-amber-500/10 px-0.5 rounded' : 'text-[#b45309] font-semibold bg-amber-50 px-0.5 rounded border border-amber-200/50';
      case 'number':
        return isDark ? 'text-[#fb923c]' : 'text-[#ea580c]';
      case 'tag':
        return isDark ? 'text-[#f87171]' : 'text-[#dc2626]';
      case 'variable':
        return isDark ? 'text-[#38bdf8] font-medium' : 'text-[#0284c7] font-medium';
      case 'operator':
        return isDark ? 'text-[#94a3b8]' : 'text-[#475569]';
      case 'plain':
      default:
        return isDark ? 'text-[#e2e8f0]' : 'text-[#1e293b]';
    }
  };

  const lines = code.split('\n');

  return (
    <div
      className={`relative font-mono text-xs leading-relaxed overflow-x-auto transition-colors select-text ${
        isDark 
          ? 'bg-[#0c1024] text-[#e2e8f0] border-[#273951]' 
          : 'bg-white text-[#1e293b] border-[#e2e8f0]'
      } ${className}`}
      style={{ maxHeight }}
    >
      <div className="flex">
        {showLineNumbers && (
          <div
            className={`py-4 pl-3 pr-3 select-none text-right font-mono text-[11px] border-r shrink-0 ${
              isDark 
                ? 'bg-[#080c1b] border-[#273951] text-[#475569]' 
                : 'bg-[#f8fafc] border-[#e2e8f0] text-[#94a3b8]'
            }`}
            aria-hidden="true"
          >
            {lines.map((_, i) => (
              <div key={i} className="leading-relaxed">
                {i + 1}
              </div>
            ))}
          </div>
        )}

        <pre className="py-4 px-4 flex-1 overflow-x-auto font-mono whitespace-pre m-0">
          <code>
            {tokens.map((token, index) => (
              <span key={index} className={getTokenClass(token.type)}>
                {token.text}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};
