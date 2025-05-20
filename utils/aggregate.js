// server/utils/aggregate.js
function groupBySKU(records) {
  const grouped = {};

  for (const rec of records) {
    const sku = rec.SKU;
    const storeId = rec.StoreId;
    const transId = rec.TransId;
    const key = `${sku}-${storeId}`;

    if (!grouped[sku]) {
  grouped[sku] = {
    sku,
    description: rec.Description,
    category: rec.Category,
    totalQuantitySold: 0,
    totalRevenue: 0,
    totalOrders: new Set(),
    stores: {}
  };
}

    const skuGroup = grouped[sku];
    skuGroup.totalQuantitySold += rec.Qty;
    skuGroup.totalRevenue += rec.Qty * rec.Price;
    skuGroup.totalOrders.add(transId);

    if (!skuGroup.stores[storeId]) {
      skuGroup.stores[storeId] = {
        storeId,
        storeName: '',
        quantitySold: 0,
        revenue: 0,
        orders: new Set()
      };
    }

    const store = skuGroup.stores[storeId];
    store.quantitySold += rec.Qty;
    store.revenue += rec.Qty * rec.Price;
    store.orders.add(transId);
  }

  return Object.values(grouped).map(skuEntry => {
    return {
      ...skuEntry,
      totalOrders: skuEntry.totalOrders.size,
      stores: Object.values(skuEntry.stores).map(s => ({
        ...s,
        orders: s.orders.size
      }))
    };
  });
}

module.exports = { groupBySKU };
