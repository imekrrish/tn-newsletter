/*
 * TaiyangNews RSS -> Newsletter HTML converter.
 * Pure string processing so it runs both in the browser (window.TNConverter)
 * and in Node (require('./converter')) for testing.
 */
(function (root) {
  'use strict';

  // Category -> layout. Anything not listed falls back to "news".
  //   news : thumbnail + title + description   (ul.list-item2)
  //   grid : 2-column cover image + title       (ul.list-item3)
  //   full : full-width image + title           (ul.list-item4)
  const LAYOUTS = {
    'reports': 'grid',
    'our events': 'grid',
    'events': 'grid',
    'webinars': 'grid',
    'top modules': 'full',
    'price index': 'full',
  };

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // ---------- helpers ----------

  function stripCdata(s) {
    const m = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(s || '');
    return m ? m[1] : s || '';
  }

  function decodeEntities(s) {
    return String(s || '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Emoji can't be shown reliably in email, and the feed sometimes carries an
  // emoji that was already lost upstream as "?" + an invisible variation selector
  // (e.g. "Conference - Online ?️"). Both are removed. When something was
  // removed, the spaced " - " separator left behind is dropped too, so that
  // title becomes "Conference Online". (C) (R) TM are kept.
  const LOST_EMOJI = /\?[︎️‍⃣]+|�/g;
  const EMOJI = /(?![©®™])\p{Extended_Pictographic}(?:[︎️‍⃣]|\p{Emoji_Modifier}|\p{Extended_Pictographic})*/gu;
  const INVISIBLE = /[︎️​-‍⁠⃣]/g;

  function cleanText(s) {
    let removed = false;
    const hit = () => ((removed = true), ' ');
    s = String(s || '').replace(LOST_EMOJI, hit).replace(EMOJI, hit).replace(INVISIBLE, '');
    if (removed) s = s.replace(/\s+[-–—]\s+/g, ' ').replace(/\s+[-–—:|]\s*$/, '');
    return s.replace(/[ \t]{2,}/g, ' ').replace(/ +([,.;:!?])/g, '$1').trim();
  }

  // Every non-ASCII character as a numeric entity (’ -> &#8217;) so no email
  // tool can turn it into "?" because of a charset mismatch.
  function asciiSafe(html) {
    return String(html).replace(/[^\x00-\x7F]/gu, (ch) => '&#' + ch.codePointAt(0) + ';');
  }

  // Tag markup -> plain text with collapsed whitespace.
  function textOf(html) {
    return cleanText(
      decodeEntities(String(html || '').replace(/<[^>]*>/g, ' '))
        .replace(/\s+/g, ' ')
        .replace(/\s+([,.;])/g, '$1')
    );
  }

  function withPeriod(s) {
    s = s.trim();
    return /[.!?:]$/.test(s) ? s : s + '.';
  }

  function tag(xml, name) {
    const re = new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + name + '>');
    const m = re.exec(xml);
    return m ? stripCdata(m[1]) : '';
  }

  function tags(xml, name) {
    const re = new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + name + '>', 'g');
    return [...xml.matchAll(re)].map((m) => stripCdata(m[1]));
  }

  function attr(xml, tagName, attrName) {
    const re = new RegExp('<' + tagName + '\\s[^>]*?' + attrName + '="([^"]*)"');
    const m = re.exec(xml);
    return m ? decodeEntities(m[1]) : '';
  }

  function stripQuery(url) {
    return url ? url.replace(/\?.*$/, '') : '';
  }

  // ---------- RSS parsing ----------

  function parseRss(xml) {
    xml = String(xml || '');
    if (!/<rss[\s>]/.test(xml) || !/<item[\s>]/.test(xml)) {
      throw new Error('This does not look like an RSS feed (no <rss> / <item> found).');
    }
    const channel = xml.split(/<item[\s>]/)[0];
    const items = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/g)].map((m) => {
      const it = m[1];
      const categories = tags(it, 'category').map(textOf).filter(Boolean);
      return {
        title: textOf(tag(it, 'title')),
        link: textOf(tag(it, 'link')),
        pubDate: textOf(tag(it, 'pubDate')),
        categories,
        category: categories[0] || 'News',
        image: attr(it, 'media:content', 'url') || stripQuery(attr(it, 'media:thumbnail', 'url')),
        mediaTitle: textOf(tag(it, 'media:title')),
        rssDescription: textOf(tag(it, 'description')),
        content: tag(it, 'content:encoded'),
      };
    });
    return {
      title: textOf(tag(channel, 'title')),
      lastBuildDate: textOf(tag(channel, 'lastBuildDate')),
      items,
    };
  }

  // Short description shown under the title for "news" items:
  //  1. key-takeaway bullets at the top of the article -> joined as sentences
  //  2. otherwise the first sub-heading (e.g. "News Snippets" round-ups)
  //  3. otherwise the RSS <description>, media title, or first paragraph
  function describe(item) {
    const html = item.content.trim();
    const leadingUl = /^(?:<figure[\s\S]*?<\/figure>\s*)*<ul>([\s\S]*?)<\/ul>/.exec(html);
    if (leadingUl) {
      const bullets = [...leadingUl[1].matchAll(/<li>([\s\S]*?)<\/li>/g)]
        .map((m) => textOf(m[1]).replace(/[.\s]+$/, ''))
        .filter(Boolean);
      if (bullets.length) return bullets.map(withPeriod).join(' ');
    }
    const h = /^(?:<figure[\s\S]*?<\/figure>\s*)*<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/.exec(html);
    if (h && textOf(h[1])) return withPeriod(textOf(h[1]));
    if (item.rssDescription) return item.rssDescription;
    if (item.mediaTitle) return item.mediaTitle;
    const p = /<p[^>]*>([\s\S]*?)<\/p>/.exec(html);
    if (p) {
      const t = textOf(p[1]);
      return t.length > 280 ? t.slice(0, 277).replace(/\s+\S*$/, '') + '…' : t;
    }
    return '';
  }

  // ---------- "What we read from others" ----------

  // Accepts whatever the editor produced and extracts { title, href, label }
  // per <li> (hint format: <li><h2 class="title">Title</h2><a href="URL">label</a></li>).
  function normaliseExternalReads(html) {
    html = String(html || '').trim();
    if (!textOf(html)) return [];
    const lis = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => m[1]);
    const blocks = lis.length ? lis : [html];
    const out = [];
    for (const block of blocks) {
      const a = /<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
      const h = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i.exec(block);
      const title = h ? textOf(h[1]) : textOf(block.replace(/<a\s[\s\S]*?<\/a>/gi, ''));
      if (!title && !a) continue;
      out.push({
        title: title || textOf(a[2]),
        href: a ? decodeEntities(a[1]) : '',
        label: a ? textOf(a[2]) || decodeEntities(a[1]) : '',
      });
    }
    return out;
  }

  // ---------- rendering ----------

  function formatDate(d) {
    return String(d.getDate()).padStart(2, '0') + '. ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  function layoutFor(category) {
    return LAYOUTS[category.toLowerCase()] || 'news';
  }

  // Sections appear in the order their category first shows up in the feed.
  function groupByCategory(items) {
    const groups = [];
    const byName = new Map();
    for (const item of items) {
      let g = byName.get(item.category);
      if (!g) {
        g = { name: item.category, layout: layoutFor(item.category), items: [] };
        byName.set(item.category, g);
        groups.push(g);
      }
      g.items.push(item);
    }
    return groups;
  }

  const SECTION_H2 =
    '<h2 style="background: #cd052a;color: #fff;padding: 5px;display: block;width: 100%;margin-bottom: 0;font-size: 16px;">';

  function img(it) {
    return it.image ? `<img src="${escapeHtml(it.image)}" alt="${escapeHtml(it.title)}" class="image">` : '';
  }

  function renderHeadlines(items) {
    return (
      '<ul class="list-item">' +
      items
        .map(
          (it) => `<li>
                <a target="_blank" href="${escapeHtml(it.link)}" class="item">
                    <h2 class="title">${escapeHtml(it.title)}</h2>
                </a>
            </li>`
        )
        .join('') +
      '</ul>'
    );
  }

  function renderSection(group) {
    const head = SECTION_H2 + escapeHtml(group.name) + '</h2>';
    if (group.layout === 'news') {
      return (
        head +
        '<ul class="list-item list-item2">' +
        group.items
          .map(
            (it) => `<li>
							<a target="_blank" href="${escapeHtml(it.link)}" class="item">
								${img(it)}
								<div class="details">
									<h2 class="title">${escapeHtml(it.title)}</h2>
									<p class="description" style="font-size:18px">${escapeHtml(describe(it))}</p>
								</div>
							</a>
						</li>`
          )
          .join('') +
        '</ul>'
      );
    }
    const n = group.layout === 'grid' ? '3' : '4';
    return (
      head +
      `
					<table style="max-width: 100%;"><tr><td style="padding-right: 15px;vertical-align: top;">
					<ul class="list-item list-item${n}">` +
      group.items
        .map(
          (it) => `<li>
							<a target="_blank" href="${escapeHtml(it.link)}" class="item${n}">
								${img(it)}
								<h2 class="title">${escapeHtml(it.title)}</h2>
							</a>
						</li>`
        )
        .join('') +
      '</ul></td></tr></table>'
    );
  }

  function renderExternalReads(reads) {
    if (!reads.length) return '';
    return (
      SECTION_H2 +
      'What We Read From Others</h2><ul class="list-item list-item2">' +
      reads
        .map(
          (r) => `<li>
                <h2 class="title">${escapeHtml(r.title)}</h2>
                ${r.href ? `<br><a target="_blank" href="${escapeHtml(r.href)}" class="item" style="color:#167cdb;font-size:15px;">${escapeHtml(r.label)}</a>` : ''}
            </li>`
        )
        .join('') +
      '</ul>'
    );
  }

  function summaryHtml(text) {
    return escapeHtml(String(text || '').trim()).replace(/\r?\n/g, '<br>');
  }

  /**
   * @param {string} xml  RSS feed text
   * @param {object} opts { date: Date, summary: string, externalReadsHtml: string }
   * @returns {{ html: string, stats: object }}
   */
  function buildNewsletter(xml, opts) {
    opts = opts || {};
    const feed = parseRss(xml);
    const date = opts.date instanceof Date && !isNaN(opts.date) ? opts.date : new Date();
    const dateLabel = formatDate(date);
    const groups = groupByCategory(feed.items);
    const reads = normaliseExternalReads(opts.externalReadsHtml);
    const T = root.TNTemplate || require('./template');

    // "What We Read From Others" sits after the news sections and before the
    // image sections (Reports, Our Events, Top Modules, Price Index), as in the
    // original newsletter layout.
    const newsGroups = groups.filter((g) => g.layout === 'news');
    const imageGroups = groups.filter((g) => g.layout !== 'news');

    const html = asciiSafe(
      T.page({
        dateLabel,
        summary: summaryHtml(cleanText(opts.summary)),
        body:
          renderHeadlines(feed.items) +
          newsGroups.map(renderSection).join('') +
          renderExternalReads(reads) +
          imageGroups.map(renderSection).join(''),
      })
    );
    return {
      html,
      stats: {
        items: feed.items.length,
        sections: groups.map((g) => `${g.name} (${g.items.length})`),
        externalReads: reads.length,
        dateLabel,
      },
    };
  }

  const api = { buildNewsletter, parseRss, describe, normaliseExternalReads, formatDate, cleanText, asciiSafe, LAYOUTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TNConverter = api;
})(typeof window !== 'undefined' ? window : globalThis);
