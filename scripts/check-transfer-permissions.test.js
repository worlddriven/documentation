#!/usr/bin/env node

import { describe, test, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import {
  checkTransferPermission,
  checkMultipleTransferPermissions,
} from './check-transfer-permissions.js';

describe('checkTransferPermission', () => {
  describe('input validation', () => {
    test('should throw error if token is missing', async () => {
      await assert.rejects(
        async () => await checkTransferPermission(null, 'owner/repo'),
        { message: 'GitHub token is required' }
      );
    });

    test('should throw error if originRepo is missing', async () => {
      await assert.rejects(
        async () => await checkTransferPermission('token', ''),
        { message: 'Origin repository must be in format "owner/repo-name"' }
      );
    });

    test('should throw error if originRepo format is invalid', async () => {
      await assert.rejects(
        async () => await checkTransferPermission('token', 'invalid-format'),
        { message: 'Origin repository must be in format "owner/repo-name"' }
      );
    });

    test('should throw error if originRepo has empty owner or repo', async () => {
      await assert.rejects(
        async () => await checkTransferPermission('token', '/repo'),
        { message: 'Invalid origin repository format' }
      );

      await assert.rejects(
        async () => await checkTransferPermission('token', 'owner/'),
        { message: 'Invalid origin repository format' }
      );
    });
  });

  describe('API response handling', () => {
    let originalFetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    test('should return hasPermission true when user has admin access', async () => {
      globalThis.fetch = mock.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              permissions: { admin: true, push: true, pull: true },
            }),
        })
      );

      const result = await checkTransferPermission('test-token', 'owner/repo');

      assert.strictEqual(result.hasPermission, true);
      assert.strictEqual(result.permissionLevel, 'admin');
      assert.ok(result.details.includes('admin access'));
    });

    test('should return hasPermission false when user has write access only', async () => {
      globalThis.fetch = mock.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              permissions: { admin: false, push: true, pull: true },
            }),
        })
      );

      const result = await checkTransferPermission('test-token', 'owner/repo');

      assert.strictEqual(result.hasPermission, false);
      assert.strictEqual(result.permissionLevel, 'write');
      assert.ok(result.details.includes('admin required'));
    });

    test('should return hasPermission false when user has read access only', async () => {
      globalThis.fetch = mock.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              permissions: { admin: false, push: false, pull: true },
            }),
        })
      );

      const result = await checkTransferPermission('test-token', 'owner/repo');

      assert.strictEqual(result.hasPermission, false);
      assert.strictEqual(result.permissionLevel, 'read');
    });

    test('should handle 404 response for non-existent repository', async () => {
      globalThis.fetch = mock.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
        })
      );

      const result = await checkTransferPermission('test-token', 'owner/repo');

      assert.strictEqual(result.hasPermission, false);
      assert.strictEqual(result.permissionLevel, 'none');
      assert.ok(result.details.includes('not found'));
    });

    test('should handle API errors gracefully', async () => {
      globalThis.fetch = mock.fn(() =>
        Promise.resolve({
          ok: false,
          status: 403,
          text: () => Promise.resolve('Rate limit exceeded'),
        })
      );

      const result = await checkTransferPermission('test-token', 'owner/repo');

      assert.strictEqual(result.hasPermission, false);
      assert.strictEqual(result.permissionLevel, 'unknown');
      assert.ok(result.details.includes('403'));
    });

    test('should handle network errors gracefully', async () => {
      globalThis.fetch = mock.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      const result = await checkTransferPermission('test-token', 'owner/repo');

      assert.strictEqual(result.hasPermission, false);
      assert.strictEqual(result.permissionLevel, 'error');
      assert.ok(result.details.includes('Network error'));
    });

    test('should handle missing permissions object in response', async () => {
      globalThis.fetch = mock.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        })
      );

      const result = await checkTransferPermission('test-token', 'owner/repo');

      assert.strictEqual(result.hasPermission, false);
      assert.strictEqual(result.permissionLevel, 'none');
    });
  });
});

describe('checkMultipleTransferPermissions', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('should return a Map with results for all repositories', async () => {
    let callCount = 0;
    globalThis.fetch = mock.fn(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            permissions: { admin: callCount === 1, push: true, pull: true },
          }),
      });
    });

    const repos = ['owner/repo1', 'owner/repo2'];
    const results = await checkMultipleTransferPermissions('test-token', repos);

    assert.ok(results instanceof Map);
    assert.strictEqual(results.size, 2);
    assert.strictEqual(results.get('owner/repo1').hasPermission, true);
    assert.strictEqual(results.get('owner/repo2').hasPermission, false);
  });

  test('should return empty Map for empty input array', async () => {
    const results = await checkMultipleTransferPermissions('test-token', []);

    assert.ok(results instanceof Map);
    assert.strictEqual(results.size, 0);
  });
});
