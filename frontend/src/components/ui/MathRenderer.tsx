import { useEffect, useRef, memo } from 'react';
import renderMathInElement from 'katex/contrib/auto-render';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  html: string;
  className?: string;
}

/**
 * Renders rich-text HTML content that may contain KaTeX math expressions.
 * Supports both inline ($...$) and display-block ($$...$$) notation.
 *
 * Wrapped with React.memo to prevent unnecessary re-renders:
 * If the parent re-renders (e.g. due to answer state changes), this component
 * will NOT re-render unless html/className actually change. Without memo,
 * dangerouslySetInnerHTML would overwrite the KaTeX-rendered DOM with raw LaTeX
 * on every parent re-render, reverting the rendered math back to plain text.
 */
export const MathRenderer = memo(({ html, className = '' }: MathRendererProps) => {
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
});
