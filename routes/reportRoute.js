const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

router.get('/', async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  console.log(`➡️  /api/report request: dateFrom=${dateFrom}, dateTo=${dateTo}`);

  try {
    const rawSales = await fetchSalesData(dateFrom, dateTo);
    console.log(`📦 fetched ${rawSales.length} sales lines`);

    const grouped = await groupBySKU(rawSales);
    const filtered = grouped.filter(item => {
      const category = item.category?.toLowerCase() || '';
      return category.includes('new') || category.includes('ng');
    });

    console.log(`🔍 ${filtered.length} SKUs match 'new' or 'NG' category`);

    for (const skuObj of filtered) {
      const cost = await fetchCostForSKU(skuObj.sku);
      skuObj.cost = cost;
      await sleep(300); // Delay to avoid 429 rate limiting
    }

    res.json(filtered);
  } catch (err) {
    console.error('❌ Error in /api/report:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
