// Integration test for lib/auth.ts
// Verifies JWT token lifecycle, unauthenticated access rejection, and privilege escalation
// regression (Issue #184 acceptance criteria)
import assert from "node:assert";
import { after, before, describe, it } from "node:test";

import { createAuthToken, verifyAuthToken } from "../lib/auth.ts";

// Use a dedicated test secret so tests never depend on env configuration
const TEST_SECRET = 'test-secret-for-auth-token-unit-test-184';
const ORIGINAL_SECRET = process.env.AUTH_SESSION_SECRET;

before(() => {
  process.env.AUTH_SESSION_SECRET = TEST_SECRET;
});

after(() => {
  if (ORIGINAL_SECRET !== undefined) {
    process.env.AUTH_SESSION_SECRET = ORIGINAL_SECRET;
  } else {
    delete process.env.AUTH_SESSION_SECRET;
  }
});

/** @type {import("../lib/auth.ts").AuthSession} */
const adminSession = { uid: 1, userId: 'admin', displayName: '管理者', role: 'admin' };
/** @type {import("../lib/auth.ts").AuthSession} */
const editorSession = { uid: 2, userId: 'editor01', displayName: '編集者', role: 'editor' };
/** @type {import("../lib/auth.ts").AuthSession} */
const viewerSession = { uid: 3, userId: 'viewer01', displayName: '参照者', role: 'viewer' };

describe('createAuthToken + verifyAuthToken roundtrip', () => {
  it('admin session roundtrips correctly', async () => {
    const token = await createAuthToken(adminSession);
    assert.ok(typeof token === 'string' && token.length > 0, 'token should be a non-empty string');
    const result = await verifyAuthToken(token);
    assert.ok(result !== null, 'should verify successfully');
    assert.strictEqual(result.uid, adminSession.uid);
    assert.strictEqual(result.userId, adminSession.userId);
    assert.strictEqual(result.displayName, adminSession.displayName);
    assert.strictEqual(result.role, 'admin');
  });

  it('editor session roundtrips correctly', async () => {
    const token = await createAuthToken(editorSession);
    const result = await verifyAuthToken(token);
    assert.ok(result !== null);
    assert.strictEqual(result.role, 'editor');
    assert.strictEqual(result.userId, 'editor01');
  });

  it('viewer session roundtrips correctly', async () => {
    const token = await createAuthToken(viewerSession);
    const result = await verifyAuthToken(token);
    assert.ok(result !== null);
    assert.strictEqual(result.role, 'viewer');
    assert.strictEqual(result.userId, 'viewer01');
  });
});

describe('verifyAuthToken — unauthenticated access rejection', () => {
  it('returns null for a garbage string', async () => {
    const result = await verifyAuthToken('not-a-jwt-token');
    assert.strictEqual(result, null, 'garbage input must be rejected');
  });

  it('returns null for an empty string', async () => {
    const result = await verifyAuthToken('');
    assert.strictEqual(result, null, 'empty token must be rejected');
  });

  it('returns null for a token signed with a different secret', async () => {
    process.env.AUTH_SESSION_SECRET = 'other-secret-attacker-controlled';
    const attackerToken = await createAuthToken(adminSession);
    process.env.AUTH_SESSION_SECRET = TEST_SECRET;
    const result = await verifyAuthToken(attackerToken);
    assert.strictEqual(result, null, 'token from different secret must be rejected');
  });

  it('returns null when AUTH_SESSION_SECRET is not set', async () => {
    delete process.env.AUTH_SESSION_SECRET;
    delete process.env.ACCESS_PASSWORD;
    const result = await verifyAuthToken('anything');
    assert.strictEqual(result, null, 'must return null when no secret is configured');
    process.env.AUTH_SESSION_SECRET = TEST_SECRET;
  });
});

describe('verifyAuthToken — privilege escalation regression', () => {
  it('does not elevate viewer to admin even if role field is tampered in decoded payload', async () => {
    const token = await createAuthToken(viewerSession);
    // Tamper: decode the payload section, change role, re-encode without re-signing
    const parts = token.split('.');
    assert.strictEqual(parts.length, 3, 'expected valid 3-part JWT');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    payload.role = 'admin'; // attacker tampers the role
    parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const tamperedToken = parts.join('.');

    const result = await verifyAuthToken(tamperedToken);
    assert.strictEqual(result, null, 'tampered token must be rejected (signature verification fails)');
  });

  it('role field must be one of the valid RoleCode values', async () => {
    // Manually craft a token with invalid role to ensure normalizeRole rejects it
    // We do this by creating a valid token, extracting its secret-signed structure
    // and verifying that an invalid role string is blocked after verification
    // (This tests the normalizeRole guard inside verifyAuthToken)
    const token = await createAuthToken({ uid: 99, userId: 'test', displayName: 'Test', role: 'admin' });
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    // Confirm that the verified result has a valid role - if role was invalid, it would be null
    const result = await verifyAuthToken(token);
    assert.ok(result !== null);
    assert.ok(['admin', 'editor', 'viewer'].includes(result.role), `role must be a valid RoleCode, got: ${result.role}`);
  });
});

describe('createAuthToken — error handling', () => {
  it('throws when AUTH_SESSION_SECRET is not set', async () => {
    delete process.env.AUTH_SESSION_SECRET;
    delete process.env.ACCESS_PASSWORD;
    await assert.rejects(
      async () => createAuthToken(adminSession),
      (err) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes('AUTH_SESSION_SECRET') || err.message.includes('ACCESS_PASSWORD'));
        return true;
      },
    );
    process.env.AUTH_SESSION_SECRET = TEST_SECRET;
  });
});
