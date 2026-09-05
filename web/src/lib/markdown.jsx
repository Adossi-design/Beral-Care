import React from 'react';

/**
 * Minimal Markdown renderer for assistant replies.
 *
 * Language models format answers with Markdown whether or not you ask them to,
 * so the choice is to render it or to show readers raw "* **Stress:**" text.
 *
 * This builds React elements directly rather than setting innerHTML, so model
 * output can never inject markup into the page. It covers only what the
 * assistants actually produce: headings, bullet and numbered lists, bold,
 * italic, and inline code.
 */

/** Bold, italic, and inline code inside a single line of text. */
function inline(text) {
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|(?<![*\w])\*(?!\s)[^*\n]+?(?<!\s)\*(?!\w))/g;
  const nodes = [];
  let last = 0;
  let key = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];

    if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      nodes.push(<code key={key++}>{token.slice(1, -1)}</code>);
    } else {
      nodes.push(<em key={key++}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length ? nodes : text;
}

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*(\d+)[.)]\s+(.*)$/;
const HEADING = /^\s*(#{1,4})\s+(.*)$/;

export default function Markdown({ text }) {
  if (!text) return null;

  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let list = null;      // { ordered, items: [] }
  let paragraph = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'p', text: paragraph.join(' ') });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list) {
      blocks.push({ type: 'list', ordered: list.ordered, items: list.items });
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h', level: heading[1].length, text: heading[2] });
      continue;
    }

    const numbered = line.match(NUMBERED);
    if (numbered) {
      flushParagraph();
      if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] }; }
      list.items.push(numbered[2]);
      continue;
    }

    const bullet = line.match(BULLET);
    if (bullet) {
      flushParagraph();
      if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] }; }
      list.items.push(bullet[1]);
      continue;
    }

    // A plain line continuing a list item wraps onto the previous item
    if (list && /^\s{2,}\S/.test(raw)) {
      list.items[list.items.length - 1] += ` ${line.trim()}`;
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();

  return (
    <div className="md">
      {blocks.map((block, i) => {
        if (block.type === 'h') {
          const Tag = `h${Math.min(block.level + 2, 6)}`;
          return <Tag key={i} className="md__h">{inline(block.text)}</Tag>;
        }
        if (block.type === 'list') {
          const Tag = block.ordered ? 'ol' : 'ul';
          return (
            <Tag key={i} className={block.ordered ? 'md__ol' : 'md__ul'}>
              {block.items.map((item, j) => <li key={j}>{inline(item)}</li>)}
            </Tag>
          );
        }
        return <p key={i}>{inline(block.text)}</p>;
      })}
    </div>
  );
}
