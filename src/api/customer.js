import {authClient} from './client';
const querystring = require('querystring');

/**
 * @param {string} customerId
 * @param {string} customerName
 * @param {string} companyId
 * @param {string} note
 */
export async function apiCreateCustomer(customerId, customerName, companyId, note) {
  try {
    return await authClient.post('v1/customers', {customerId, customerName, companyId, note}, null);
  } catch (e) {
    console.log('apiCreateCustomer', e);
  }
}

/**
 * @param {string} keyword
 * @param {int} page
 * @param {int} limit
 */
export async function apiGetCustomers(keyword, page, limit) {
  try {
    const queries = {
      keyword: keyword ? keyword : null,
      page: page ? page : 0,
      limit: limit ? limit : 0,
    };
    return await authClient.get(`v1/customers?${querystring.stringify(queries).replace('%20', ' ')}`, null);
  } catch (e) {
    console.log('apiGetCustomers', e);
  }
}
