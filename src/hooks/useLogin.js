import {useCallback, useContext, useState} from 'react';
import {apiLogin} from '../api/auth_entry_api';
import {UPDATE_AUTH_STATE_ACTION} from './actions/auth';
import {GlobalContext} from './global';

export function useLogin() {
  const {dispatch} = useContext(GlobalContext);
  const [isLoading, setLoading] = useState(false);

  const runLoginCallback = useCallback(
    async (username, password) => {
      setLoading(true);
      try {
        const user = await apiLogin(username, password);
        dispatch({
          name: UPDATE_AUTH_STATE_ACTION,
          payload: {
            isLogin: !!user,
            authInfo: user,
          },
        });
        return user;
      } finally {
        setLoading(false);
      }
    },
    [dispatch],
  );

  return {
    isLoading,
    runLoginCallback,
  };
}
