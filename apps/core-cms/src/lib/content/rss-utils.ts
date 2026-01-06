/**
 * Convert Date to RFC 822 format for RSS feed
 * Example: Mon, 01 Jan 2024 12:00:00 +0900
 */
export function toRFC822Date(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = days[d.getDay()];
  const day = d.getDate().toString().padStart(2, '0');
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');

  // JST timezone offset: +0900
  const timezoneOffset = '+0900';

  return `${dayName}, ${day} ${monthName} ${year} ${hours}:${minutes}:${seconds} ${timezoneOffset}`;
}

/**
 * Escape XML special characters
 */
export function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Wrap content in CDATA section
 */
export function wrapCDATA(content: string): string {
  return `<![CDATA[${content}]]>`;
}
