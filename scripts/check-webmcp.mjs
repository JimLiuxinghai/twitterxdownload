import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const hero = await readFile(new URL('../src/app/components/ui/Hero.js', import.meta.url), 'utf8');

for (const expected of [
    'document.modelContext',
    "name: 'prepare_x_media'",
    'inputRef.current.value = normalizedUrl',
    'await onDownloadRef.current(normalizedUrl)',
    'readOnlyHint: false',
    'untrustedContentHint: true',
]) {
    assert.ok(hero.includes(expected), `Hero.js 缺少 WebMCP 约束：${expected}`);
}

assert.equal((hero.match(/name: 'prepare_x_media'/g) || []).length, 1, 'prepare_x_media 必须只注册一次');
console.log('WebMCP check passed: prepare_x_media validates, fills, and starts the visible parser.');
