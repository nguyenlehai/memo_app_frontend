import axios, {AxiosInstance} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BASE_URL} from '../configs';
import * as __ from 'lodash';
import jwt_decode from "jwt-decode";

const qs = require('querystring');
const TOKEN_DRIFT_TIME = 5; // 5s

class Client {
  /**
   * @param {AxiosInstance} axios
   */
  constructor(axios) {
    this.axios = axios;
  }

  /**
   * @param {string} path
   * @param {object|null} options
   * @returns {Promise<Object>}
   */
  async get(path, options) {
    path = this._makePath(path, options);
    options = __.omit(options || {}, ['queries']);
    return this.axios.get(path, options).then(response => response.data);
  }

  /**
   * @param {string} path
   * @param {object|null} body
   * @param {object|null} options
   * @returns {Promise<Object>}
   */
  async post(path, body, options) {
    path = this._makePath(path, options);
    options = __.omit(options || {}, ['queries']);

    const headers = options.headers || {};
    headers['Content-Type'] = 'application/json';
    options.headers = headers;
    body = typeof body === 'string' ? JSON.parse(body) : body;
    return this.axios.post(path, body, options).then(response => response.data);
  }

  /**
   * @param {string} path
   * @param {object|null} body
   * @param {object|null} options
   * @returns {Promise<Object>}
   */
  async put(path, body, options) {
    path = this._makePath(path, options);
    options = __.omit(options || {}, ['queries']);
    const headers = options.headers || {};
    headers['Content-Type'] = 'application/json';
    options.headers = headers;
    body = JSON.parse(body);
    return this.axios.put(path, body, options).then(response => response.data);
  }

  /**
   * @param {string} path
   * @param {object|null} options
   * @returns {string}
   */
  _makePath(path, options) {
    if (options && options.queries) {
      const q = qs.stringify(options.queries || {});
      if (q.length > 0) {
        if (path.includes('?')) {
          path = '&' + q;
        } else {
          path = '?' + q;
        }
      }
    }
    return path;
  }

  /**
   * @param {object} body
   * @param {boolean} json
   * @returns {FormData}
   */
  _makeBody(body, json) {
    if (!body) {
      return body;
    }
    if (json) {
      return JSON.stringify(body);
    }
    const formData = new FormData();
    Object.keys(body).forEach(key => {
      const value = body[key];
      if (value === undefined || value === null) {
        return;
      }
      formData.append(key, value);
    });
    return formData;
  }
}

class AuthClient extends Client {
  async peekAuth() {
    const refreshToken = await AsyncStorage.getItem('client.refresh_token');
    return !!refreshToken && isTokenValid(refreshToken);
  }

  /**
   * @param {string} path
   * @param {object|null} options
   * @returns {Promise<Object>}
   */
  async get(path, options) {
    options = await this._prepare(options);
    return super.get(path, options).catch(async e => {
      if (isUnAuthorizedException(e)) {
        await this._clearAccessToken();
        options = await this._prepare(options);
        return super.get(path, options);
      }
      throw e;
    });
  }

  /**
   * @param {string} path
   * @param {object|null} body
   * @param {object|null} options
   * @returns {Promise<Object>}
   */
  async post(path, body, options) {
    options = await this._prepare(options);
    const headers = options.headers || {};
    headers['Content-Type'] = 'application/json';
    options.headers = headers;
    body = this._makeBody(body, true);
    return super.post(path, body, options).catch(async e => {
      if (isUnAuthorizedException(e)) {
        await this._clearAccessToken();
        options = await this._prepare(options);
        return super.post(path, body, options);
      }
      throw e;
    });
  }

  /**
   * @param {string} path
   * @param {object|null} body
   * @param {object|null} options
   * @returns {Promise<Object>}
   */
  async put(path, body, options) {
    options = await this._prepare(options);
    const headers = options.headers || {};
    headers['Content-Type'] = 'application/json';
    options.headers = headers;
    body = this._makeBody(body, true);
    return super.put(path, body, options).catch(async e => {
      if (isUnAuthorizedException(e)) {
        await this._clearAccessToken();
        options = await this._prepare(options);
        return super.put(path, body, options);
      }
      throw e;
    });
  }

  /**
   * @param {{token: string, refresh_token: string}} payload
   */
  async update(payload) {
    await AsyncStorage.multiSet([
      ['client.access_token', payload.access.token],
      ['client.refresh_token', payload.refresh.token],
    ]);
  }

  async _prepare(options) {
    const accessToken = await AsyncStorage.getItem('client.access_token');
    if (!accessToken || !isTokenValid(accessToken)) {
      await this._refresh();
    }
    options = options || {};
    const headers = options.headers || {};
    headers['Authorization'] = `Bearer ${accessToken}`;
    options.headers = headers;
    return options;
  }

  async _refresh() {
    await this._clearAccessToken();
    const refreshToken = await AsyncStorage.getItem('client.refresh_token');
    if (!refreshToken || !isTokenValid(refreshToken)) {
      await this._clearAccessToken();
      await this._clearRefreshToken();
      throw new Error('Not auth error');
    }
    const options = {
      headers: {
        'x-api-key': refreshToken,
      },
    };
    try {
      const response = await this.axios.post('v1/token/refresh', {
        "refreshToken": refreshToken
      }, options);
      await this.update(response.data);
    } catch (e) {
      await this._clearAccessToken();
      await this._clearRefreshToken();
      throw e;
    }
  }

  async _clearAccessToken() {
    await AsyncStorage.removeItem('client.access_token');
  }

  async _clearRefreshToken() {
    await AsyncStorage.removeItem('client.refresh_token');
  }
}

function isUnAuthorizedException(ex) {
  return ex?.status === 401;
}

/**
 * @param {string} token
 * @returns {boolean}
 */
function isTokenValid(token) {
  try {
    let payload = jwt_decode(token);
    const exp = payload.exp - TOKEN_DRIFT_TIME;
    const now = Date.now() / 1000;
    return now < exp;
  } catch (e) {
    return false;
  }
}

const axiosInstance = axios.create({
  baseURL: BASE_URL,
})

export const client = new Client(axiosInstance);

export const authClient = new AuthClient(axiosInstance);
