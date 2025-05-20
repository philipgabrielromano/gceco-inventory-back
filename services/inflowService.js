const axios = require('axios');

const BASE_URL = `https://cloudapi.inflowinventory.com/${process.env.INFLOW_COMPANY_ID}`;
const HEADERS = {
  'Authorization': `Bearer ${process.env.INFLOW_API_KEY}`,
  'Accept': 'application/json;version=2024-10-01'
};

async function fetchCostForSKU(sku) {
  try {
    const res = await axios.get(`${BASE_URL}/products`, {
      headers: HEADERS,
      params: {
        'filter[smart]': sku
      }
    });

    const products = res.data;
    if (products.length) {
      const product = products[0];

      // Try vendor cost first
      if (product.defaultVendorCost?.amount) {
        return parseFloat(product.defaultVendorCost.amount);
      }

      // Fall back to default price
      if (product.defaultPrice?.amount) {
        console.warn(`⚠️ Using defaultPrice for SKU ${sku}`);
        return parseFloat(product.defaultPrice.amount);
      }

      console.warn(`⚠️ No cost or price found for SKU ${sku}`);
    } else {
      console.warn(`⚠️ No InFlow product found for SKU ${sku}`);
    }
  } catch (err) {
    console.error(`❌ Error fetching cost for SKU ${sku}:`, err.response?.data || err.message);
  }

  return null;
}

module.exports = { fetchCostForSKU };
