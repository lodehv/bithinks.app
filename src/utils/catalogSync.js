/** Pull every page from every connected shop; preserve partial failure details. */
export async function syncCatalogPages(client, onProgress = () => {}) {
  const stores = (await client.listStores()).filter((store) =>
    store.status === 'connected' && ['shopee', 'tiktok'].includes(store.channel));
  if (!stores.length) throw new Error('Belum ada toko marketplace terhubung.');
  let synced = 0;
  const errors = [];
  for (const store of stores) {
    let offset = 0;
    let pageToken = '';
    const seen = new Set();
    try {
      while (true) {
        const cursor = JSON.stringify([offset, pageToken]);
        if (seen.has(cursor)) throw new Error('Sinkron belum lengkap. Coba lagi.');
        seen.add(cursor);
        onProgress({ store: store.name, synced });
        const result = await client.syncProductCatalog({ storeId: store.id, offset, pageToken });
        synced += result.synced;
        onProgress({ store: store.name, synced });
        if (result.nextOffset == null && !result.nextPageToken) break;
        offset = result.nextOffset ?? 0;
        pageToken = result.nextPageToken ?? '';
      }
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 402) throw error;
      errors.push({ store: store.name, message: error?.response?.data?.error?.message
        ?? 'Sinkron belum lengkap. Coba lagi.' });
    }
  }
  return { synced, errors };
}
