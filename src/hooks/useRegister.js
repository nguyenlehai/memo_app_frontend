import {useCallback, useContext, useState} from 'react';
import {UPDATE_AUTH_STATE_ACTION} from './actions/auth';
import {GlobalContext} from './global';
import {apiRegister} from '../api/auth_entry_api';

export function useRegister() {
  const {dispatch} = useContext(GlobalContext);
  const [isLoading, setLoading] = useState(false);

  const runRegisterCallback = useCallback(
    async (username, password, accountName, companyId) => {
      setLoading(true);
      try {
        const user = await apiRegister(username, password, accountName, companyId);
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
    runRegisterCallback,
  };
}
