// ===== English Box — דוח יומי להורה בטלגרם =====
// 1. מדביקים כאן את הטוקן שקיבלתם מ-BotFather
const BOT_TOKEN = 'PASTE_YOUR_BOT_TOKEN_HERE';

// 2. הגדרות
const GROUPS = { kfir: 'כפיר', yaeli: 'יעלי' };  // אותם id כמו ב-words.js
const REPORT_HOUR = 20;                         // שעת הדוח היומי (20 = שמונה בערב)
const TZ = 'Asia/Jerusalem';
const SHEET_NAME = 'practice';
const HEAD = ['key', 'date', 'group', 'name', 'device', 'minutes', 'answers', 'correct', 'percent',
              'sessions', 'tests', 'newKnown', 'bank', 'ready', 'lastActive', 'updated'];

// ---------- מקבל נתונים מהאפליקציה ----------
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const data = JSON.parse(e.postData.contents);
    const sh = getSheet_();
    const values = sh.getDataRange().getValues();
    const index = {};
    for (let i = 1; i < values.length; i++) index[values[i][0]] = i + 1;
    (data.days || []).forEach(function (d) {
      if (!d || !d.date || !d.group) return;
      const key = [data.device, d.date, d.group].join('|');
      const a = +d.a || 0, c = +d.c || 0;
      const row = [key, d.date, d.group, GROUPS[d.group] || data.name || d.group, data.device,
        Math.round((+d.ms || 0) / 60000), a, c, a ? Math.round(c / a * 100) : 0,
        +d.sessions || 0, (d.tests || []).join(' '), +d.known || 0, d.bank || '',
        d.ready == null ? '' : d.ready, d.last ? new Date(d.last) : '', new Date()];
      if (index[key]) sh.getRange(index[key], 1, 1, row.length).setValues([row]);
      else { sh.appendRow(row); index[key] = sh.getLastRow(); }
    });
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  } finally {
    lock.releaseLock();
  }
}

// ---------- הדוח היומי ----------
function dailyReport() {
  const now = new Date();
  const today = Utilities.formatDate(now, TZ, 'yyyy-MM-dd');
  const weekAgo = Utilities.formatDate(new Date(now.getTime() - 6 * 864e5), TZ, 'yyyy-MM-dd');
  const rows = getSheet_().getDataRange().getValues().slice(1).map(function (r) {
    return { date: day_(r[1]), group: r[2], minutes: +r[5] || 0, answers: +r[6] || 0, correct: +r[7] || 0,
             sessions: +r[9] || 0, tests: String(r[10] || '').split(' ').filter(String),
             known: +r[11] || 0, bank: r[12], ready: r[13], last: r[14] };
  });
  const L = ['📊 English Box — ' + Utilities.formatDate(now, TZ, 'dd/MM/yyyy')];
  Object.keys(GROUPS).forEach(function (g) {
    const name = GROUPS[g];
    const t = rows.filter(function (r) { return r.group === g && r.date === today; });
    const wk = rows.filter(function (r) { return r.group === g && r.date >= weekAgo && r.date <= today && r.answers > 0; });
    const sum = function (list, f) { return list.reduce(function (s, r) { return s + r[f]; }, 0); };
    L.push('');
    const answers = sum(t, 'answers');
    if (!answers) {
      L.push('❌ ' + name + ' — אין תרגול היום');
    } else {
      const correct = sum(t, 'correct');
      const latest = t.slice().sort(function (a, b) { return new Date(b.last) - new Date(a.last); })[0];
      L.push('✅ ' + name + ' — ' + sum(t, 'minutes') + ' דק\' תרגול');
      L.push('   📝 ' + answers + ' תשובות · ' + Math.round(correct / answers * 100) + '% נכונות');
      L.push('   🔁 ' + sum(t, 'sessions') + ' סבבים');
      const tests = [].concat.apply([], t.map(function (r) { return r.tests; }));
      if (tests.length) L.push('   📋 מבחן לדוגמה: ' + tests.join(', '));
      const known = sum(t, 'known');
      if (known) L.push('   ⭐ מילים חדשות שנלמדו עד הסוף: ' + known);
      if (latest && latest.bank) L.push('   📚 ' + latest.bank + (latest.ready !== '' ? ' — מוכנות ' + latest.ready + '%' : ''));
      if (latest && latest.last) L.push('   🕐 תרגול אחרון: ' + Utilities.formatDate(new Date(latest.last), TZ, 'HH:mm'));
    }
    const days = {};
    wk.forEach(function (r) { days[r.date] = true; });
    L.push('   📅 7 ימים אחרונים: ' + Object.keys(days).length + '/7 ימים · ' + sum(wk, 'minutes') + ' דק\'');
  });
  sendTelegram_(L.join('\n'));
}

// ---------- הפעלה ראשונה (מריצים פעם אחת) ----------
function setup() {
  if (!BOT_TOKEN || BOT_TOKEN.indexOf('PASTE') === 0) throw new Error('צריך להדביק את הטוקן של הבוט בשורה 3');
  const res = JSON.parse(UrlFetchApp.fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/getUpdates').getContentText());
  const msgs = (res.result || []).filter(function (u) { return u.message; });
  if (!msgs.length) throw new Error('לא נמצאה הודעה. שלחו לבוט בטלגרם הודעה כלשהי (למשל "שלום") ואז הריצו שוב את setup');
  const chatId = msgs[msgs.length - 1].message.chat.id;
  PropertiesService.getScriptProperties().setProperty('CHAT_ID', String(chatId));
  getSheet_();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'dailyReport') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dailyReport').timeBased().everyDays(1).atHour(REPORT_HOUR).nearMinute(0).inTimezone(TZ).create();
  sendTelegram_('✅ English Box מחובר! הדוח היומי יגיע כל יום בסביבות ' + REPORT_HOUR + ':00.');
}

// ---------- עזרים ----------
function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange('B:B').setNumberFormat('@'); // תאריך כטקסט
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
  }
  return sh;
}
function day_(v) { return v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v); }
function sendTelegram_(text) {
  const chatId = PropertiesService.getScriptProperties().getProperty('CHAT_ID');
  if (!chatId) throw new Error('הריצו קודם את setup');
  UrlFetchApp.fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text: text })
  });
}
