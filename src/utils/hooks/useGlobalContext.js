import {useReducer} from 'react';
import {EFFECT_AUTH_STATE, EFFECT_RECORD} from 'configs/action';

const handleEffectAuth = (state, user) => {
  return {
    ...state,
    user,
  };
};

const handleEffectRecord = (state, isRecording) => {
  return {
    ...state,
    isRecording,
  };
};

/**
 *
 * @param {Object} state
 * @param {Object} action
 * @param {string} action.name
 * @param {Object} action.data
 */
const reducer = (state, action) => {
  switch (action.name) {
    case EFFECT_AUTH_STATE:
      return handleEffectAuth(state, action.data);
    case EFFECT_RECORD:
      return handleEffectRecord(state, action.data);
    default:
      break;
  }
};

export default (initialState = {}) => useReducer(reducer, initialState);
