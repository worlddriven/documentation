#!/usr/bin/env node

import { describe, test } from 'node:test';
import assert from 'node:assert';
import { parseRepositories } from './parse-repositories.js';

describe('parseRepositories', () => {
  test('should return empty array for empty content', () => {
    const result = parseRepositories('');
    assert.deepStrictEqual(result, []);
  });

  test('should parse a single repository with description', () => {
    const content = `
## Current Repositories

## my-repo
- Description: A test repository
`;
    const result = parseRepositories(content);
    assert.deepStrictEqual(result, [
      {
        name: 'my-repo',
        description: 'A test repository'
      }
    ]);
  });

  test('should parse repository with description and topics', () => {
    const content = `
## Current Repositories

## my-repo
- Description: A test repository
- Topics: topic1, topic2, topic3
`;
    const result = parseRepositories(content);
    assert.deepStrictEqual(result, [
      {
        name: 'my-repo',
        description: 'A test repository',
        topics: ['topic1', 'topic2', 'topic3']
      }
    ]);
  });

  test('should parse multiple repositories', () => {
    const content = `
## Current Repositories

## repo-one
- Description: First repository
- Topics: topic1

## repo-two
- Description: Second repository
- Topics: topic2, topic3
`;
    const result = parseRepositories(content);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].name, 'repo-one');
    assert.strictEqual(result[1].name, 'repo-two');
  });

  test('should skip repositories inside code blocks', () => {
    const content = `
## Format

Example:

\`\`\`markdown
## example-repo
- Description: This is inside a code block
- Topics: example, test
\`\`\`

## Current Repositories

## real-repo
- Description: This is a real repository
`;
    const result = parseRepositories(content);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'real-repo');
    assert.strictEqual(result[0].description, 'This is a real repository');
  });

  test('should skip repositories without descriptions', () => {
    const content = `
## Current Repositories

## valid-repo
- Description: Valid repository

## invalid-repo
- Topics: topic1, topic2

## another-valid
- Description: Another valid one
`;
    const result = parseRepositories(content);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].name, 'valid-repo');
    assert.strictEqual(result[1].name, 'another-valid');
  });

  test('should skip heading with "example" in name', () => {
    const content = `
## Example
- Description: This should be skipped

## Current Repositories

## real-repo
- Description: This is real
`;
    const result = parseRepositories(content);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'real-repo');
  });

  test('should skip heading with "format" in name', () => {
    const content = `
## Format
- Description: This should be skipped

## Current Repositories

## real-repo
- Description: This is real
`;
    const result = parseRepositories(content);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'real-repo');
  });

  test('should skip heading with "current repositories" in name', () => {
    const content = `
## Current Repositories
- Description: This should be skipped

## real-repo
- Description: This is real
`;
    const result = parseRepositories(content);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'real-repo');
  });

  test('should handle nested code blocks correctly', () => {
    const content = `
## Documentation

Here's an example:

\`\`\`markdown
## worlddriven-core
- Description: Democratic governance system for GitHub pull requests
- Topics: democracy, open-source, governance, automation

## worlddriven-documentation
- Description: Vision, philosophy, and organization management for worlddriven
- Topics: documentation, organization-management, governance
\`\`\`

---

## Current Repositories

## actual-repo
- Description: This is the only real repository
- Topics: real, test
`;
    const result = parseRepositories(content);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'actual-repo');
    assert.strictEqual(result[0].description, 'This is the only real repository');
    assert.deepStrictEqual(result[0].topics, ['real', 'test']);
  });

  test('should handle topics with extra whitespace', () => {
    const content = `
## Current Repositories

## my-repo
- Description: Test repository
- Topics:  topic1 ,  topic2  , topic3
`;
    const result = parseRepositories(content);
    assert.deepStrictEqual(result[0].topics, ['topic1', 'topic2', 'topic3']);
  });

  test('should handle repositories without topics', () => {
    const content = `
## Current Repositories

## my-repo
- Description: Test repository without topics
`;
    const result = parseRepositories(content);
    assert.strictEqual(result[0].topics, undefined);
  });

  test('should parse repository with origin field for migration', () => {
    const content = `
## Current Repositories

## core
- Description: Democratic governance system for GitHub pull requests
- Topics: democracy, open-source, governance
- Origin: TooAngel/worlddriven
`;
    const result = parseRepositories(content);
    assert.deepStrictEqual(result, [
      {
        name: 'core',
        description: 'Democratic governance system for GitHub pull requests',
        topics: ['democracy', 'open-source', 'governance'],
        origin: 'TooAngel/worlddriven'
      }
    ]);
  });

  test('should parse multiple repositories with and without origin', () => {
    const content = `
## Current Repositories

## documentation
- Description: Core documentation repository
- Topics: documentation, worlddriven

## core
- Description: Democratic governance system
- Topics: governance
- Origin: TooAngel/worlddriven
`;
    const result = parseRepositories(content);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].origin, undefined);
    assert.strictEqual(result[1].origin, 'TooAngel/worlddriven');
  });

  test('should match actual REPOSITORIES.md structure', () => {
    const content = `# Worlddriven Organization Repositories

This file serves as the source of truth for all repositories in the worlddriven GitHub organization.

## Format

Each repository is defined using markdown headers and properties:

\`\`\`markdown
## repository-name
- Description: Brief description of the repository
- Topics: topic1, topic2, topic3
\`\`\`

## Example

\`\`\`markdown
## worlddriven-core
- Description: Democratic governance system for GitHub pull requests
- Topics: democracy, open-source, governance, automation

## worlddriven-documentation
- Description: Vision, philosophy, and organization management for worlddriven
- Topics: documentation, organization-management, governance
\`\`\`

---

## Current Repositories

<!-- Add repositories below this line -->
`;
    const result = parseRepositories(content);
    assert.deepStrictEqual(result, [], 'Should return empty array when no actual repositories are defined');
  });
});
