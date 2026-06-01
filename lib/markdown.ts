/**
 * A highly secure and efficient Markdown to HTML parser
 * styled with beautiful Tailwind typography classes.
 */
export function renderSimpleMarkdown(markdown: string): string {
  if (!markdown) return "";

  // Guard against basic HTML injections by escaping opening tags
  let html = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks code block formatting (```js ... ```)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)\n```/gm,
    (_, lang, code) => `<pre class="bg-slate-900 text-slate-100 rounded-lg p-4 my-6 font-mono text-sm overflow-x-auto dark:bg-zinc-900 border border-slate-800"><code class="language-${lang}">${code.trim()}</code></pre>`
  );

  // Inline Code (`code`)
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-100 dark:bg-zinc-900 border dark:border-zinc-850 px-1.5 py-0.5 rounded font-mono text-xs text-indigo-600 dark:text-indigo-400">$1</code>'
  );

  // Headers (H1 - H4)
  html = html.replace(
    /^#### (.*?)$/gm,
    '<h4 class="text-md font-bold text-slate-900 dark:text-zinc-100 mt-6 mb-2 tracking-tight">$1</h4>'
  );
  html = html.replace(
    /^### (.*?)$/gm,
    '<h3 class="text-xl font-bold text-slate-900 dark:text-zinc-100 mt-8 mb-3 tracking-tight">$1</h3>'
  );
  html = html.replace(
    /^## (.*?)$/gm,
    '<h2 class="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-10 mb-4 pb-1 border-b border-gray-100 dark:border-zinc-800 tracking-tight">$1</h2>'
  );
  html = html.replace(
    /^# (.*?)$/gm,
    '<h1 class="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 mt-12 mb-6 tracking-tight">$1</h1>'
  );

  // Blockquotes (> text)
  html = html.replace(
    /^&gt; (.*?)$/gm,
    '<blockquote class="border-l-4 border-indigo-500 pl-4 py-1.5 my-6 italic text-slate-705 dark:text-zinc-400 font-serif text-lg">$1</blockquote>'
  );

  // Unordered Lists (* or - text)
  html = html.replace(
    /^(?:\*|-)\s+(.*?)$/gm,
    '<li class="ml-6 list-disc mb-1.5 text-slate-700 dark:text-zinc-300">$1</li>'
  );

  // Bold (**text**)
  html = html.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="font-extrabold text-slate-900 dark:text-zinc-100">$1</strong>'
  );

  // Italic (*text* or _text_)
  html = html.replace(
    /\*([^*]+)\*/g,
    '<em class="italic">$1</em>'
  );
  html = html.replace(
    /_([^_]+)_/g,
    '<em class="italic">$1</em>'
  );

  // Paragraphs (double carriage return)
  // Process block-level replacements, then split double newlines to paragraph tags
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      // Check if it's already a block element to avoid double nesting
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<pre") ||
        trimmed.startsWith("<blockquote") ||
        trimmed.startsWith("<li")
      ) {
        return trimmed;
      }
      return `<p class="leading-relaxed text-slate-700 dark:text-zinc-300 font-sans my-4.5 text-base md:text-lg mb-4.5">${trimmed}</p>`;
    })
    .join("\n");

  return html;
}

export function sanitizeArticleHtml(html: string): string {
  if (!html) return "";

  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/\s(href|src)=["']javascript:[^"']*["']/gi, "");
}

export function renderArticleContent(content: string): string {
  if (!content) return "";
  const looksLikeHtml = /<\/?(p|h[1-6]|ul|ol|li|strong|em|blockquote|a|img|pre|code|br)\b/i.test(content);
  return looksLikeHtml ? sanitizeArticleHtml(content) : renderSimpleMarkdown(content);
}
