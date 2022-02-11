import {authClient} from '../api';
import {LOAD_INIT_SUCCESSFUL} from './actions';
import {useCallback} from 'react';

export default function useInitApp(dispatch) {
  return useCallback(async () => {
    const auth = await authClient.peekAuth();
    await delayed(1000);
    dispatch({
      name: LOAD_INIT_SUCCESSFUL,
      payload: {
        isLogin: auth,
        isLoaded: true,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function delayed(wait) {
  return new Promise(resolve => {
    setTimeout(resolve, wait);
  });
}
