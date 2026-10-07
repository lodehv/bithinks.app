import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncCatalogPages } from '../src/utils/catalogSync.js';
const store = (id, channel = 'shopee') => ({ id, name: id, channel, status: 'connected' });
test('follows every page including pages beyond the old provider cap', async () => {
  let calls = 0;
  const result = await syncCatalogPages({ listStores: async () => [store('a')],
    syncProductCatalog: async ({ storeId, offset }) => {
      assert.equal(storeId, 'a'); assert.equal(offset, calls * 10); calls++;
      return { synced: 10, nextOffset: calls < 51 ? calls * 10 : null };
    } });
  assert.equal(result.synced, 510); assert.deepEqual(result.errors, []);
});
test('retains partial progress and continues other stores after a provider failure', async () => {
  const result = await syncCatalogPages({ listStores: async () => [store('a'), store('b', 'tiktok')],
    syncProductCatalog: async ({ storeId }) => {
      if (storeId === 'a') throw new Error('provider offline');
      return { synced: 2, nextPageToken: null };
    } });
  assert.equal(result.synced, 2); assert.equal(result.errors[0].store, 'a');
});
test('stops a repeated cursor without claiming complete success', async () => {
  const result = await syncCatalogPages({ listStores: async () => [store('a')],
    syncProductCatalog: async () => ({ synced: 1, nextOffset: 0 }) });
  assert.equal(result.errors.length, 1);
});
test('preserves the server payment-required decision', async () => {
  const denial = { response: { status: 402 } };
  await assert.rejects(syncCatalogPages({ listStores: async () => [store('a')],
    syncProductCatalog: async () => { throw denial; } }), (error) => error === denial);
});
