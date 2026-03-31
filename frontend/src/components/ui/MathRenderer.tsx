import { useEffect, useRef } from 'react';
import renderMathInElement from 'katex/contrib/auto-render';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  html: string;
  className?: string;
}

/**
 * Renders rich-text HTML content that may contain KaTeX math expressions.
 * Supports both inline ($...$) and display-block ($$...$$) notation.
 */
export const MathRenderer = ({ html, className = '' }: MathRendererProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      renderMathInElement(ref.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ],
        throwOnError: false,
        errorColor: '#e74c3c',
      });
    }
  }, [html]);

  return (
    <div
      ref={ref}
      className={`prose max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
