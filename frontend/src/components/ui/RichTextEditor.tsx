import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const MenuBar = ({ editor }: { editor: ReturnType<typeof useEditor> }) => {
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

  return (
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
      {btn(false, () => editor.chain().focus().undo().run(), '↺', 'Undo')}
      {btn(false, () => editor.chain().focus().redo().run(), '↻', 'Redo')}
    </div>
  );
};

export const RichTextEditor = ({ value, onChange, placeholder, minHeight = '150px' }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
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
      `}</style>
    </div>
  );
};
