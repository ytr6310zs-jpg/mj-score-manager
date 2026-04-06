const assert = require('node:assert/strict');

// Ensure ts-node can require TypeScript modules
require('ts-node').register({ transpileOnly: true, preferTsExts: true });

const { validateAndParseMatchForm } = require('../lib/validate-match.ts');

function fdFrom(obj) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      for (const item of v) fd.append(k, String(item));
    } else {
      fd.append(k, String(v));
    }
  }
  return fd;
}

function run() {
  // valid 4p
  let fd = fdFrom({
    gameDate: '2026-04-06',
    gameType: '4p',
    player1: 'A',
    player2: 'B',
    player3: 'C',
    player4: 'D',
    score1: '250',
    score2: '100',
    score3: '-200',
    score4: '-150',
    tobiPlayer: 'C',
    tobashiPlayer: 'D',
    yakitori1: 'on',
    notes: 'ok',
  });
  let res = validateAndParseMatchForm(fd);
  assert.ok(res.ok, 'valid 4p should parse');
  const data = res.data;
  assert.strictEqual(data.gameDate, '2026-04-06');
  assert.deepStrictEqual(data.players, ['A', 'B', 'C', 'D']);
  assert.strictEqual(data.total, 0);

  // duplicate players
  fd = fdFrom({
    gameDate: '2026-04-06',
    gameType: '4p',
    player1: 'A',
    player2: 'A',
    player3: 'C',
    player4: 'D',
    score1: '250',
    score2: '100',
    score3: '-200',
    score4: '-150',
  });
  res = validateAndParseMatchForm(fd);
  assert.ok(!res.ok, 'duplicate players should fail');
  assert.ok(/別の名前/.test(res.message || ''), 'duplicate message');

  // missing tobashi
  fd = fdFrom({
    gameDate: '2026-04-06',
    gameType: '4p',
    player1: 'A',
    player2: 'B',
    player3: 'C',
    player4: 'D',
    score1: '250',
    score2: '100',
    score3: '-200',
    score4: '-150',
    tobiPlayer: 'C',
  });
  res = validateAndParseMatchForm(fd);
  assert.ok(!res.ok, 'missing tobashi should fail');
  assert.ok(/飛びと飛ばし/.test(res.message || ''), 'tobi/tobashi message');

  // same tobi/tobashi
  fd = fdFrom({
    gameDate: '2026-04-06',
    gameType: '4p',
    player1: 'A',
    player2: 'B',
    player3: 'C',
    player4: 'D',
    score1: '250',
    score2: '100',
    score3: '-200',
    score4: '-150',
    tobiPlayer: 'C',
    tobashiPlayer: 'C',
  });
  res = validateAndParseMatchForm(fd);
  assert.ok(!res.ok, 'same tobi/tobashi should fail');
  assert.ok(/同じ/.test(res.message || ''), 'same-player message');

  // out-of-range score
  fd = fdFrom({
    gameDate: '2026-04-06',
    gameType: '4p',
    player1: 'A',
    player2: 'B',
    player3: 'C',
    player4: 'D',
    score1: '2000',
    score2: '0',
    score3: '0',
    score4: '-2000',
  });
  res = validateAndParseMatchForm(fd);
  assert.ok(!res.ok, 'out-of-range score should fail');
  assert.ok(/スコア/.test(res.message || ''), 'score-range message');

  return 0;
}

try {
  run();
  // success
  // eslint-disable-next-line no-console
  console.log('validate-match tests passed');
  process.exit(0);
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
}
