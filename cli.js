// Command-line conversion: node cli.js <feed.rss> [out.html] [--date YYYY-MM-DD] [--summary "text"]
const fs = require('fs');
const { buildNewsletter } = require('./public/converter');

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const date = opt('--date');
const summary = opt('--summary');
const [input, output = 'newsletter.html'] = args;

if (!input) {
  console.error('Usage: node cli.js <feed.rss> [out.html] [--date YYYY-MM-DD] [--summary "text"]');
  process.exit(1);
}

const { html, stats } = buildNewsletter(fs.readFileSync(input, 'utf8'), {
  date: date ? new Date(date + 'T12:00:00') : undefined,
  summary,
});
fs.writeFileSync(output, html);
console.log(`Wrote ${output} — ${stats.items} stories, sections: ${stats.sections.join(', ')}`);
