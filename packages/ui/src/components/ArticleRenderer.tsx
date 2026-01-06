import React from 'react';

interface ArticleRendererProps {
  content: any;
}

/**
 * Renders article content from Tiptap JSON format
 * Supports legacy text format and modern doc format with paragraphs and headings
 */
export function ArticleRenderer({ content }: ArticleRendererProps) {
  if (!content) return null;

  // Legacy format: simple text property
  if (content.text) {
    return <p className="whitespace-pre-wrap">{content.text}</p>;
  }

  // Tiptap JSON format: doc with content nodes
  if (content.type === 'doc' && content.content) {
    return (
      <>
        {content.content.map((node: any, index: number) => {
          if (node.type === 'paragraph') {
            const text = node.content?.map((c: any) => c.text).join('') || '';
            return (
              <p key={index} className="mb-4">
                {text}
              </p>
            );
          }

          if (node.type === 'heading') {
            const text = node.content?.map((c: any) => c.text).join('') || '';
            const HeadingTag = `h${node.attrs?.level || 2}` as keyof JSX.IntrinsicElements;
            return (
              <HeadingTag key={index} className="font-bold mb-4 mt-6">
                {text}
              </HeadingTag>
            );
          }

          return null;
        })}
      </>
    );
  }

  return <p>Content format not supported</p>;
}
