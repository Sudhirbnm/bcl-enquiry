/**
 * Brand Concepts Limited — AI Relay (Google Apps Script)
 * Keeps the company Anthropic key hidden, lets only portal users use AI,
 * and stores tasks given in chat (sheet "Tasks"). Never touches any report data sheet.
 *
 * Setup: bound to a Google Sheet named "BCL AI Assistant".
 * Project Settings → Script properties:  ANTHROPIC_KEY = sk-ant-...
 *   and for the portal's built-in admin login: ADMIN_USER, ADMIN_PASS, ADMIN_NAME
 * Deploy → Web app · Execute as: Me · Who has access: Anyone.
 */
const PORTAL_RELAY = 'https://script.google.com/macros/s/AKfycbxBOckKcP30K-vdg3THER8xkGKDAju8ha1pjyzcdQBZRxKK9La-p_1-zXnhJDF6i6Sr/exec';
const MODEL = 'claude-sonnet-5-5';
const DAILY_LIMIT = 150;          // AI requests per person per day
const TOKEN_HOURS = 12;           // how long a sign-in lasts
const TASK_HEAD = ['ID', 'Task', 'Assigned To', 'Assigned By', 'Due Date', 'Status', 'Created', 'Updated', 'Notes'];

/* ───────── entry points ───────── */
function doGet(e) { return handle(e.parameter || {}); }
function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents || '{}'); } catch (err) { return out({ status: 'error', message: 'Bad request' }); }
  return handle(body);
}
function handle(p) {
  try {
    switch (p.action) {
      case 'ping':   return out({ status: 'ok', model: MODEL });
      case 'token':  return out(issueToken(p.username, p.password));
      case 'chat':   return out(chat(p));
      case 'tasks':  { const u = auth(p.token); return out({ status: 'ok', tasks: listTasks(u, p.scope || 'mine') }); }
      default:       return out({ status: 'error', message: 'Unknown action' });
    }
  } catch (err) { return out({ status: 'error', message: String(err.message || err) }); }
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ───────── sign-in: checked against the portal's own login ───────── */
function secret() {
  const pr = PropertiesService.getScriptProperties();
  let s = pr.getProperty('TOKEN_SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); pr.setProperty('TOKEN_SECRET', s); }
  return s;
}
function sign(payload) {
  const sig = Utilities.computeHmacSha256Signature(payload, secret());
  return Utilities.base64EncodeWebSafe(sig);
}
function issueToken(username, password) {
  if (!username || !password) return { status: 'error', message: 'Username and password required' };
  const pr = PropertiesService.getScriptProperties();
  if (pr.getProperty('ADMIN_USER') && same(username, pr.getProperty('ADMIN_USER')) && password === pr.getProperty('ADMIN_PASS')) {
    const ia = { u: String(username).toLowerCase(), n: pr.getProperty('ADMIN_NAME') || username, exp: Date.now() + TOKEN_HOURS * 3600e3 };
    const pa = Utilities.base64EncodeWebSafe(JSON.stringify(ia));
    return { status: 'ok', token: pa + '.' + sign(pa), name: ia.n };
  }
  const r = UrlFetchApp.fetch(PORTAL_RELAY + '?action=login&username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password), { muteHttpExceptions: true, followRedirects: true });
  let j = {};
  try { j = JSON.parse(r.getContentText()); } catch (e) { return { status: 'error', message: 'Portal login not reachable' }; }
  if (j.status !== 'success') return { status: 'error', message: 'Login failed' };
  const info = { u: String(j.username || username).toLowerCase(), n: j.name || username, exp: Date.now() + TOKEN_HOURS * 3600e3 };
  const payload = Utilities.base64EncodeWebSafe(JSON.stringify(info));
  return { status: 'ok', token: payload + '.' + sign(payload), name: info.n };
}
function auth(token) {
  if (!token || token.indexOf('.') < 0) throw new Error('Please sign in to the portal again');
  const [payload, sig] = token.split('.');
  if (sign(payload) !== sig) throw new Error('Please sign in to the portal again');
  const info = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(payload)).getDataAsString());
  if (Date.now() > info.exp) throw new Error('Session expired — please sign in to the portal again');
  return info;
}
function countUse(user) {
  const key = 'use_' + user + '_' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyyMMdd');
  const c = CacheService.getScriptCache();
  const n = Number(c.get(key) || 0) + 1;
  if (n > DAILY_LIMIT) throw new Error('Daily AI limit reached (' + DAILY_LIMIT + '). Try again tomorrow.');
  c.put(key, String(n), 21600);
}

/* ───────── chat with Claude (with task tools) ───────── */
function chat(p) {
  const u = auth(p.token);
  countUse(u.u);
  const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_KEY');
  if (!key) throw new Error('AI key not set in the relay (Script properties → ANTHROPIC_KEY)');
  const useTasks = !!p.tasks;
  const today = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'EEE d MMM yyyy');
  let system = String(p.system || '').slice(0, 120000) +
    '\n\nYou are talking to ' + u.n + ' (portal user "' + u.u + '"). Today is ' + today + ' (India time).';
  if (useTasks) system += '\nYou can record tasks the user gives (add_task), list them (list_tasks) and update their status (update_task). ' +
    'Confirm task details back in one line after saving. Use portal usernames when assigning if known; otherwise the name as said.';
  const messages = (p.messages || []).slice(-30);
  const tools = useTasks ? TOOLS : undefined;
  for (let i = 0; i < 5; i++) {
    const req = { model: MODEL, max_tokens: Math.min(Number(p.max_tokens) || 1500, 4000), system: system, messages: messages };
    if (tools) req.tools = tools;
    const r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' }, payload: JSON.stringify(req)
    });
    const j = JSON.parse(r.getContentText());
    if (r.getResponseCode() !== 200) throw new Error((j.error && j.error.message) || ('AI error ' + r.getResponseCode()));
    if (j.stop_reason !== 'tool_use') {
      return { status: 'ok', text: j.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim() };
    }
    messages.push({ role: 'assistant', content: j.content });
    const results = j.content.filter(b => b.type === 'tool_use').map(b => {
      let res;
      try { res = runTool(b.name, b.input || {}, u); } catch (err) { res = { error: String(err.message || err) }; }
      return { type: 'tool_result', tool_use_id: b.id, content: JSON.stringify(res) };
    });
    messages.push({ role: 'user', content: results });
  }
  return { status: 'ok', text: 'Sorry, I could not finish that. Please try again.' };
}

/* ───────── tasks (sheet "Tasks" in this spreadsheet) ───────── */
const TOOLS = [
  { name: 'add_task', description: 'Save a task the user is giving to someone (or to themselves).',
    input_schema: { type: 'object', properties: {
      task: { type: 'string', description: 'What has to be done' },
      assigned_to: { type: 'string', description: 'Person responsible (portal username or name)' },
      due_date: { type: 'string', description: 'Due date as YYYY-MM-DD, if given' },
      notes: { type: 'string' } }, required: ['task', 'assigned_to'] } },
  { name: 'list_tasks', description: 'List tasks. scope: "given" = tasks this user assigned to others, "mine" = tasks assigned to this user, "all" = both.',
    input_schema: { type: 'object', properties: {
      scope: { type: 'string', enum: ['given', 'mine', 'all'] },
      status: { type: 'string', enum: ['Open', 'Done', 'any'] } } } },
  { name: 'update_task', description: 'Change a task\'s status (Open / In progress / Done) or add a note. Only the person who gave it or the person it is assigned to may update it.',
    input_schema: { type: 'object', properties: {
      id: { type: 'string' }, status: { type: 'string', enum: ['Open', 'In progress', 'Done'] }, note: { type: 'string' } }, required: ['id'] } }
];
function sheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('Tasks');
  if (!sh) { sh = ss.insertSheet('Tasks'); sh.appendRow(TASK_HEAD); sh.setFrozenRows(1); }
  return sh;
}
function rows() {
  const v = sheet().getDataRange().getValues(); v.shift();
  return v.map((r, i) => ({ row: i + 2, id: String(r[0]), task: r[1], assigned_to: r[2], assigned_by: r[3],
    due_date: r[4] ? Utilities.formatDate(new Date(r[4]), 'Asia/Kolkata', 'yyyy-MM-dd') : '', status: r[5],
    created: r[6] ? Utilities.formatDate(new Date(r[6]), 'Asia/Kolkata', 'yyyy-MM-dd') : '', notes: r[8] }));
}
const same = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
function mineOrGiven(t, u) { return same(t.assigned_by, u.u) || same(t.assigned_to, u.u) || same(t.assigned_to, u.n); }
function listTasks(u, scope, status) {
  return rows().filter(t => scope === 'given' ? same(t.assigned_by, u.u) : scope === 'mine' ? (same(t.assigned_to, u.u) || same(t.assigned_to, u.n)) : mineOrGiven(t, u))
    .filter(t => !status || status === 'any' || (status === 'Done' ? t.status === 'Done' : t.status !== 'Done'))
    .map(t => { const o = Object.assign({}, t); delete o.row; return o; });
}
function runTool(name, x, u) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    if (name === 'add_task') {
      const id = 'T' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyMMddHHmmss');
      const due = x.due_date ? new Date(x.due_date) : '';
      sheet().appendRow([id, x.task, x.assigned_to, u.u, due, 'Open', new Date(), new Date(), x.notes || '']);
      return { saved: true, id: id };
    }
    if (name === 'list_tasks') return { tasks: listTasks(u, x.scope || 'all', x.status || 'any') };
    if (name === 'update_task') {
      const t = rows().find(r => same(r.id, x.id));
      if (!t) return { error: 'No task ' + x.id };
      if (!mineOrGiven(t, u)) return { error: 'Only the person who gave or received this task can update it' };
      const sh = sheet();
      if (x.status) sh.getRange(t.row, 6).setValue(x.status);
      if (x.note) sh.getRange(t.row, 9).setValue((t.notes ? t.notes + '\n' : '') + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'd-MMM') + ' ' + u.u + ': ' + x.note);
      sh.getRange(t.row, 8).setValue(new Date());
      return { updated: true, id: t.id };
    }
    return { error: 'Unknown tool' };
  } finally { lock.releaseLock(); }
}

/* Run once from the editor to check the key works (View → Logs). */
function testKey() {
  const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_KEY');
  const r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', { method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({ model: MODEL, max_tokens: 30, messages: [{ role: 'user', content: 'Say OK' }] }) });
  Logger.log(r.getResponseCode() + ' ' + r.getContentText().slice(0, 300));
  sheet();
}
