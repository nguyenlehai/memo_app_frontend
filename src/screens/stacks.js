import * as React from 'react';

export const STACK_LOGIN = 'LOGIN';
export const STACK_REGISTER = 'REGISTER';
export const STACK_HOME = 'HOME';
export const STACK_CREATE_MEMO = 'CREATE_MEMO';
export const STACK_MEMO_LIST = 'MEMO_LIST';
export const STACK_CUSTOMER_LIST = 'CUSTOMER_LIST';
export const STACK_SEARCH_MEMO = 'SEARCH_MEMO';
export const STACK_EDIT_MEMO = 'EDIT_MEMO';
export const STACK_REGISTER_CUSTOMER = 'REGISTER_CUSTOMER';

const allStacks = [
  STACK_LOGIN,
  STACK_REGISTER,
  STACK_HOME,
  STACK_CREATE_MEMO,
  STACK_MEMO_LIST,
  STACK_CUSTOMER_LIST,
  STACK_SEARCH_MEMO,
  STACK_EDIT_MEMO,
  STACK_REGISTER_CUSTOMER,
];

const configs = allStacks.reduce((stacks, name) => {
  stacks[name] = {
    name,
    options: {
      header: () => <></>,
    },
  };
  return stacks;
}, {});

export default configs;
