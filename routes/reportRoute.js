// server/routes/reportRoute.js
const express = require('express');
const router = express.Router();

const { fetchSalesData } = require('../services/posService');
const { fetchCostForSKU } = require('../services/inflowService');
const { groupBySKU } = require('../utils/aggregate');

router.get('/', async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  if (!dateFrom || !dateTo) {
    return res.status(400).json({ error: 'Missing dateFrom or dateTo query parameters' });
  }

  try {
    const rawSales = await fetchSalesData(dateFrom, dateTo);
    const grouped = await groupBySKU(rawSales);

    for (const skuObj of grouped) {
      const cost = await fetchCostForSKU(skuObj.sku);
      skuObj.cost = cost;
    }

    res.json(grouped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
