import React, {useContext, useEffect} from 'react';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import stackConfigs, {STACK_HOME, STACK_LOGIN, STACK_REGISTER, STACK_REGISTER_CUSTOMER} from './stacks';

import HomeScreen from './Home';
import LoginScreen from './Login';
import RegisterScreen from './Register';
import CreateMemoScreen from './CreateMemo';
import MemoListScreen from './MemoList';
import CustomerListScreen from './CustomerList';
import SearchMemoScreen from './SearchMemo';
import EditMemoScreen from './EditMemo';
import RegisterCustomerScreen from './RegisterCustomer';

import {GlobalContext} from '../hooks/global';

const Stack = createStackNavigator();

function isEntryScreen(name) {
  return name === STACK_LOGIN || name === STACK_REGISTER;
}

function shouldAuthScreen(name) {
  return name !== STACK_LOGIN && name !== STACK_REGISTER;
}

const Stacks = () => {
  const navigation = useNavigation();
  const currentRoute = navigation.getCurrentRoute()?.name;
  const {isLogin} = useContext(GlobalContext);

  useEffect(() => {
    if (isLogin) {
      if (isEntryScreen(currentRoute)) {
        navigation.navigate(STACK_HOME);
      }
    } else {
      if (shouldAuthScreen(currentRoute)) {
        navigation.navigate(STACK_LOGIN);
      }
    }
  }, [isLogin, currentRoute, navigation]);
  return (
    <Stack.Navigator>
      <Stack.Screen {...stackConfigs.LOGIN} component={LoginScreen} />
      <Stack.Screen {...stackConfigs.HOME} component={HomeScreen}/>
      <Stack.Screen {...stackConfigs.CREATE_MEMO} component={CreateMemoScreen}/>
      <Stack.Screen {...stackConfigs.MEMO_LIST} component={MemoListScreen}/>
      <Stack.Screen {...stackConfigs.CUSTOMER_LIST} component={CustomerListScreen}/>
      <Stack.Screen {...stackConfigs.REGISTER} component={RegisterScreen}/>
      <Stack.Screen {...stackConfigs.SEARCH_MEMO} component={SearchMemoScreen}/>
      <Stack.Screen {...stackConfigs.EDIT_MEMO} component={EditMemoScreen}/>
      <Stack.Screen {...stackConfigs.REGISTER_CUSTOMER} component={RegisterCustomerScreen}/>
    </Stack.Navigator>
  );
};

const Screens = () => {
  return (
    <NavigationContainer>
      <Stacks />
    </NavigationContainer>
  );
};

export default Screens;
