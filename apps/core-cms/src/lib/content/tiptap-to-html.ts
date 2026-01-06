import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Youtube from '@tiptap/extension-youtube';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';

/**
 * Convert Tiptap JSON to HTML
 * For SmartFormat RSS feed
 */
export function tiptapToHtml(json: any): string {
  if (!json) {
    return '';
  }

  // Support legacy text format
  if (json.text && typeof json.text === 'string') {
    return json.text.replace(/\n/g, '<br>');
  }

  try {
    const html = generateHTML(json, [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Image,
      Link,
      Table,
      TableRow,
      TableCell,
      TableHeader,
      Youtube,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
      Highlight.configure({
        multicolor: true,
      }),
    ]);

    return html;
  } catch (error) {
    console.error('Failed to convert Tiptap JSON to HTML:', error);
    return '';
  }
}
