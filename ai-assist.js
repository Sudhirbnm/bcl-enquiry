/* Brand Concepts Limited — AI Assistant (shared by the portal and every report)
   ─ Floating ✨ button + side panel, or mounted inside a report's "AI" tab
   ─ Automatic insights (no AI) supplied by each report
   ─ "Analyse" write-up and chat through the company AI Relay (key never in the browser)
   ─ Voice: speak in Hindi or English, answers read aloud; hands-free "Talk" mode
   A page sets it up with:  BCLAI.register({ report, about, context(), insights(), tasks, tabMount })  */
(function () {
  const AI_RELAY = '';   // ← AI Relay web-app URL (ends in /exec)
  const TOKEN_KEY = 'bcl_ai_token';
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ───────── styles (macOS look) ───────── */
  const css = `
.bai-fab{position:fixed;right:20px;bottom:20px;z-index:900;height:46px;padding:0 18px 0 14px;border-radius:23px;border:none;cursor:pointer;
  background:#1d1d1f;color:#fff;font:600 14px -apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;display:flex;align-items:center;gap:8px;
  box-shadow:0 6px 20px rgba(0,0,0,.22),0 1px 3px rgba(0,0,0,.2)}
.bai-fab:hover{background:#000}
.bai-fab .st{font-size:17px}
.bai-ov{position:fixed;inset:0;background:rgba(0,0,0,.12);z-index:950;display:none}
.bai-drawer{position:fixed;top:0;right:0;bottom:0;width:440px;max-width:100vw;z-index:960;background:#f5f5f7;display:none;flex-direction:column;
  box-shadow:-10px 0 40px rgba(0,0,0,.14);border-left:1px solid rgba(0,0,0,.08)}
.bai-open .bai-ov{display:block}.bai-open .bai-drawer{display:flex}
.bai{display:flex;flex-direction:column;height:100%;min-height:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Inter','Segoe UI',Roboto,sans-serif;color:#1d1d1f;font-size:14px;letter-spacing:-.005em}
.bai-hd{display:flex;align-items:center;gap:10px;padding:14px 16px;background:rgba(255,255,255,.85);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,0,0,.08)}
.bai-hd .t{flex:1;min-width:0}.bai-hd .t b{display:block;font-size:15px;font-weight:600}.bai-hd .t span{font-size:12px;color:#6e6e73}
.bai-ib{width:30px;height:30px;border-radius:50%;border:none;background:#e8e8ed;color:#1d1d1f;cursor:pointer;font-size:14px;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto}
.bai-ib:hover{background:#dcdce1}.bai-ib.on{background:#0071e3;color:#fff}
.bai-body{flex:1;overflow-y:auto;padding:14px 16px 6px;min-height:0}
.bai-card{background:#fff;border-radius:14px;padding:14px 15px;margin-bottom:12px;box-shadow:0 1px 2px rgba(0,0,0,.04),0 3px 12px rgba(0,0,0,.05)}
.bai-card h4{font-size:13px;font-weight:600;color:#6e6e73;margin:0 0 8px}
.bai-ins{list-style:none;margin:0;padding:0}
.bai-ins li{display:flex;gap:9px;padding:6px 0;border-top:1px solid #f0f0f3;line-height:1.4;font-size:13.5px}
.bai-ins li:first-child{border-top:none}
.bai-dot{width:8px;height:8px;border-radius:50%;margin-top:6px;flex:0 0 auto;background:#86868b}
.bai-dot.warn{background:#ff3b30}.bai-dot.watch{background:#ff9500}.bai-dot.good{background:#34c759}.bai-dot.info{background:#0071e3}
.bai-btn{background:#0071e3;color:#fff;border:none;border-radius:8px;padding:8px 14px;font:500 13px -apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;cursor:pointer}
.bai-btn:hover{background:#0077ed}.bai-btn:disabled{opacity:.5;cursor:default}
.bai-btn.sec{background:#fff;color:#1d1d1f;border:1px solid #c7c7cc}
.bai-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.bai-msg{margin:0 0 12px;display:flex}
.bai-msg.u{justify-content:flex-end}
.bai-msg .b{max-width:88%;padding:9px 13px;border-radius:16px;line-height:1.5;word-wrap:break-word;overflow-wrap:anywhere}
.bai-msg.u .b{background:#0071e3;color:#fff;border-bottom-right-radius:5px}
.bai-msg.a .b{background:#fff;border-bottom-left-radius:5px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.bai-msg.e .b{background:#fff2f2;color:#d70015}
.bai-msg .b p{margin:0 0 7px}.bai-msg .b p:last-child{margin:0}
.bai-msg .b h3,.bai-msg .b h4{font-size:14px;margin:10px 0 5px}.bai-msg .b h3:first-child,.bai-msg .b h4:first-child{margin-top:0}
.bai-msg .b ul,.bai-msg .b ol{margin:4px 0 8px 18px;padding:0}.bai-msg .b li{margin:2px 0}
.bai-msg .b table{border-collapse:collapse;font-size:12px;margin:6px 0;display:block;overflow-x:auto}
.bai-msg .b th,.bai-msg .b td{border-bottom:1px solid #ececf0;padding:4px 8px;text-align:left;white-space:nowrap}
.bai-msg .b code{background:#f2f2f5;border-radius:4px;padding:0 4px;font-size:12.5px}
.bai-typing{display:inline-flex;gap:4px;padding:4px 2px}.bai-typing i{width:6px;height:6px;border-radius:50%;background:#a1a1a6;animation:baiB 1.2s infinite}
.bai-typing i:nth-child(2){animation-delay:.15s}.bai-typing i:nth-child(3){animation-delay:.3s}
@keyframes baiB{0%,80%,100%{opacity:.3}40%{opacity:1}}
.bai-sug{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}
.bai-sug button{background:#fff;border:1px solid #d2d2d7;border-radius:16px;padding:5px 11px;font:13px -apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;color:#1d1d1f;cursor:pointer}
.bai-sug button:hover{border-color:#0071e3;color:#0071e3}
.bai-ft{padding:10px 12px 12px;background:rgba(255,255,255,.85);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);border-top:1px solid rgba(0,0,0,.08)}
.bai-row{display:flex;gap:8px;align-items:flex-end}
.bai-in{flex:1;resize:none;border:1px solid #c7c7cc;border-radius:18px;padding:9px 14px;font:14px -apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;max-height:120px;min-height:38px;outline:none;background:#fff;color:#1d1d1f}
.bai-in:focus{border-color:#0071e3;box-shadow:0 0 0 4px rgba(0,113,227,.15)}
.bai-send{width:38px;height:38px;border-radius:50%;border:none;background:#0071e3;color:#fff;font-size:17px;cursor:pointer;flex:0 0 auto}
.bai-send:disabled{background:#c7c7cc}
.bai-mic{width:38px;height:38px;border-radius:50%;border:1px solid #c7c7cc;background:#fff;cursor:pointer;flex:0 0 auto;display:flex;align-items:center;justify-content:center;color:#1d1d1f}
.bai-mic.rec{background:#ff3b30;border-color:#ff3b30;color:#fff;animation:baiP 1.2s infinite}
@keyframes baiP{0%{box-shadow:0 0 0 0 rgba(255,59,48,.45)}70%{box-shadow:0 0 0 10px rgba(255,59,48,0)}100%{box-shadow:0 0 0 0 rgba(255,59,48,0)}}
.bai-opts{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:12px;color:#6e6e73}
.bai-seg{display:inline-flex;background:#e8e8ed;border-radius:7px;padding:2px}
.bai-seg button{border:none;background:none;border-radius:5px;padding:3px 9px;font:500 12px -apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;color:#1d1d1f;cursor:pointer}
.bai-seg button.on{background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.12)}
.bai-talk{margin-left:auto;border:1px solid #c7c7cc;background:#fff;border-radius:14px;padding:4px 11px;font:500 12px -apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;color:#1d1d1f;cursor:pointer}
.bai-talk.on{background:#34c759;border-color:#34c759;color:#fff}
.bai-note{font-size:12px;color:#86868b;text-align:center;padding:4px 0 10px}
.bai-inline{height:calc(100vh - 210px);min-height:520px;max-width:980px;margin:0 auto;border-radius:16px;overflow:hidden;background:#f5f5f7;box-shadow:0 1px 2px rgba(0,0,0,.04),0 3px 12px rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.06)}
@media(max-width:760px){
  .bai-drawer{width:100vw;border-left:none}
  .bai-fab{right:14px;bottom:calc(14px + env(safe-area-inset-bottom));height:44px;padding:0 14px}
  .bai-fab .lb{display:none}.bai-fab .st{font-size:19px}
  .bai-in{font-size:16px}
  .bai-inline{height:calc(100vh - 170px);min-height:420px;border-radius:12px}
}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ───────── state ───────── */
  let CFG = null, node = null, drawer = null, inlineHost = null;
  let history = [];             // {role, content}
  let busy = false, speakOn = false, talkMode = false, lang = 'en-IN';
  try { lang = localStorage.getItem('bai_lang') || 'en-IN'; speakOn = localStorage.getItem('bai_speak') === '1'; } catch (e) { }
  const histKey = () => 'bai_hist_' + location.pathname.split('/').pop();

  const token = () => { try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } };

  async function relay(body) {
    if (!AI_RELAY) throw new Error('The AI connection is not set up yet.');
    const t = token(); if (!t && body.action !== 'token') throw new Error('Please sign out and sign in to the portal again to use AI.');
    const r = await fetch(AI_RELAY, { method: 'POST', body: JSON.stringify(Object.assign({ token: t }, body)) });
    const j = await r.json();
    if (j.status !== 'ok') throw new Error(j.message || 'AI request failed');
    return j;
  }

  /* ───────── tiny markdown ───────── */
  function md(src) {
    const lines = String(src || '').replace(/\r/g, '').split('\n'); let h = '', list = null, i = 0;
    const inl = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<i>$2</i>').replace(/`([^`]+)`/g, '<code>$1</code>');
    const close = () => { if (list) { h += '</' + list + '>'; list = null; } };
    while (i < lines.length) {
      const l = lines[i];
      if (/^\s*\|.*\|\s*$/.test(l) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        close(); const cells = x => x.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        h += '<table><thead><tr>' + cells(l).map(c => '<th>' + inl(c) + '</th>').join('') + '</tr></thead><tbody>'; i += 2;
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { h += '<tr>' + cells(lines[i]).map(c => '<td>' + inl(c) + '</td>').join('') + '</tr>'; i++; }
        h += '</tbody></table>'; continue;
      }
      let m;
      if ((m = l.match(/^\s*#{1,4}\s+(.*)/))) { close(); h += '<h4>' + inl(m[1]) + '</h4>'; }
      else if ((m = l.match(/^\s*[-*•]\s+(.*)/))) { if (list !== 'ul') { close(); h += '<ul>'; list = 'ul'; } h += '<li>' + inl(m[1]) + '</li>'; }
      else if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== 'ol') { close(); h += '<ol>'; list = 'ol'; } h += '<li>' + inl(m[1]) + '</li>'; }
      else if (!l.trim()) close();
      else { close(); h += '<p>' + inl(l) + '</p>'; }
      i++;
    }
    close(); return h;
  }

  /* ───────── what the AI is told ───────── */
  function pageContext() {
    if (CFG.context) { try { return String(CFG.context() || ''); } catch (e) { return ''; } }
    return defaultContext();
  }
  function defaultContext() {   // KPI cards + filters + every visible table on screen
    const root = $(CFG.root || 'main, .main, .content, body'); let out = [];
    const tab = document.querySelector('.tab.active, .navbtn.active, .page-tabs .on, .tabs .active');
    if (tab) out.push('Current view: ' + tab.textContent.trim());
    const f = [...root.querySelectorAll('select')].filter(s => s.offsetParent && s.selectedIndex > 0).map(s => s.options[s.selectedIndex].text);
    if (f.length) out.push('Filters applied: ' + f.join(', '));
    const k = [...root.querySelectorAll('.kpi')].filter(x => x.offsetParent).map(x => x.innerText.replace(/\s*\n\s*/g, ': '));
    if (k.length) out.push('Key figures:\n' + k.join('\n'));
    [...root.querySelectorAll('table')].filter(t => t.offsetParent && !t.closest('.bai')).forEach((t, n) => {
      const rows = [...t.rows].map(r => [...r.cells].map(c => c.innerText.replace(/[\n\t]+/g, ' ').replace(/[↕▲▼]/g, '').trim()).join('\t'));
      out.push('Table ' + (n + 1) + ':\n' + rows.join('\n'));
    });
    return out.join('\n\n').slice(0, 60000);
  }
  function system(voice) {
    return 'You are the AI assistant inside the Brand Concepts Limited internal portal (company: Brand Concepts Limited, a licensed fashion accessories company in India — luggage, bags, wallets, belts). ' +
      'You help staff read reports, understand report formats and data sheets, and analyse the numbers.\n' +
      'Currently open: ' + CFG.report + '.\n\n' + (CFG.about ? 'ABOUT THIS PAGE:\n' + CFG.about + '\n\n' : '') +
      'DATA ON SCREEN RIGHT NOW (this is live data; base numeric answers only on it — never invent figures; say when something is not in the data):\n' + pageContext() + '\n\n' +
      'Rules: Indian number format (lakh/crore, 1,23,456). Be specific: name orders, styles, brands, customers with their numbers. ' +
      'Reply in the language the user writes or speaks in: Hindi (Devanagari) for Hindi, English for English, natural Hinglish if they mix. ' +
      'You cannot change any report data; if asked, explain who updates which sheet. ' +
      (voice ? 'This is a VOICE conversation: answer in 2–4 short spoken sentences, no tables, no bullet symbols, no markdown.' : 'Use short headings and bullets; keep answers compact.');
  }

  /* ───────── UI ───────── */
  const ICON_MIC = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
  const ICON_SPK = on => on ? '🔊' : '🔈';

  function build() {
    node = document.createElement('div'); node.className = 'bai';
    node.innerHTML = `
<div class="bai-hd"><div class="t"><b>Assistant</b><span>${esc(CFG.report)}</span></div>
  <button class="bai-ib bai-spk" title="Read answers aloud">${ICON_SPK(speakOn)}</button>
  <button class="bai-ib bai-clr" title="New conversation">↺</button>
  <button class="bai-ib bai-x" title="Close">✕</button></div>
<div class="bai-body"></div>
<div class="bai-ft">
  <div class="bai-row"><textarea class="bai-in" rows="1" placeholder="Ask anything… (English / हिन्दी)"></textarea>
    <button class="bai-mic" title="Speak">${ICON_MIC}</button><button class="bai-send" title="Send">↑</button></div>
  <div class="bai-opts">Voice <span class="bai-seg"><button data-l="en-IN">English</button><button data-l="hi-IN">हिन्दी</button></span>
    <button class="bai-talk" title="Hands-free conversation">Talk</button></div>
</div>`;
    const inp = $('.bai-in', node);
    inp.addEventListener('input', () => { inp.style.height = 'auto'; inp.style.height = Math.min(inp.scrollHeight, 120) + 'px'; });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
    $('.bai-send', node).onclick = () => send();
    $('.bai-mic', node).onclick = () => listen(false);
    $('.bai-talk', node).onclick = () => { talkMode = !talkMode; $('.bai-talk', node).classList.toggle('on', talkMode); if (talkMode) { setSpeak(true); listen(true); } else stopVoice(); };
    $('.bai-spk', node).onclick = () => setSpeak(!speakOn);
    $('.bai-clr', node).onclick = () => { history = []; save(); stopVoice(); renderBody(); };
    $('.bai-x', node).onclick = () => close();
    node.querySelectorAll('.bai-seg button').forEach(b => b.onclick = () => { lang = b.dataset.l; try { localStorage.setItem('bai_lang', lang); } catch (e) { } paintLang(); });
    paintLang();
    if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) { $('.bai-mic', node).style.display = 'none'; $('.bai-talk', node).style.display = 'none'; }
  }
  function paintLang() { node.querySelectorAll('.bai-seg button').forEach(b => b.classList.toggle('on', b.dataset.l === lang)); }
  function setSpeak(v) { speakOn = v; try { localStorage.setItem('bai_speak', v ? '1' : '0'); } catch (e) { } $('.bai-spk', node).innerHTML = ICON_SPK(v); $('.bai-spk', node).classList.toggle('on', v); if (!v) speechSynthesis && speechSynthesis.cancel(); }

  let insCache = null;
  async function renderBody() {
    const body = $('.bai-body', node); let h = '';
    h += '<div class="bai-card"><h4>' + (CFG.portal ? 'Your tasks' : 'Insights') + '</h4><div class="bai-insw"><div class="bai-typing"><i></i><i></i><i></i></div></div>' +
      (CFG.portal ? '' : '<div class="bai-acts"><button class="bai-btn bai-an">✨ Analyse with AI</button></div>') + '</div>';
    if (!history.length) {
      h += '<div class="bai-sug">' + (CFG.suggest || []).map(s => '<button>' + esc(s) + '</button>').join('') + '</div>';
    }
    history.forEach(m => { h += msgHtml(m.role === 'user' ? 'u' : 'a', m.shown || m.content); });
    body.innerHTML = h;
    body.querySelectorAll('.bai-sug button').forEach(b => b.onclick = () => send(b.textContent));
    const an = $('.bai-an', body); if (an) an.onclick = analyse;
    body.scrollTop = body.scrollHeight;
    fillInsights();
  }
  async function fillInsights() {
    const w = $('.bai-insw', node); if (!w) return;
    try {
      let list = CFG.insights ? await CFG.insights() : [];
      if (!list || !list.length) { w.innerHTML = '<div style="color:#86868b;font-size:13px">' + (CFG.portal ? 'No open tasks.' : 'Nothing stands out right now.') + '</div>'; return; }
      w.innerHTML = '<ul class="bai-ins">' + list.slice(0, 8).map(x => '<li><span class="bai-dot ' + (x.t || 'info') + '"></span><span>' + (x.html || esc(x.text)) + '</span></li>').join('') + '</ul>';
    } catch (e) { w.innerHTML = '<div style="color:#86868b;font-size:13px">' + esc(e.message) + '</div>'; }
  }
  const msgHtml = (k, text) => '<div class="bai-msg ' + k + '"><div class="b">' + (k === 'u' ? esc(text) : md(text)) + '</div></div>';
  function addMsg(k, text) {
    const body = $('.bai-body', node); const s = $('.bai-sug', body); if (s) s.remove();
    body.insertAdjacentHTML('beforeend', msgHtml(k, text)); body.scrollTop = body.scrollHeight;
  }
  function save() { try { sessionStorage.setItem(histKey(), JSON.stringify(history.slice(-30))); } catch (e) { } }

  async function ask(userText, shown, voice) {
    if (busy) return; busy = true; $('.bai-send', node).disabled = true;
    history.push({ role: 'user', content: userText, shown: shown || userText }); addMsg('u', shown || userText); save();
    const body = $('.bai-body', node); body.insertAdjacentHTML('beforeend', '<div class="bai-msg a bai-wait"><div class="b"><span class="bai-typing"><i></i><i></i><i></i></span></div></div>'); body.scrollTop = body.scrollHeight;
    try {
      const j = await relay({ action: 'chat', system: system(voice), tasks: !!CFG.tasks, max_tokens: voice ? 500 : 1800,
        messages: history.map(m => ({ role: m.role, content: m.content })) });
      $('.bai-wait', node) && $('.bai-wait', node).remove();
      history.push({ role: 'assistant', content: j.text }); save(); addMsg('a', j.text);
      if (CFG.tasks) fillInsights();
      if (speakOn || voice) speak(j.text, () => { if (talkMode) listen(true); });
    } catch (e) {
      $('.bai-wait', node) && $('.bai-wait', node).remove(); history.pop(); save(); addMsg('e', e.message);
      if (talkMode) { talkMode = false; $('.bai-talk', node).classList.remove('on'); }
    } finally { busy = false; $('.bai-send', node).disabled = false; }
  }
  function send(text, voice) {
    const inp = $('.bai-in', node); const t = (text != null ? text : inp.value).trim(); if (!t) return;
    inp.value = ''; inp.style.height = 'auto'; ask(t, null, voice);
  }
  function analyse() {
    const q = CFG.analysePrompt || ('Analyse the data on screen for ' + CFG.report + '. Give: 1) a 2-line summary, 2) the main issues or risks with numbers, 3) what is going well, 4) 3–5 specific actions with owners where obvious. Be concise.');
    ask(q, '✨ Analyse this ' + (CFG.viewName ? CFG.viewName() : 'report'));
  }

  /* ───────── voice ───────── */
  let rec = null;
  function listen(voice) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
    if (rec) { rec.stop(); return; }
    speechSynthesis && speechSynthesis.cancel();
    rec = new SR(); rec.lang = lang; rec.interimResults = true; rec.continuous = false;
    const inp = $('.bai-in', node), mic = $('.bai-mic', node); let final = '';
    mic.classList.add('rec'); inp.placeholder = lang === 'hi-IN' ? 'बोलिए…' : 'Listening…';
    rec.onresult = e => { let t = ''; for (const r of e.results) t += r[0].transcript; inp.value = t; if (e.results[e.results.length - 1].isFinal) final = t; };
    rec.onerror = e => { if (e.error === 'not-allowed') addMsg('e', 'Microphone permission is blocked. Allow the microphone for this site in the browser.'); };
    rec.onend = () => { mic.classList.remove('rec'); inp.placeholder = 'Ask anything… (English / हिन्दी)'; rec = null;
      const t = (final || inp.value).trim();
      if (t) send(t, voice || talkMode); else if (talkMode) { talkMode = false; $('.bai-talk', node).classList.remove('on'); } };
    rec.start();
  }
  function plain(t) { return String(t).replace(/\|/g, ' ').replace(/[#*_`>]/g, '').replace(/^\s*[-•]\s+/gm, '').replace(/\n+/g, '. ').slice(0, 1500); }
  function speak(text, done) {
    if (!window.speechSynthesis) { done && done(); return; }
    speechSynthesis.cancel();
    const hi = /[ऀ-ॿ]/.test(text), want = hi ? 'hi' : 'en';
    const u = new SpeechSynthesisUtterance(plain(text)); u.lang = hi ? 'hi-IN' : 'en-IN'; u.rate = 1.02;
    const vs = speechSynthesis.getVoices();
    u.voice = vs.find(v => v.lang === u.lang) || vs.find(v => v.lang.startsWith(want)) || null;
    u.onend = () => done && done(); u.onerror = () => done && done();
    speechSynthesis.speak(u);
  }
  function stopVoice() { talkMode = false; if (rec) { rec.onend = null; rec.stop(); rec = null; } $('.bai-mic', node).classList.remove('rec'); $('.bai-talk', node).classList.remove('on'); window.speechSynthesis && speechSynthesis.cancel(); }

  /* ───────── placement: drawer or a report tab ───────── */
  function ensureDrawer() {
    if (drawer) return;
    drawer = document.createElement('div');
    drawer.innerHTML = '<div class="bai-ov"></div><div class="bai-drawer"></div>';
    document.body.appendChild(drawer);
    $('.bai-ov', drawer).onclick = close;
  }
  function open() {
    ensureDrawer(); $('.bai-drawer', drawer).appendChild(node); $('.bai-x', node).style.display = '';
    drawer.classList.add('bai-open'); renderBody(); setTimeout(() => $('.bai-in', node).focus(), 50);
  }
  function close() { if (drawer) drawer.classList.remove('bai-open'); stopVoice(); }
  function mountTab(el) {
    if (!node) return; close(); inlineHost = el; el.innerHTML = '<div class="bai-inline"></div>';
    $('.bai-inline', el).appendChild(node); $('.bai-x', node).style.display = 'none'; renderBody();
  }

  function register(cfg) {
    CFG = cfg; try { history = JSON.parse(sessionStorage.getItem(histKey()) || '[]'); } catch (e) { history = []; }
    build();
    if (!cfg.noFab) {
      const b = document.createElement('button'); b.className = 'bai-fab'; b.innerHTML = '<span class="st">✨</span><span class="lb">Ask AI</span>';
      b.onclick = open; document.body.appendChild(b); BCLAI.fab = b;
    }
  }
  window.BCLAI = { register, open, close, mountTab, relay, refreshInsights: () => node && fillInsights(), relayUrl: AI_RELAY, md };
})();
