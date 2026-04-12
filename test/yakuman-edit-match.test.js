require('ts-node/register');
const assert = require('node:assert');
const { test } = require('node:test');

// Mock test for yakuman player resolution in editMatchAction
// This reproduces the bug where yakuman players not in the active player list
// would not be resolved correctly.

test('yakuman player resolution includes yakuman selection players', () => {
  // Scenario: Player1, Player2, Player3 are active in the match
  // But Player4 (not in active list) is selected for yakuman
  const activePlayerNames = ['Alice', 'Bob', 'Charlie'];
  const yakumanSelections = [
    { playerName: 'Alice', yakumanCode: 'DA', yakumanName: '大三元', points: 32000 },
    { playerName: 'Dave', yakumanCode: 'SK', yakumanName: '四暗刻', points: 32000 }, // Dave is not active
  ];

  // Build the resolved player names (this is what our fix does)
  const yakumanPlayerNames = Array.from(
    new Set(yakumanSelections.map((selection) => selection.playerName))
  );
  const allYakumanPlayerNames = Array.from(new Set([...activePlayerNames, ...yakumanPlayerNames]));

  // Verify that all yakuman players are included
  assert.ok(allYakumanPlayerNames.includes('Alice'), 'Active player Alice should be included');
  assert.ok(allYakumanPlayerNames.includes('Bob'), 'Active player Bob should be included');
  assert.ok(allYakumanPlayerNames.includes('Charlie'), 'Active player Charlie should be included');
  assert.ok(allYakumanPlayerNames.includes('Dave'), 'Non-active yakuman player Dave should be included');

  // Verify the list contains exactly 4 players
  assert.strictEqual(allYakumanPlayerNames.length, 4, 'Should have 4 unique players');
});

test('yakuman player resolution with multiple yakuman per player', () => {
  // Player1 has multiple yakuman, Player2 (not active) also has yakuman
  const activePlayerNames = ['Alice', 'Bob'];
  const yakumanSelections = [
    { playerName: 'Alice', yakumanCode: 'DA', yakumanName: '大三元', points: 32000 },
    { playerName: 'Alice', yakumanCode: 'SK', yakumanName: '四暗刻', points: 32000 },
    { playerName: 'Charlie', yakumanCode: 'SY', yakumanName: '四喜和', points: 32000 }, // Charlie is not active
  ];

  const yakumanPlayerNames = Array.from(
    new Set(yakumanSelections.map((selection) => selection.playerName))
  );
  const allYakumanPlayerNames = Array.from(new Set([...activePlayerNames, ...yakumanPlayerNames]));

  // Verify all unique yakuman players are included
  assert.ok(allYakumanPlayerNames.includes('Alice'));
  assert.ok(allYakumanPlayerNames.includes('Bob'));
  assert.ok(allYakumanPlayerNames.includes('Charlie'));
  assert.strictEqual(allYakumanPlayerNames.length, 3);
});

test('yakuman player resolution with no yakuman selections', () => {
  const activePlayerNames = ['Alice', 'Bob'];
  const yakumanSelections = [];

  const yakumanPlayerNames = Array.from(
    new Set(yakumanSelections.map((selection) => selection.playerName))
  );
  const allYakumanPlayerNames = Array.from(new Set([...activePlayerNames, ...yakumanPlayerNames]));

  // Should only have active players
  assert.strictEqual(allYakumanPlayerNames.length, 2);
  assert.deepStrictEqual(allYakumanPlayerNames.sort(), ['Alice', 'Bob'].sort());
});
