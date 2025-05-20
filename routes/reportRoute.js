// server/routes/reportRoute.js
const express = require('express');
const router = express.Router();

const { fetchSalesData } = require('../services/posService');
const { fetchCostForSKU, fetchOrderedQuantity } = require('../services/inflowService');
const { groupBySKU } = require('../utils/aggregate');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

router.get('/', async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  const logs = [];

  function log(message) {
    console.log(message);
    logs.push(message);
  }

  log(`➡️  /api/report request: dateFrom=${dateFrom}, dateTo=${dateTo}`);

  if (!dateFrom || !dateTo) {
    return res.status(400).json({ error: 'Missing dateFrom or dateTo query parameters' });
  }

  try {
    const rawSales = await fetchSalesData(dateFrom, dateTo);
    log(`📦 fetchSalesData returned ${rawSales.length} records`);

    const grouped = await groupBySKU(rawSales);

    const filtered = grouped.filter(item => {
      const category = item.category?.toLowerCase() || '';
      return category.includes('new') || category.includes('ng');
    });

    log(`🔍 Filtered to ${filtered.length} SKUs with 'new' or 'NG' in category`);

    for (const skuObj of filtered) {
      log(`💡 Fetching data for SKU: ${skuObj.sku}`);

      const cost = await fetchCostForSKU(skuObj.sku);
      skuObj.cost = cost;
      log(`💵 Cost for ${skuObj.sku}: ${cost ?? 'N/A'}`);
      await sleep(2000);

      const orderedQty = await fetchOrderedQuantity(skuObj.sku, dateFrom, dateTo);
      skuObj.orderedQuantity = orderedQty ?? 0;
      log(`📦 Ordered Qty for ${skuObj.sku}: ${orderedQty ?? 'N/A'}`);
      await sleep(2000);
    }

    res.json({ data: filtered, logs });
  } catch (err) {
    console.error('❌ Error in /api/report:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
