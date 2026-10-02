# TN Newsletter Generator

Converts the TaiyangNews `nl-collection.rss` feed into the daily newsletter HTML (same layout as `23Sep.html`).

## Run

```
npm start            # http://localhost:4300  (no npm install needed, Node 18+)
```

Form fields:
- **RSS URL** – fetched through the local server (avoids CORS). Ignored if a file is uploaded.
- **Upload RSS file** – use a saved `.rss` instead of the URL.
- **Newsletter date** – header date / file name (defaults to tomorrow).
- **AI Generated Text** – goes under "SUMMARY OF THE DAY".
- **What we read from others** – one bullet per story: title, then a link. Rendered as a
  "What We Read From Others" section after the news sections (Markets, Storage, …) and before
  the image sections (Reports, Our Events, Top Modules, Price Index).

Submit shows a preview, with Download (`23Sep.html` naming) / Copy / Open buttons.

CLI: `node cli.js feed.rss out.html --date 2026-09-23 --summary "text"`

## Conversion rules

- Headlines list: every item, in feed order.
- Sections: grouped by the item's first `<category>`, in order of first appearance.
- Layout per category (edit `LAYOUTS` in `public/converter.js`):
  - Reports, Our Events → 2-column cover grid
  - Top Modules, Price Index → full-width image
  - everything else (Markets, Storage, …) → thumbnail + title + description
- Description: the article's leading key-takeaway bullets joined as sentences; otherwise the
  first sub-heading (News Snippets posts); otherwise RSS description / media title / first paragraph.
- Image: `media:content` URL.
- Special characters: every non-ASCII character (’ – × € …) is written as an HTML entity
  (`&#8217;`), so the email shows them correctly even if the sending tool assumes the wrong
  charset. The headline arrow is the CSS escape `\25BA`.
- Emoji: removed, because email clients can't show them reliably. That includes emoji the feed
  already lost upstream as "?" (e.g. `Conference - Online ?️`). When one is removed, the spaced
  " - " separator in that text is removed too, so the title becomes `Conference Online`.
