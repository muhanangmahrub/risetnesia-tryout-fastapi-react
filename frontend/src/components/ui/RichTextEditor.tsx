import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Mathematics from '@tiptap/extension-mathematics';
import { useEffect, useState } from 'react';
import 'katex/dist/katex.min.css';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
}

// Math formula input dialog
const MathDialog = ({ onInsert, onClose }: { onInsert: (latex: string, isBlock: boolean) => void; onClose: () => void }) => {
  const [latex, setLatex] = useState('');
  const [isBlock, setIsBlock] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 mb-1">Masukkan Rumus Matematika</h3>
        <p className="text-sm text-slate-500 mb-4">Gunakan sintaks LaTeX. Contoh: <code className="bg-slate-100 px-1 rounded">x = \frac{"{-b \\pm \\sqrt{b^2 - 4ac}}"}{"{2a}"}</code></p>
        <textarea
          autoFocus
          className="w-full border border-slate-300 rounded-lg p-3 font-mono text-sm h-24 resize-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
          placeholder="Contoh: \frac{a}{b} atau A = \sqrt{2} + 5"
          value={latex}
          onChange={e => setLatex(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onInsert(latex, isBlock); }}
        />
        <div className="mt-3 mb-4">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={isBlock} onChange={e => setIsBlock(e.target.checked)} className="rounded" />
            Tampilkan sebagai blok terpisah (display mode)
          </label>
        </div>
        {/* Quick reference */}
        <div className="bg-slate-50 rounded-lg p-3 mb-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-600 mb-2">Sintaks Umum:</p>
          <div className="grid grid-cols-2 gap-1">
            {[
              ['Pecahan', '\\frac{a}{b}'],
              ['Akar', '\\sqrt{x}'],
              ['Pangkat', 'x^{2}'],
              ['Subskrip', 'x_{i}'],
              ['Sigma', '\\sum_{i=1}^{n}'],
              ['Integral', '\\int_{a}^{b}'],
              ['Pi (π)', '\\pi'],
              ['±', '\\pm'],
            ].map(([label, syntax]) => (
              <button key={label} type="button"
                onClick={() => setLatex(prev => prev + syntax)}
                className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors text-left">
                <span className="text-slate-400 w-16">{label}:</span>
                <code className="text-brand-600">{syntax}</code>
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Batal</button>
          <button type="button" onClick={() => onInsert(latex, isBlock)} disabled={!latex.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Sisipkan Rumus
          </button>
        </div>
      </div>
    </div>
  );
};

const MenuBar = ({ editor }: { editor: ReturnType<typeof useEditor> }) => {
  const [showMathDialog, setShowMathDialog] = useState(false);
  if (!editor) return null;

  const btn = (active: boolean, action: () => void, label: string, title?: string) => (
    <button
      type="button"
      onClick={action}
      title={title || label}
      className={`px-2 py-1 text-sm rounded hover:bg-slate-200 transition-colors font-medium ${
        active ? 'bg-slate-200 text-brand-700' : 'text-slate-600'
      }`}
    >
      {label}
    </button>
  );

  const handleInsertMath = (latex: string, isBlock: boolean) => {
    if (!latex.trim()) return;
    if (isBlock) {
      editor.chain().focus().insertContent(`<p>$$${latex}$$</p>`).run();
    } else {
      editor.chain().focus().insertContent(`$${latex}$`).run();
    }
    setShowMathDialog(false);
  };

  return (
    <>
      <div className="flex flex-wrap gap-1 p-2 border-b border-slate-200 bg-slate-50 rounded-t-lg">
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'B', 'Bold')}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'I', 'Italic')}
        {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'U', 'Underline')}
        <div className="w-px bg-slate-300 mx-1" />
        {btn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'H1')}
        {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2')}
        {btn(editor.isActive('paragraph'), () => editor.chain().focus().setParagraph().run(), 'P')}
        <div className="w-px bg-slate-300 mx-1" />
        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), '• List', 'Bullet List')}
        {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), '1. List', 'Ordered List')}
        <div className="w-px bg-slate-300 mx-1" />
        {btn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), '←', 'Align Left')}
        {btn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), '↔', 'Align Center')}
        {btn(editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), '→', 'Align Right')}
        <div className="w-px bg-slate-300 mx-1" />
        {/* Math formula button */}
        <button
          type="button"
          title="Sisipkan Rumus Matematika (LaTeX)"
          onClick={() => setShowMathDialog(true)}
          className="px-2 py-1 text-sm rounded hover:bg-amber-100 transition-colors font-medium text-amber-700 border border-amber-200 bg-amber-50"
        >
          ∑ Rumus
        </button>
        <div className="w-px bg-slate-300 mx-1" />
        {btn(false, () => editor.chain().focus().undo().run(), '↺', 'Undo')}
        {btn(false, () => editor.chain().focus().redo().run(), '↻', 'Redo')}
      </div>
      {showMathDialog && <MathDialog onInsert={handleInsertMath} onClose={() => setShowMathDialog(false)} />}
    </>
  );
};

export const RichTextEditor = ({ value, onChange, placeholder, minHeight = '150px' }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Mathematics,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose max-w-none p-3 min-h-[${minHeight}] outline-none text-slate-800 text-sm`,
        'data-placeholder': placeholder || 'Tulis soal di sini...',
      },
    },
  });

  // Sync external value changes (when form is reset)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #94a3b8;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror { min-height: ${minHeight}; }
        .ProseMirror h1 { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; }
        .ProseMirror h2 { font-size: 1.25em; font-weight: bold; margin: 0.5em 0; }
        .ProseMirror ul { list-style: disc; padding-left: 1.5em; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.5em; }
        .ProseMirror strong { font-weight: bold; }
        .ProseMirror em { font-style: italic; }
        .ProseMirror u { text-decoration: underline; }
        /* KaTeX math styles */
        .ProseMirror .Tiptap-mathematics-editor { font-family: monospace; background: #fef9c3; padding: 2px 6px; border-radius: 4px; color: #854d0e; }
        .ProseMirror .Tiptap-mathematics-render { cursor: default; }
        .ProseMirror .Tiptap-mathematics-render:hover { background: #fef3c7; border-radius: 4px; }
        /* Display-mode math (block) */
        .katex-display { overflow-x: auto; padding: 0.5rem 0; }
      `}</style>
    </div>
  );
};
