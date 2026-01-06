'use client';

import { Editor } from '@tiptap/react';

interface EditorToolbarProps {
  editor: Editor;
  onImageUpload: () => void;
  onYoutubeEmbed: () => void;
  onLinkInsert: () => void;
}

export function EditorToolbar({ editor, onImageUpload, onYoutubeEmbed, onLinkInsert }: EditorToolbarProps) {
  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    title
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-3 py-2 text-sm font-medium rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${
        isActive ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
      }`}
    >
      {children}
    </button>
  );

  const Separator = () => <div className="w-px h-6 bg-gray-300 mx-1" />;

  return (
    <div className="border-b border-gray-300 bg-gray-50 p-2 flex flex-wrap gap-1 items-center">
      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="太字 (Ctrl+B)"
      >
        <strong>B</strong>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="斜体 (Ctrl+I)"
      >
        <em>I</em>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="下線 (Ctrl+U)"
      >
        <u>U</u>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="打消し線"
      >
        <s>S</s>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        title="ハイライト"
      >
        🖍️
      </ToolbarButton>

      <Separator />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="見出し1"
      >
        H1
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="見出し2"
      >
        H2
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="見出し3"
      >
        H3
      </ToolbarButton>

      <Separator />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="箇条書き"
      >
        • リスト
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="番号付きリスト"
      >
        1. リスト
      </ToolbarButton>

      <Separator />

      {/* Blocks */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="引用"
      >
        &quot; 引用
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="コードブロック"
      >
        {'</>'}
      </ToolbarButton>

      <Separator />

      {/* Text Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="左揃え"
      >
        ⬅️
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="中央揃え"
      >
        ↕️
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="右揃え"
      >
        ➡️
      </ToolbarButton>

      <Separator />

      {/* Links and Media */}
      <ToolbarButton
        onClick={onLinkInsert}
        isActive={editor.isActive('link')}
        title="リンクを挿入"
      >
        🔗
      </ToolbarButton>

      <ToolbarButton
        onClick={onImageUpload}
        title="画像を挿入"
      >
        🖼️
      </ToolbarButton>

      <ToolbarButton
        onClick={onYoutubeEmbed}
        title="YouTube動画を埋め込む"
      >
        📹
      </ToolbarButton>

      <Separator />

      {/* Table */}
      <ToolbarButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="テーブルを挿入"
      >
        📊
      </ToolbarButton>

      {editor.isActive('table') && (
        <>
          <ToolbarButton
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            title="列を前に追加"
          >
            ⬅️+
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            title="列を後に追加"
          >
            +➡️
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().deleteColumn().run()}
            title="列を削除"
          >
            ❌列
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().addRowBefore().run()}
            title="行を前に追加"
          >
            ⬆️+
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().addRowAfter().run()}
            title="行を後に追加"
          >
            +⬇️
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().deleteRow().run()}
            title="行を削除"
          >
            ❌行
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().deleteTable().run()}
            title="テーブルを削除"
          >
            ❌表
          </ToolbarButton>
        </>
      )}

      <Separator />

      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="元に戻す (Ctrl+Z)"
      >
        ↩️
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="やり直す (Ctrl+Y)"
      >
        ↪️
      </ToolbarButton>

      <Separator />

      {/* Clear Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        title="書式をクリア"
      >
        🧹
      </ToolbarButton>
    </div>
  );
}
