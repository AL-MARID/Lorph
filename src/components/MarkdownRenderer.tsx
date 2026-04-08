import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none break-words text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ node, href, children, ...props }: any) {
            if (!href) return <a {...props}>{children}</a>;
            
            // Check if it's a YouTube video link
            if (href.includes('youtube.com/watch') || href.includes('youtu.be/')) {
              let videoId = '';
              try {
                const url = new URL(href);
                if (href.includes('youtu.be/')) {
                  videoId = url.pathname.slice(1);
                } else {
                  videoId = url.searchParams.get('v') || '';
                }
              } catch (e) {}

              if (videoId) {
                return (
                  <span className="block my-4 rounded-xl overflow-hidden border border-border shadow-md aspect-video">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </span>
                );
              }
            }

            // Check if it's a citation or has a text fragment
            const childrenText = React.Children.toArray(children).join('');
            const isCitation = href.includes('#:~:text=') || /^\[?\d+\]?$/.test(childrenText);
            
            if (isCitation) {
              let domain = '';
              try {
                domain = new URL(href).hostname.replace(/^www\./, '');
              } catch (e) {}
              
              return (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 bg-secondary/50 hover:bg-secondary border border-border rounded-md text-xs font-medium text-foreground transition-colors no-underline align-middle"
                  title={href}
                  {...props}
                >
                  {domain && (
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`} 
                      alt="" 
                      className="w-3 h-3 rounded-sm"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span className="truncate max-w-[150px]">{childrenText}</span>
                </a>
              );
            }
            
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" {...props}>
                {children}
              </a>
            );
          },
          table({ children, ...props }: any) {
            return (
              <div className="overflow-x-auto my-6">
                <table className="w-full text-sm text-left border-collapse" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          thead({ children, ...props }: any) {
            return <thead className="bg-muted/50 text-muted-foreground uppercase" {...props}>{children}</thead>;
          },
          tbody({ children, ...props }: any) {
            return <tbody className="divide-y divide-border" {...props}>{children}</tbody>;
          },
          tr({ children, ...props }: any) {
            return <tr className="hover:bg-muted/30 transition-colors" {...props}>{children}</tr>;
          },
          th({ children, ...props }: any) {
            return <th className="px-4 py-3 font-medium border border-border bg-transparent" {...props}>{children}</th>;
          },
          td({ children, ...props }: any) {
            return <td className="px-4 py-3 border border-border bg-transparent" {...props}>{children}</td>;
          },
          hr({ node, ...props }: any) {
            return <hr className="my-6 border-t border-border/30" {...props} />;
          },
          img({ node, src, alt, ...props }: any) {
            return (
              <img 
                src={src} 
                alt={alt || ''} 
                className="rounded-xl shadow-md max-h-[400px] object-cover my-4 border border-border" 
                referrerPolicy="no-referrer"
                {...props} 
              />
            );
          },
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            
            if (!inline && match) {
              return (
                <CodeBlock language={match[1]} value={codeString} />
              );
            }
            return (
              <code className={`${className} bg-muted text-foreground px-1.5 py-0.5 rounded text-sm`} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const CodeBlock = ({ language, value }: { language: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-border bg-card shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent', fontSize: '0.9rem' }}
        wrapLongLines={true}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

