// Integration test for lib/authorization.ts
// Verifies role-level allow/deny for each permission helper (Issue #184 acceptance criteria)
require('ts-node').register({ transpileOnly: true, preferTsExts: true });

const assert = require('node:assert');
const { describe, it } = require('node:test');

const {
  isRoleCode,
  canAccessAdmin,
  canUseScoreInput,
  canEditMatches,
  canViewPages,
} = require('../lib/authorization.ts');

describe('isRoleCode', () => {
  it('returns true for valid role codes', () => {
    assert.strictEqual(isRoleCode('admin'), true);
    assert.strictEqual(isRoleCode('editor'), true);
    assert.strictEqual(isRoleCode('viewer'), true);
  });

  it('returns false for invalid role codes', () => {
    assert.strictEqual(isRoleCode('superadmin'), false);
    assert.strictEqual(isRoleCode(''), false);
    assert.strictEqual(isRoleCode('ADMIN'), false);
    assert.strictEqual(isRoleCode('moderator'), false);
  });
});

describe('canAccessAdmin — only admin is allowed', () => {
  it('admin can access admin pages', () => {
    assert.strictEqual(canAccessAdmin('admin'), true);
  });

  it('editor cannot access admin pages', () => {
    assert.strictEqual(canAccessAdmin('editor'), false);
  });

  it('viewer cannot access admin pages', () => {
    assert.strictEqual(canAccessAdmin('viewer'), false);
  });
});

describe('canUseScoreInput — admin and editor are allowed', () => {
  it('admin can use score input', () => {
    assert.strictEqual(canUseScoreInput('admin'), true);
  });

  it('editor can use score input', () => {
    assert.strictEqual(canUseScoreInput('editor'), true);
  });

  it('viewer cannot use score input', () => {
    assert.strictEqual(canUseScoreInput('viewer'), false);
  });
});

describe('canEditMatches — admin and editor are allowed', () => {
  it('admin can edit matches', () => {
    assert.strictEqual(canEditMatches('admin'), true);
  });

  it('editor can edit matches', () => {
    assert.strictEqual(canEditMatches('editor'), true);
  });

  it('viewer cannot edit matches', () => {
    assert.strictEqual(canEditMatches('viewer'), false);
  });
});

describe('canViewPages — all roles are allowed', () => {
  it('admin can view pages', () => {
    assert.strictEqual(canViewPages('admin'), true);
  });

  it('editor can view pages', () => {
    assert.strictEqual(canViewPages('editor'), true);
  });

  it('viewer can view pages', () => {
    assert.strictEqual(canViewPages('viewer'), true);
  });
});

describe('privilege escalation regression — viewer must never gain write permissions', () => {
  it('viewer has no write or admin permissions', () => {
    assert.strictEqual(canAccessAdmin('viewer'), false, 'viewer must not access admin');
    assert.strictEqual(canUseScoreInput('viewer'), false, 'viewer must not use score input');
    assert.strictEqual(canEditMatches('viewer'), false, 'viewer must not edit matches');
  });

  it('editor has no admin permissions', () => {
    assert.strictEqual(canAccessAdmin('editor'), false, 'editor must not access admin');
  });
});
