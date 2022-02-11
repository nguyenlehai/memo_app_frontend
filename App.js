/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useEffect, useMemo} from 'react';
import {NativeBaseProvider, Center, KeyboardAvoidingView} from 'native-base';
import {RootSiblingParent} from 'react-native-root-siblings';
import Screens from './src/screens';
import {Context, useGlobalState} from './src/hooks/global';
import SplashScreen from './src/screens/Splash';
import useInitApp from './src/hooks/useInitApp';

const App = () => {
  const [globalState, dispatch] = useGlobalState();
  const initAppAction = useInitApp(dispatch);

  const contextMemo = useMemo(() => {
    return {
      ...globalState,
      dispatch,
    };
  }, [globalState, dispatch]);

  const isLoaded = useMemo(() => globalState.isLoaded, [globalState.isLoaded]);
  useEffect(() => {
    initAppAction();
  }, [initAppAction]);
  if (!isLoaded) {
    return renderSplashScreen();
  }

  return (
    <RootSiblingParent>
      <Context.Provider value={contextMemo}>
        <NativeBaseProvider>
          <KeyboardAvoidingView style={styles.container}>
            <Screens />
          </KeyboardAvoidingView>
        </NativeBaseProvider>
      </Context.Provider>
    </RootSiblingParent>
  );
};

function renderSplashScreen() {
  return (
    <NativeBaseProvider>
      <Center flex={1} px="3">
        <SplashScreen />
      </Center>
    </NativeBaseProvider>
  );
}

const styles = {
  container: {
    flex: 1
  }
}

export default App;
