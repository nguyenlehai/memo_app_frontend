import {authClient, client} from './client';

/**
 * @param {string} username
 * @param {string} password
 */
export async function apiLogin(username, password) {
  const response = await client.post('v1/auth/sign-in', {username, password}, null);
  await authClient.update(response.tokens);
  return response;
}

/**
 * @param {string} username
 * @param {string} password
 * @param {string} accountName
 * @param {string} companyId
 */
export async function apiRegister(username, password, accountName, companyId) {
  try {
    return await client.post('v1/accounts', {
      username,
      password,
      accountName,
      companyId,
    }, null);
  } catch (e) {
    console.log('apiRegister', e);
  }
}
