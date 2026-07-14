"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import TiptapUnderline from "@tiptap/extension-underline";
import TableOfContents from "@tiptap/extension-table-of-contents";
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code,
  Undo, Redo, AlignRight, AlignCenter, AlignLeft,
  Link as LinkIcon, Image as ImageIcon, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mediaService } from "@/services";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder = "متن خود را بنویسید...", className }: RichTextEditorProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapUnderline,
      TiptapImage.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto",
        },
      }),
      TiptapLink.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      TableOfContents,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "prose prose-sm max-w-none min-h-[200px] focus:outline-none px-4 py-3" } },
  });

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || "");
  }, [value, editor]);

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt("آدرس لینک:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  // Image upload for the rich text editor.
  //
  // NOTE: This is one of the few legitimate places where we POST directly
  // to /media — the uploaded image is inlined into the TipTap HTML content
  // (`<img src="...">`) and is NOT tied to any specific entity (brand,
  // product, ticket, etc.). Entity-bound uploads (brand logos, shipping
  // company logos, product images, ticket attachments, return images,
  // blog cover images, etc.) all use their own multipart endpoints and
  // never pre-upload to /media.
  const onImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    setUploading(true);
    try {
      const media = await mediaService.upload(file);
      editor.chain().focus().setImage({
        src: media.url,
        alt: media.originalName,
        title: media.originalName,
      }).run();
    } catch {
      // Fallback: ask for URL
      const url = window.prompt("آپلود ناموفق بود. آدرس تصویر را وارد کنید:");
      if (url) editor.chain().focus().setImage({ src: url }).run();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const setImageSize = (width: number) => {
    editor.chain().focus().updateAttributes("image", { width: `${width}%` }).run();
  };

  return (
    <div className={cn("rounded-lg border border-input bg-background", className)}>
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onImageUpload}
        className="hidden"
      />

      <div className="flex flex-wrap items-center gap-0.5 border-b border-border p-1.5">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="ضخیم"><Bold className="size-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="کج"><Italic className="size-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title="زیرخط"><UnderlineIcon className="size-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title="خط‌خورده"><Strikethrough className="size-4" /></ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} title="عنوان ۱"><Heading1 className="size-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} title="عنوان ۲"><Heading2 className="size-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} title="عنوان ۳"><Heading3 className="size-4" /></ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="لیست نقطه‌ای"><List className="size-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="لیست شماره‌دار"><ListOrdered className="size-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} title="نقل‌قول"><Quote className="size-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive("codeBlock")} title="کد"><Code className="size-4" /></ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} title="راست‌چین"><AlignRight className="size-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} title="وسط‌چین"><AlignCenter className="size-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} title="چپ‌چین"><AlignLeft className="size-4" /></ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton onClick={addLink} isActive={editor.isActive("link")} title="لینک"><LinkIcon className="size-4" /></ToolbarButton>
        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="آپلود تصویر" disabled={uploading}>
          {uploading ? <span className="text-xs">...</span> : <Upload className="size-4" />}
        </ToolbarButton>
        {/* Image size controls (when image is selected) */}
        {editor.isActive("image") && (
          <>
            <div className="mx-1 h-5 w-px bg-border" />
            <ToolbarButton onClick={() => setImageSize(25)} title="۲۵٪">۲۵٪</ToolbarButton>
            <ToolbarButton onClick={() => setImageSize(50)} title="۵۰٪">۵۰٪</ToolbarButton>
            <ToolbarButton onClick={() => setImageSize(75)} title="۷۵٪">۷۵٪</ToolbarButton>
            <ToolbarButton onClick={() => setImageSize(100)} title="۱۰۰٪">۱۰۰٪</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} title="وسط‌چین"><AlignCenter className="size-4" /></ToolbarButton>
          </>
        )}
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="بازگشت"><Undo className="size-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="تکرار"><Redo className="size-4" /></ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({ onClick, isActive, children, title, disabled }: { onClick: () => void; isActive?: boolean; children: React.ReactNode; title: string; disabled?: boolean }) {
  return (
    <Button type="button" variant="ghost" size="icon" className={cn("size-8 text-xs", isActive && "bg-primary/10 text-primary")} onClick={onClick} title={title} disabled={disabled}>
      {children}
    </Button>
  );
}
