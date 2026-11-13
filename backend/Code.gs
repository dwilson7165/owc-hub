/**
 * OWC CREW HUB - Google Sheets backend
 * ------------------------------------------------------------
 * Paste this whole file into Extensions > Apps Script of your OWC Google Sheet.
 * Then follow the setup guide:
 *   1. Run  setup()            (creates the tabs, asks for permission once)
 *   2. Add Script Properties:   GEMINI_KEY, ADMIN_PIN, DISCORD_WEBHOOK (optional)
 *   3. Run  installTriggers()   (checks for new patch notes every hour)
 *   4. Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone)
 *   5. Paste the Web app URL into config.js in the app
 */

var SHEETS = {
  Matches:     ['id','timestamp','season','reporter','mode','map','result','mvp','screenshot','players','rolled'],
  Trials:      ['timestamp','date','player','trialId','sponsor','title','bucks'],
  Redemptions: ['timestamp','player','rewardId','reward','cost','status'],
  Rewards:     ['id','name','cost','description','active'],
  Seasons:     ['name','start','end','champion','mvp','matches'],
  Maps:        ['name','fileId','credit','updated'],
  Pins:        ['id','map','x','y','label','type','by','timestamp'],
  Patches:     ['gid','date','title','url','summary'],
  Config:      ['key','value']
};

var DEFAULT_CONFIG = {
  seasonName: 'OWC Season 1',
  seasonStart: '',
  w_elims: 100, w_assists: 50, w_deaths: -40, w_revives: 75, w_objective: 150, w_damagePer10: 1,
  bonus_win: 200, bonus_rolled: 150,
  grade_S: 2200, grade_A: 1600, grade_B: 1000, grade_C: 500,
  geminiModel: 'gemini-flash-latest',
  discordPostMatches: 'yes', discordPostPatches: 'yes', discordPostRedeems: 'yes'
};

var DEFAULT_REWARDS = [
  ['custom-role', 'Custom Discord role color', 500, 'Pick a color for your name in the OWC Discord for a month', 'yes'],
  ['pick-loadout', "Pick Don's next loadout on stream", 300, 'You choose the build, weapon and gadgets live', 'yes'],
  ['force-challenge', 'Force a challenge on stream', 400, 'Call a challenge the squad has to play mid-stream', 'yes'],
  ['game-night-pick', 'Choose a Game Night game', 600, 'Pick one game for the next OWC Community Game Night', 'yes'],
  ['shoutout', 'Stream shoutout', 200, 'A shoutout on the next stream', 'yes'],
  ['squad-spot', 'Guaranteed squad spot', 800, 'Locked spot in the next viewer game', 'yes'],
  ['hall-of-fame', 'Hall of Fame entry', 1500, 'Permanent spot on the OWC Hall of Fame', 'yes']
];

/* =================== SETUP =================== */

function setup() {
  var ss = SpreadsheetApp.getActive();
  Object.keys(SHEETS).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(SHEETS[name]);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, SHEETS[name].length).setFontWeight('bold');
    }
  });
  var cfg = ss.getSheetByName('Config');
  var have = readConfigRaw_();
  Object.keys(DEFAULT_CONFIG).forEach(function (k) {
    if (!(k in have)) cfg.appendRow([k, DEFAULT_CONFIG[k]]);
  });
  if (!have.seasonStart) setConfig_('seasonStart', new Date().toISOString());
  var rw = ss.getSheetByName('Rewards');
  if (rw.getLastRow() === 1) DEFAULT_REWARDS.forEach(function (r) { rw.appendRow(r); });
  var s1 = ss.getSheetByName('Sheet1');
  if (s1 && s1.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s1);
  getFolder_(); // creates the Drive folder for screenshots + maps
  Logger.log('OWC setup complete. Next: add Script Properties, run installTriggers(), then Deploy as Web app.');
}

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'checkPatches') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkPatches').timeBased().everyHours(1).create();
  checkPatches();
  Logger.log('Hourly patch-notes check installed.');
}

/** Run this to test your Discord webhook. */
function testDiscord() {
  postDiscord_({ content: '🦉 OWC Crew Hub is connected to this channel. Hold the line!' });
}

/* =================== WEB APP =================== */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'ping';
  return route_(action, e.parameter || {});
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'Bad request' }); }
  return route_(body.action, body);
}

function route_(action, p) {
  try {
    var fn = {
      ping: function () { return { ok: true, app: 'OWC Crew Hub', time: new Date().toISOString() }; },
      config: publicConfig_,
      readScreenshot: readScreenshot_,
      submitMatch: submitMatch_,
      scoreboard: scoreboard_,
      seasons: seasons_,
      trials: trialsState_,
      claimTrial: claimTrial_,
      redeem: redeem_,
      patches: patches_,
      maps: maps_,
      addPin: addPin_,
      // admin
      adminCheck: function (q) { requireAdmin_(q); return { ok: true }; },
      deleteMatch: deleteMatch_,
      newSeason: newSeason_,
      uploadMap: uploadMap_,
      deletePin: deletePin_,
      setRedemption: setRedemption_,
      refreshPatches: function (q) { requireAdmin_(q); checkPatches(); return patches_(); }
    }[action];
    if (!fn) return json_({ ok: false, error: 'Unknown action: ' + action });
    var out = fn(p);
    out.ok = out.ok !== false;
    return json_(out);
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* =================== HELPERS =================== */

function sheet_(name) { return SpreadsheetApp.getActive().getSheetByName(name); }

function rows_(name) {
  var sh = sheet_(name);
  var vals = sh.getDataRange().getValues();
  var head = vals.shift();
  return vals.map(function (r, i) {
    var o = { _row: i + 2 };
    head.forEach(function (h, j) { o[h] = r[j]; });
    return o;
  });
}

function readConfigRaw_() {
  var out = {};
  var sh = sheet_('Config');
  if (!sh) return out;
  sh.getDataRange().getValues().slice(1).forEach(function (r) { if (r[0]) out[r[0]] = r[1]; });
  return out;
}

function config_() {
  var c = readConfigRaw_();
  var out = {};
  Object.keys(DEFAULT_CONFIG).forEach(function (k) {
    var v = (k in c && c[k] !== '') ? c[k] : DEFAULT_CONFIG[k];
    out[k] = (typeof DEFAULT_CONFIG[k] === 'number') ? Number(v) : String(v);
  });
  return out;
}

function setConfig_(key, value) {
  var sh = sheet_('Config');
  var vals = sh.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (vals[i][0] === key) { sh.getRange(i + 1, 2).setValue(value); return; }
  }
  sh.appendRow([key, value]);
}

function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }

function requireAdmin_(p) {
  var pin = prop_('ADMIN_PIN');
  if (!pin) throw new Error('Admin PIN is not set yet (Script Properties > ADMIN_PIN).');
  if (String(p.pin || '') !== String(pin)) throw new Error('Wrong admin PIN.');
}

function clean_(s, max) { return String(s == null ? '' : s).replace(/[<>]/g, '').trim().slice(0, max || 60); }
function num_(v) { var n = Number(v); return isFinite(n) && n > 0 ? Math.round(n) : 0; }

function getFolder_() {
  var id = prop_('FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var f = DriveApp.createFolder('OWC Crew Hub Files');
  PropertiesService.getScriptProperties().setProperty('FOLDER_ID', f.getId());
  return f;
}

function saveImage_(b64, name) {
  var m = String(b64).match(/^data:(image\/\w+);base64,(.+)$/);
  var mime = m ? m[1] : 'image/jpeg';
  var data = Utilities.base64Decode(m ? m[2] : b64);
  var file = getFolder_().createFile(Utilities.newBlob(data, mime, name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getId();
}

function imgUrl_(id) { return id ? 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1600' : ''; }

/* =================== SCORING (same formula as the app) =================== */

function scorePlayer_(p, cfg, win, rolled) {
  var s = p.elims * cfg.w_elims + p.assists * cfg.w_assists + p.deaths * cfg.w_deaths +
          p.revives * cfg.w_revives + p.objective * cfg.w_objective + Math.floor(p.damage / 10) * cfg.w_damagePer10;
  if (win) s += cfg.bonus_win;
  if (rolled) s += cfg.bonus_rolled;
  return Math.max(0, Math.round(s));
}

function grade_(s, cfg) {
  return s >= cfg.grade_S ? 'S' : s >= cfg.grade_A ? 'A' : s >= cfg.grade_B ? 'B' : s >= cfg.grade_C ? 'C' : 'D';
}

/* =================== CONFIG =================== */

function publicConfig_() {
  var c = config_();
  return {
    config: {
      seasonName: c.seasonName, seasonStart: c.seasonStart,
      weights: { elims: c.w_elims, assists: c.w_assists, deaths: c.w_deaths, revives: c.w_revives,
                 objective: c.w_objective, damagePer10: c.w_damagePer10, win: c.bonus_win, rolled: c.bonus_rolled },
      grades: { S: c.grade_S, A: c.grade_A, B: c.grade_B, C: c.grade_C },
      screenshotReader: !!prop_('GEMINI_KEY'),
      discord: !!prop_('DISCORD_WEBHOOK'),
      adminSet: !!prop_('ADMIN_PIN')
    },
    rewards: rows_('Rewards').filter(function (r) { return String(r.active).toLowerCase() !== 'no'; })
      .map(function (r) { return { id: r.id, name: r.name, cost: Number(r.cost), description: r.description }; })
  };
}

/* =================== SCREENSHOT READING (Gemini) =================== */

function readScreenshot_(p) {
  var key = prop_('GEMINI_KEY');
  if (!key) throw new Error('Screenshot reader is not set up yet (missing GEMINI_KEY). You can still type stats in.');
  var m = String(p.image || '').match(/^data:(image\/\w+);base64,(.+)$/);
  if (!m) throw new Error('No image received.');
  var prompt =
    'This is an end-of-match results/scoreboard screenshot from the video game THE FINALS. ' +
    'Read every player row you can see. Return ONLY JSON with this shape: ' +
    '{"mode":string|null,"map":string|null,"result":"win"|"loss"|null,"players":[{"name":string,"team":string|null,' +
    '"elims":number,"assists":number,"deaths":number,"revives":number,"damage":number,"objective":number}]}. ' +
    'elims = eliminations/kills. objective = objective plays such as cashouts, steals, vault/objective score count (use 0 if not shown). ' +
    'Use 0 for any stat that is not visible. Do not invent players. Keep names exactly as written.';
  var model = config_().geminiModel || 'gemini-flash-latest';
  var res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-goog-api-key': key },
    payload: JSON.stringify({
      contents: [{ parts: [{ inline_data: { mime_type: m[1], data: m[2] } }, { text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0 }
    })
  });
  if (res.getResponseCode() !== 200) throw new Error('Screenshot reader error (' + res.getResponseCode() + '). Type the stats in, or try again.');
  var data = JSON.parse(res.getContentText());
  var text = (((data.candidates || [])[0] || {}).content || {}).parts || [];
  text = text.map(function (x) { return x.text || ''; }).join('');
  var parsed = JSON.parse(text.replace(/^```json|```$/g, '').trim());
  parsed.players = (parsed.players || []).slice(0, 16).map(function (pl) {
    return { name: clean_(pl.name, 32), team: clean_(pl.team, 20), elims: num_(pl.elims), assists: num_(pl.assists),
             deaths: num_(pl.deaths), revives: num_(pl.revives), damage: num_(pl.damage), objective: num_(pl.objective) };
  });
  return { read: parsed };
}

/* =================== MATCHES =================== */

function submitMatch_(p) {
  var cfg = config_();
  var win = String(p.result) === 'win';
  var rolled = !!p.rolled;
  var players = (p.players || []).slice(0, 16).map(function (pl) {
    var o = { name: clean_(pl.name, 32), build: clean_(pl.build, 10), elims: num_(pl.elims), assists: num_(pl.assists),
              deaths: num_(pl.deaths), revives: num_(pl.revives), damage: num_(pl.damage), objective: num_(pl.objective) };
    o.score = scorePlayer_(o, cfg, win, rolled);
    o.grade = grade_(o.score, cfg);
    return o;
  }).filter(function (o) { return o.name; });
  if (!players.length) throw new Error('Add at least one player.');
  players.sort(function (a, b) { return b.score - a.score; });
  var mvp = players[0].name;
  var id = Utilities.getUuid().slice(0, 8);
  var shot = '';
  if (p.screenshot) { try { shot = saveImage_(p.screenshot, 'match-' + id + '.jpg'); } catch (e) {} }
  var ts = new Date();
  sheet_('Matches').appendRow([id, ts.toISOString(), cfg.seasonName, clean_(p.reporter, 32), clean_(p.mode, 30),
    clean_(p.map, 30), win ? 'win' : 'loss', mvp, shot, JSON.stringify(players), rolled ? 'yes' : 'no']);
  if (cfg.discordPostMatches === 'yes' && prop_('DISCORD_WEBHOOK')) {
    try {
      var lines = players.slice(0, 8).map(function (pl, i) {
        return (i === 0 ? '👑 ' : '• ') + '**' + pl.name + '** [' + pl.grade + '] ' + pl.score + ' pts  ·  ' +
               pl.elims + 'E / ' + pl.assists + 'A / ' + pl.deaths + 'D / ' + pl.revives + 'R';
      }).join('\n');
      postDiscord_({
        embeds: [{
          title: (win ? '🏆 VICTORY' : '⚔️ MATCH REPORT') + ' · ' + (p.mode || 'Match') + (p.map ? ' · ' + p.map : ''),
          description: 'Squad MVP: **' + mvp + '**\n\n' + lines,
          color: 0xD4A63A,
          footer: { text: cfg.seasonName + ' · reported by ' + (p.reporter || 'crew') }
        }]
      }, p.card);
    } catch (e) {}
  }
  return { match: { id: id, timestamp: ts.toISOString(), season: cfg.seasonName, mode: p.mode, map: p.map,
                    result: win ? 'win' : 'loss', mvp: mvp, players: players, screenshot: imgUrl_(shot), rolled: rolled } };
}

function matchesFor_(season) {
  return rows_('Matches').filter(function (r) { return !season || r.season === season; }).map(function (r) {
    var pl = []; try { pl = JSON.parse(r.players); } catch (e) {}
    return { id: r.id, timestamp: r.timestamp, season: r.season, reporter: r.reporter, mode: r.mode, map: r.map,
             result: r.result, mvp: r.mvp, screenshot: imgUrl_(r.screenshot), players: pl, rolled: r.rolled === 'yes' };
  }).reverse();
}

function scoreboard_(p) {
  var cfg = config_();
  var season = p.season || cfg.seasonName;
  var list = season === '*' ? matchesFor_(null) : matchesFor_(season);
  return { season: season, current: cfg.seasonName, matches: list.slice(0, season === '*' ? 2000 : 400) };
}

function seasons_() {
  var cfg = config_();
  var list = rows_('Seasons').map(function (r) {
    return { name: r.name, start: r.start, end: r.end, champion: r.champion, mvp: r.mvp, matches: r.matches };
  });
  return { current: { name: cfg.seasonName, start: cfg.seasonStart }, archive: list.reverse() };
}

function deleteMatch_(p) {
  requireAdmin_(p);
  var sh = sheet_('Matches');
  var r = rows_('Matches').filter(function (x) { return x.id === p.id; })[0];
  if (!r) throw new Error('Match not found.');
  sh.deleteRow(r._row);
  return { deleted: p.id };
}

function newSeason_(p) {
  requireAdmin_(p);
  var name = clean_(p.name, 40);
  if (!name) throw new Error('Give the new season a name.');
  var cfg = config_();
  var matches = matchesFor_(cfg.seasonName);
  var totals = {}, mvps = {};
  matches.forEach(function (m) {
    mvps[m.mvp] = (mvps[m.mvp] || 0) + 1;
    m.players.forEach(function (pl) {
      var t = totals[pl.name] || (totals[pl.name] = { score: 0, n: 0 });
      t.score += pl.score; t.n++;
    });
  });
  var champ = Object.keys(totals).sort(function (a, b) { return totals[b].score - totals[a].score; })[0] || '';
  var mvp = Object.keys(mvps).sort(function (a, b) { return mvps[b] - mvps[a]; })[0] || '';
  sheet_('Seasons').appendRow([cfg.seasonName, cfg.seasonStart, new Date().toISOString(), champ, mvp, matches.length]);
  setConfig_('seasonName', name);
  setConfig_('seasonStart', new Date().toISOString());
  if (prop_('DISCORD_WEBHOOK')) {
    try { postDiscord_({ embeds: [{ title: '🏁 ' + cfg.seasonName + ' is in the books', color: 0x5B2A86,
      description: 'Season Champion: **' + (champ || '—') + '**\nSeason MVP: **' + (mvp || '—') + '**\nMatches played: ' +
                   matches.length + '\n\n**' + name + '** starts now. Hold the line!' }] }); } catch (e) {}
  }
  return { archived: cfg.seasonName, champion: champ, mvp: mvp, newSeason: name };
}

/* =================== TRIALS + REWARDS =================== */

function trialsState_(p) {
  var cfg = config_();
  var trials = rows_('Trials');
  var reds = rows_('Redemptions');
  var bal = {};
  trials.forEach(function (t) { bal[t.player] = (bal[t.player] || 0) + Number(t.bucks); });
  reds.forEach(function (r) { if (r.status !== 'refunded') bal[r.player] = (bal[r.player] || 0) - Number(r.cost); });
  var today = String(p.date || '');
  return {
    balances: bal,
    claimedToday: trials.filter(function (t) { return String(t.date) === today; })
      .map(function (t) { return { player: t.player, trialId: t.trialId }; }),
    recentRedemptions: reds.slice(-25).reverse().map(function (r) {
      return { timestamp: r.timestamp, player: r.player, reward: r.reward, cost: r.cost, status: r.status, row: r._row };
    })
  };
}

function claimTrial_(p) {
  var player = clean_(p.player, 32), date = clean_(p.date, 10), id = clean_(p.trialId, 40);
  if (!player) throw new Error('Set your gamertag first (Crew tab).');
  var dup = rows_('Trials').some(function (t) {
    return String(t.date) === date && String(t.player).toLowerCase() === player.toLowerCase() && t.trialId === id;
  });
  if (dup) throw new Error('Already claimed today.');
  var bucks = Math.min(1000, num_(p.bucks));
  sheet_('Trials').appendRow([new Date().toISOString(), date, player, id, clean_(p.sponsor, 30), clean_(p.title, 120), bucks]);
  return trialsState_({ date: date });
}

function redeem_(p) {
  var player = clean_(p.player, 32);
  if (!player) throw new Error('Set your gamertag first (Crew tab).');
  var reward = rows_('Rewards').filter(function (r) { return r.id === p.rewardId; })[0];
  if (!reward) throw new Error('Reward not found.');
  var state = trialsState_({});
  var have = state.balances[player] || 0;
  if (have < Number(reward.cost)) throw new Error('Not enough OWC Bucks (' + have + ' / ' + reward.cost + ').');
  sheet_('Redemptions').appendRow([new Date().toISOString(), player, reward.id, reward.name, Number(reward.cost), 'pending']);
  if (config_().discordPostRedeems === 'yes' && prop_('DISCORD_WEBHOOK')) {
    try { postDiscord_({ embeds: [{ title: '🎟️ Reward redeemed', color: 0xD4A63A,
      description: '**' + player + '** redeemed **' + reward.name + '** for ' + reward.cost + ' OWC Bucks.' }] }); } catch (e) {}
  }
  return trialsState_({});
}

function setRedemption_(p) {
  requireAdmin_(p);
  var row = Number(p.row);
  if (!row || row < 2) throw new Error('Bad row.');
  sheet_('Redemptions').getRange(row, 6).setValue(p.status === 'refunded' ? 'refunded' : 'done');
  return trialsState_({});
}

/* =================== PATCH NOTES (Steam feed) =================== */

var STEAM_FEED = 'https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=2073850&maxlength=3000&format=json&feeds=steam_community_announcements';

function checkPatches() {
  var res = UrlFetchApp.fetch(STEAM_FEED + '&count=6', { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return;
  var items = ((JSON.parse(res.getContentText()).appnews || {}).newsitems || []).filter(isOfficial_);
  var sh = sheet_('Patches');
  var known = {};
  var existing = rows_('Patches');
  existing.forEach(function (r) { known[String(r.gid)] = true; });
  var firstRun = existing.length === 0;
  var cfg = config_();
  var start = Date.now();
  var fresh = items.filter(function (it) { return !known[String(it.gid)]; }).reverse(); // oldest first
  for (var i = 0; i < fresh.length; i++) {
    if (Date.now() - start > 200000) break;           // stay well under Google's 6-minute limit; the rest come next hour
    var it = fresh[i];
    var summary = summarize_(it.title, String(it.contents || ''));
    sh.appendRow([String(it.gid), new Date(it.date * 1000).toISOString(), it.title, it.url, summary]);
    var isNewest = i === fresh.length - 1;
    if (cfg.discordPostPatches === 'yes' && prop_('DISCORD_WEBHOOK') && (!firstRun || isNewest)) {
      try { postDiscord_({ embeds: [{ title: '📡 New update: ' + it.title, url: it.url, color: 0x5B2A86,
        description: summary + '\n\n[Read the full notes](' + it.url + ')' }] }); } catch (e) {}
    }
  }
}

function isOfficial_(it) {
  return String(it.feedname || '') === 'steam_community_announcements' || String(it.url || '').indexOf('steam_community_announcements') >= 0;
}

/** Run once: removes non-Embark news from the Patches tab and fills in any missing summaries. Posts nothing to Discord. */
function fixPatches() {
  var sh = sheet_('Patches');
  var rows = rows_('Patches');
  for (var i = rows.length - 1; i >= 0; i--) {
    if (String(rows[i].url).indexOf('steam_community_announcements') < 0) sh.deleteRow(rows[i]._row);
  }
  var res = UrlFetchApp.fetch(STEAM_FEED + '&count=15', { muteHttpExceptions: true });
  var items = res.getResponseCode() === 200 ? ((JSON.parse(res.getContentText()).appnews || {}).newsitems || []) : [];
  var byGid = {};
  items.forEach(function (it) { byGid[String(it.gid)] = it; });
  var start = Date.now(), fixed = 0;
  rows_('Patches').forEach(function (r) {
    if (Date.now() - start > 240000) return;
    if (String(r.summary).indexOf('New update posted') !== 0) return;
    var it = byGid[String(r.gid)];
    if (!it) return;
    var s = summarize_(it.title, String(it.contents || ''));
    if (s.indexOf('New update posted') !== 0) { sh.getRange(r._row, 5).setValue(s); fixed++; }
    Utilities.sleep(1500);
  });
  Logger.log('Patches tab cleaned. Summaries filled in: ' + fixed + '. Run again if some still say "New update posted".');
}

function summarize_(title, contents) {
  var plain = contents.replace(/\[[^\]]*\]/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  var key = prop_('GEMINI_KEY');
  if (key && plain.length > 40) {
    for (var attempt = 0; attempt < 2; attempt++) {
      try {
        var res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' +
          (config_().geminiModel || 'gemini-flash-latest') + ':generateContent', {
          method: 'post', contentType: 'application/json', muteHttpExceptions: true, headers: { 'x-goog-api-key': key },
          payload: JSON.stringify({ contents: [{ parts: [{ text:
            'Summarize these THE FINALS game update notes for a casual squad in 3 short bullet points, in your own words ' +
            '(no quotes, max 45 words total). Start each bullet with "• ".\nTitle: ' + title + '\n\n' + plain.slice(0, 6000) }] }],
            generationConfig: { temperature: 0.2 } })
        });
        var code = res.getResponseCode();
        if (code === 200) {
          var d = JSON.parse(res.getContentText());
          var t = (((d.candidates || [])[0] || {}).content || {}).parts || [];
          t = t.map(function (x) { return x.text || ''; }).join('').trim();
          if (t) return t;
        }
        Logger.log('Gemini summary attempt ' + (attempt + 1) + ' got ' + code + ': ' + res.getContentText().slice(0, 200));
        if (code === 429 || code >= 500) Utilities.sleep(4000); else break;
      } catch (e) { Logger.log('Gemini summary error: ' + e); }
    }
  }
  return 'New update posted. Tap to read the full notes.';
}

function patches_() {
  return { patches: rows_('Patches').reverse().slice(0, 15).map(function (r) {
    return { date: r.date, title: r.title, url: r.url, summary: r.summary };
  }) };
}

/* =================== MAPS + CALLOUT PINS =================== */

function maps_() {
  return {
    maps: rows_('Maps').map(function (r) { return { name: r.name, image: imgUrl_(r.fileId), credit: r.credit }; }),
    pins: rows_('Pins').map(function (r) {
      return { id: r.id, map: r.map, x: Number(r.x), y: Number(r.y), label: r.label, type: r.type, by: r.by };
    })
  };
}

function uploadMap_(p) {
  requireAdmin_(p);
  var name = clean_(p.map, 40);
  if (!name || !p.image) throw new Error('Pick a map and an image.');
  var id = saveImage_(p.image, 'map-' + name + '.jpg');
  var sh = sheet_('Maps');
  var r = rows_('Maps').filter(function (x) { return x.name === name; })[0];
  if (r) sh.getRange(r._row, 2, 1, 3).setValues([[id, clean_(p.credit, 80), new Date().toISOString()]]);
  else sh.appendRow([name, id, clean_(p.credit, 80), new Date().toISOString()]);
  return maps_();
}

function addPin_(p) {
  var label = clean_(p.label, 30);
  if (!label) throw new Error('Give the callout a name.');
  var x = Math.max(0, Math.min(100, Number(p.x))), y = Math.max(0, Math.min(100, Number(p.y)));
  var type = ['callout', 'objective', 'vault', 'cashout', 'spawn', 'danger'].indexOf(p.type) >= 0 ? p.type : 'callout';
  sheet_('Pins').appendRow([Utilities.getUuid().slice(0, 8), clean_(p.map, 40), x, y, label, type, clean_(p.by, 32), new Date().toISOString()]);
  return maps_();
}

function deletePin_(p) {
  requireAdmin_(p);
  var r = rows_('Pins').filter(function (x) { return x.id === p.id; })[0];
  if (r) sheet_('Pins').deleteRow(r._row);
  return maps_();
}

/* =================== DISCORD =================== */

function postDiscord_(payload, pngDataUrl) {
  var hook = prop_('DISCORD_WEBHOOK');
  if (!hook) return;
  payload.username = payload.username || 'OWC High Command';
  if (pngDataUrl) {
    var m = String(pngDataUrl).match(/^data:image\/png;base64,(.+)$/);
    if (m) {
      var blob = Utilities.newBlob(Utilities.base64Decode(m[1]), 'image/png', 'owc-match.png');
      if (payload.embeds && payload.embeds[0]) payload.embeds[0].image = { url: 'attachment://owc-match.png' };
      UrlFetchApp.fetch(hook, { method: 'post', muteHttpExceptions: true,
        payload: { payload_json: JSON.stringify(payload), file: blob } });
      return;
    }
  }
  UrlFetchApp.fetch(hook, { method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify(payload) });
}
