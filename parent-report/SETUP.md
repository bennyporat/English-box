# דוח יומי בטלגרם — הוראות הפעלה (פעם אחת, ~10 דקות, ממחשב)

## 1. בוט בטלגרם
1. בטלגרם מחפשים **@BotFather** ושולחים לו `/newbot`.
2. נותנים שם (למשל `English Box Report`) ושם משתמש שנגמר ב-bot (למשל `porat_english_bot`).
3. מקבלים **טוקן** (שורה ארוכה כמו `123456:ABC...`) — שומרים אותו.
4. לוחצים על הקישור לבוט החדש ושולחים לו הודעה כלשהי, למשל "שלום".

## 2. Google Sheet + סקריפט
1. פותחים גיליון חדש: https://sheets.new
2. בתפריט: **Extensions → Apps Script**.
3. מוחקים את מה שיש ומדביקים את כל התוכן של `Code.gs`.
4. בשורה 3 מחליפים את `PASTE_YOUR_BOT_TOKEN_HERE` בטוקן מ-BotFather. שומרים (Ctrl+S).
5. למעלה בוחרים את הפונקציה **setup** ולוחצים **Run**. מאשרים הרשאות (Advanced → Go to project → Allow).
   אמורה להגיע הודעה בטלגרם: "✅ English Box מחובר!"

## 3. כתובת לאפליקציה
1. **Deploy → New deployment** → בגלגל השיניים בוחרים **Web app**.
2. Execute as: **Me**. Who has access: **Anyone**. לוחצים **Deploy**.
3. מעתיקים את ה-**Web app URL** (מתחיל ב-`https://script.google.com/macros/s/...`) ושולחים אותו.
   הכתובת נכנסת ל-`REPORT_URL` ב-`index.html` — ומאז האפליקציה מתחילה לדווח.

בדיקה בכל רגע: ב-Apps Script מריצים **dailyReport** — הדוח נשלח מיד.
