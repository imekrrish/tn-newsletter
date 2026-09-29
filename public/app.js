(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const form = $('form');
  const reads = $('reads');
  const readsSrc = $('readsSrc');
  const srcBtn = $('srcBtn');
  const fileInput = $('rssFile');
  const drop = $('drop');
  const submitBtn = $('submitBtn');
  const resultBtns = ['copyBtn', 'openBtn', 'downloadBtn'].map($);
  let source = 'url';
  let lastHtml = '';
  let lastDateLabel = '';

  // ---------- status + toast ----------

  function setStatus(text, kind) {
    const s = $('status');
    s.textContent = text;
    s.className = 'status ' + (kind || '');
  }

  let toastTimer;
  function toast(text, kind) {
    const t = $('toast');
    t.textContent = text;
    t.className = 'toast show ' + (kind || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.className = 'toast'), kind === 'err' ? 5000 : 2500);
  }

  // ---------- defaults ----------

  // The newsletter goes out the day after the feed is built, so default to tomorrow.
  function defaultDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  $('nlDate').value = defaultDate();

  $('aiText').addEventListener('input', (e) => ($('aiCount').textContent = e.target.value.length));

  // ---------- source: URL / file ----------

  function setSource(src) {
    source = src;
    document.querySelectorAll('[data-src]').forEach((b) => b.classList.toggle('active', b.dataset.src === src));
    document.querySelector('.src-url').hidden = src !== 'url';
    document.querySelector('.src-file').hidden = src !== 'file';
  }
  document.querySelectorAll('[data-src]').forEach((b) => b.addEventListener('click', () => setSource(b.dataset.src)));

  function showFile() {
    const f = fileInput.files[0];
    drop.classList.toggle('has-file', !!f);
    $('dropText').innerHTML = f
      ? `<b>${f.name.replace(/</g, '&lt;')}</b> · ${(f.size / 1024).toFixed(0)} KB`
      : 'Drop the <b>.rss</b> file here or <u>browse</u>';
  }
  fileInput.addEventListener('change', showFile);
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.add('over')));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('over')));

  // ---------- editor ----------

  $('toolbar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cmd]');
    if (!b || !readsSrc.hidden) return;
    reads.focus();
    let arg = null;
    if (b.dataset.cmd === 'createLink') {
      arg = prompt('Link URL', 'https://');
      if (!arg) return;
    }
    document.execCommand(b.dataset.cmd, false, arg);
  });

  // Keep the placeholder working after the user clears the editor.
  reads.addEventListener('input', () => {
    if (!reads.textContent.trim() && !reads.querySelector('a')) reads.innerHTML = '';
  });

  srcBtn.addEventListener('click', () => {
    const toSource = readsSrc.hidden;
    if (toSource) readsSrc.value = reads.innerHTML;
    else reads.innerHTML = readsSrc.value;
    readsSrc.hidden = !toSource;
    reads.hidden = toSource;
    srcBtn.classList.toggle('on', toSource);
  });

  const readsHtml = () => (readsSrc.hidden ? reads.innerHTML : readsSrc.value);

  // ---------- RSS loading ----------

  async function loadRss() {
    if (source === 'file') {
      const file = fileInput.files[0];
      if (!file) throw new Error('Choose an RSS file first.');
      return file.text();
    }
    const url = $('rssUrl').value.trim();
    if (!url) throw new Error('Enter an RSS URL.');

    // Prefer the local proxy (avoids CORS); fall back to a direct fetch.
    let res;
    try {
      res = await fetch('/api/rss?url=' + encodeURIComponent(url));
      if (res.status === 404) throw new Error('no proxy');
    } catch (_) {
      res = await fetch(url).catch(() => {
        throw new Error('Could not fetch the RSS URL. Start the app with "npm start", or upload the .rss file.');
      });
    }
    const text = await res.text();
    if (!res.ok) throw new Error('RSS fetch failed: ' + (text || res.status));
    return text;
  }

  // ---------- generate ----------

  function renderStats(stats) {
    const chips = [`<span class="chip main">${stats.items} stories</span>`]
      .concat(stats.sections.map((s) => `<span class="chip">${s}</span>`));
    if (stats.externalReads) chips.push(`<span class="chip">${stats.externalReads} external</span>`);
    $('stats').innerHTML = chips.join('');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.querySelector('.btn-label').textContent = 'Generating…';
    setStatus(source === 'url' ? 'Fetching feed…' : 'Reading file…', 'busy');
    try {
      const xml = await loadRss();
      const dateVal = $('nlDate').value;
      const { html, stats } = TNConverter.buildNewsletter(xml, {
        date: dateVal ? new Date(dateVal + 'T12:00:00') : new Date(),
        summary: $('aiText').value,
        externalReadsHtml: readsHtml(),
      });
      lastHtml = html;
      lastDateLabel = stats.dateLabel;
      renderStats(stats);
      $('empty').hidden = true;
      $('preview').hidden = false;
      $('preview').srcdoc = html;
      resultBtns.forEach((b) => (b.disabled = false));
      setStatus('Generated · ' + stats.dateLabel, 'ok');
      toast(`Newsletter ready — ${stats.items} stories`, 'ok');
      if (window.innerWidth <= 1000) document.querySelector('.preview-panel').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      setStatus('Error', 'err');
      toast(err.message || String(err), 'err');
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      submitBtn.querySelector('.btn-label').textContent = 'Generate newsletter';
    }
  });

  form.addEventListener('reset', () => {
    setTimeout(() => {
      $('nlDate').value = defaultDate();
      $('aiCount').textContent = '0';
      reads.innerHTML = '';
      readsSrc.value = '';
      if (!readsSrc.hidden) srcBtn.click();
      showFile();
      setSource('url');
      setStatus('Ready');
    });
  });

  // ---------- preview + result actions ----------

  document.querySelectorAll('[data-view]').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-view]').forEach((x) => x.classList.toggle('active', x === b));
      document.querySelector('.pv-stage').classList.toggle('mobile', b.dataset.view === 'mobile');
    })
  );

  // "23. Sep 2026" -> "23Sep.html" (same naming as the existing newsletters)
  function fileName() {
    const [d, m] = lastDateLabel.replace('.', '').split(' ');
    return `${parseInt(d, 10)}${m}.html`;
  }

  const htmlBlob = () => new Blob([lastHtml], { type: 'text/html;charset=utf-8' });

  $('downloadBtn').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(htmlBlob());
    a.download = fileName();
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Downloaded ' + fileName(), 'ok');
  });

  $('copyBtn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(lastHtml);
      toast('HTML copied to clipboard', 'ok');
    } catch (_) {
      toast('Copy failed — use Download instead', 'err');
    }
  });

  $('openBtn').addEventListener('click', () => window.open(URL.createObjectURL(htmlBlob()), '_blank'));
})();
