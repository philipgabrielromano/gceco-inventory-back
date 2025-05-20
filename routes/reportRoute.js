// server/routes/reportRoute.js
const express = require('express');
const router = express.Router();

const { fetchSalesData } = require('../services/posService');
const { fetchCostForSKU } = require('../services/inflowService');
const { groupBySKU } = require('../utils/aggregate');

router.get('/', async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  console.log(`➡️  Received /api/report request: dateFrom=${dateFrom}, dateTo=${dateTo}`);

  if (!dateFrom || !dateTo) {
    console.log('❌ Missing dateFrom or dateTo query parameter.');
    return res.status(400).json({ error: 'Missing dateFrom or dateTo query parameters' });
  }

  try {
    console.log('🔄 Calling fetchSalesData...');
    const rawSales = await fetchSalesData(dateFrom, dateTo);
    console.log(`✅ fetchSalesData returned ${rawSales.length} records.`);

    if (rawSales.length === 0) {
      console.log('⚠️ No sales data found for the given date range.');
    }

    console.log('🔄 Grouping data by SKU...');
    const grouped = await groupBySKU(rawSales);
    console.log(`✅ Grouped into ${grouped.length} SKU entries.`);

    for (const skuObj of grouped) {
      const cost = await fetchCostForSKU(skuObj.sku);
      skuObj.cost = cost;
      console.log(`💵 Added cost for SKU ${skuObj.sku}: ${cost ?? 'N/A'}`);
    }

    console.log('🚀 Sending response...');
    res.json(grouped);
  } catch (err) {
    console.error('❌ Error during /api/report processing:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
