// server/services/inflowService.js
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
    if (products.length && products[0].defaultVendorCost) {
      return parseFloat(products[0].defaultVendorCost.amount);
    }
  } catch (err) {
    console.error(`Error fetching cost for SKU ${sku}:`, err.response?.data || err.message);
  }
  return null;
}

module.exports = { fetchCostForSKU };
