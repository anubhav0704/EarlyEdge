import test from 'node:test';
import assert from 'node:assert';

// Test relative time helper
const formatTimeAgo = (ts) => {
  const now = Date.now();
  const diff = now - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

// Test cleanHtmlEntities helper
const cleanHtmlEntities = (str) => {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&deg;/g, '°');
};

test.describe('Utility Helpers Tests', () => {
  test('formatTimeAgo should format timestamps correctly', () => {
    const now = Date.now();
    
    assert.strictEqual(formatTimeAgo(now), 'Just now');
    assert.strictEqual(formatTimeAgo(now - 5 * 60 * 1000), '5m ago');
    assert.strictEqual(formatTimeAgo(now - 3 * 60 * 60 * 1000), '3h ago');
    assert.strictEqual(formatTimeAgo(now - 24 * 60 * 60 * 1000), 'Yesterday');
    assert.strictEqual(formatTimeAgo(now - 4 * 24 * 60 * 60 * 1000), '4d ago');
  });

  test('cleanHtmlEntities should decode special entities', () => {
    assert.strictEqual(cleanHtmlEntities('Hello &quot;World&quot;'), 'Hello "World"');
    assert.strictEqual(cleanHtmlEntities('It&#039;s a test'), "It's a test");
    assert.strictEqual(cleanHtmlEntities('&lt;div&gt;'), '<div>');
    assert.strictEqual(cleanHtmlEntities('Gold &amp; Silver'), 'Gold & Silver');
  });
});
