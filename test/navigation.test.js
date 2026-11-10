import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('page has a sticky horizontal navigation with anchor offset', () => {
  const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  assert.match(html,/href="\/painel\/navigation\.css"/);
  const css=readFileSync(new URL('../public/navigation.css',import.meta.url),'utf8');
  assert.match(css,/\.sidebar\s*\{[^}]*position\s*:\s*sticky/s);
  assert.match(css,/scroll-margin-top/);
});
