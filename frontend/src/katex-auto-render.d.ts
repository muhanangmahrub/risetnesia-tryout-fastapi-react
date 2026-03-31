declare module 'katex/contrib/auto-render' {
  interface Delimiter {
    left: string;
    right: string;
    display: boolean;
  }
  interface AutoRenderOptions {
    delimiters?: Delimiter[];
    throwOnError?: boolean;
    errorColor?: string;
    ignoredTags?: string[];
    ignoredClasses?: string[];
  }
  function renderMathInElement(elem: HTMLElement, options?: AutoRenderOptions): void;
  export default renderMathInElement;
}
