import {createContext, useReducer} from 'react';
import {LOAD_INIT_SUCCESSFUL} from './actions';
import {UPDATE_AUTH_STATE_ACTION} from './actions/auth';

const INIT_STATE = {
  isLoaded: false,
  isLogin: false,
  authInfo: null,
};

const reducer = (state, action) => {
  switch (action.name) {
    case LOAD_INIT_SUCCESSFUL:
    case UPDATE_AUTH_STATE_ACTION:
      return {...state, ...action.payload};
  }
  return state;
};

export const Context = createContext();
export const GlobalContext = Context;

export const useGlobalState = () => useReducer(reducer, INIT_STATE);
