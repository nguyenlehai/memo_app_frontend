import {authClient} from './client';

const querystring = require('querystring');

/**
 * @param {string} customerId
 * @param {string} memo
 */
export async function apiCreateMemo(customerId, memo) {
  try {
    return await authClient.post('v1/memos', {customerId, memo}, {});
  } catch (e) {
    console.log('apiCreateMemo', e);
  }
}

/**
 * @param {string} keyword
 * @param {int} page
 * @param {int} limit
 */
export async function apiGetMemos(keyword, page, limit) {
  try {
    const queries = {
      keyword: keyword ? keyword : null,
      page: page ? page : null,
      limit: limit ? limit : 0,
    };
    return await authClient.get(`v1/memos?${querystring.stringify(queries).replace('%20', ' ')}`, null);
  } catch (e) {
    console.log('apiGetMemos', e);
  }
}

/**
 * @typedef ObjectData
 * @property {string} memo
 * @property {int} id
 *
 * @param {int} id
 * @param {ObjectData} data
 */
export async function apiUpdateMemo(id, data) {
  try {
    return await authClient.put(`v1/memos/${id}`, data, null);
  } catch (e) {
    console.log('apiUpdateMemo', e);
  }
}
