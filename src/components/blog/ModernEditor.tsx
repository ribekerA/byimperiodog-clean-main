// PATH: src/components/blog/ModernEditor.tsx
"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  ImageIcon,
  Undo,
  Redo,
} from "lucide-react";
import { useCallback, useEffect } from "react";

interface ModernEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function ModernEditor({ content, onChange, placeholder = "Digite seu conteúdo..." }: ModernEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-brand hover:underline",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
    ],
    content,
    // Evita renderização imediata no SSR e previne hydration mismatch no Next.js/App Router
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none focus:outline-none min-h-[400px] px-6 py-4 text-text-primary",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    
    const url = window.prompt("URL da imagem:");
    
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-surface">
        <p className="text-sm text-text-secondary">Carregando editor...</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 border-b border-border bg-surface-alt p-2">
        {/* Text Formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded p-2 hover:bg-surface-hover ${
            editor.isActive("bold") ? "bg-brand/10 text-brand" : "text-text-primary"
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded p-2 hover:bg-surface-hover ${
            editor.isActive("italic") ? "bg-brand/10 text-brand" : "text-text-primary"
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`rounded p-2 hover:bg-surface-hover ${
            editor.isActive("code") ? "bg-brand/10 text-brand" : "text-text-primary"
          }`}
          title="Código inline"
        >
          <Code className="h-4 w-4" />
        </button>

        <div className="mx-1 w-px bg-border" />

        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`rounded px-2 py-1 text-sm font-semibold hover:bg-surface-hover ${
            editor.isActive("heading", { level: 1 }) ? "bg-brand/10 text-brand" : "text-text-primary"
          }`}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rounded px-2 py-1 text-sm font-semibold hover:bg-surface-hover ${
            editor.isActive("heading", { level: 2 }) ? "bg-brand/10 text-brand" : "text-text-primary"
          }`}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`rounded px-2 py-1 text-sm font-semibold hover:bg-surface-hover ${
            editor.isActive("heading", { level: 3 }) ? "bg-brand/10 text-brand" : "text-text-primary"
          }`}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="mx-1 w-px bg-border" />

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded p-2 hover:bg-surface-hover ${
            editor.isActive("bulletList") ? "bg-brand/10 text-brand" : "text-text-primary"
          }`}
          title="Lista com marcadores"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded p-2 hover:bg-surface-hover ${
            editor.isActive("orderedList") ? "bg-brand/10 text-brand" : "text-text-primary"
          }`}
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <div className="mx-1 w-px bg-border" />

        {/* Block Elements */}
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`rounded p-2 hover:bg-surface-hover ${
            editor.isActive("blockquote") ? "bg-brand/10 text-brand" : "text-text-primary"
          }`}
          title="Citação"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`rounded p-2 hover:bg-surface-hover ${
            editor.isActive("codeBlock") ? "bg-brand/10 text-brand" : "text-text-primary"
          }`}
          title="Bloco de código"
        >
          <Code className="h-4 w-4" />
        </button>

        <div className="mx-1 w-px bg-border" />

        {/* Media */}
        <button
          onClick={setLink}
          className={`rounded p-2 hover:bg-surface-hover ${
            editor.isActive("link") ? "bg-brand/10 text-brand" : "text-text-primary"
          }`}
          title="Inserir link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <button
          onClick={addImage}
          className="rounded p-2 text-text-primary hover:bg-surface-hover"
          title="Inserir imagem"
        >
          <ImageIcon className="h-4 w-4" />
        </button>

        <div className="mx-1 w-px bg-border" />

        {/* History */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="rounded p-2 text-text-primary hover:bg-surface-hover disabled:opacity-30"
          title="Desfazer (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="rounded p-2 text-text-primary hover:bg-surface-hover disabled:opacity-30"
          title="Refazer (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} className="max-h-[600px] overflow-y-auto" />

      {/* Character Count */}
      <div className="border-t border-border bg-surface-alt px-4 py-2 text-xs text-text-secondary">
        {editor.storage.characterCount?.characters() || editor.getText().length} caracteres
      </div>
    </div>
  );
}
