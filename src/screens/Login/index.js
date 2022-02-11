import React, {useState} from 'react';
import {Box, Button, FormControl, Heading, HStack, Input, useToast, VStack,} from 'native-base';
import {useNavigation} from '@react-navigation/native';
import {STACK_HOME, STACK_REGISTER} from '../stacks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {apiLogin} from "../../api/auth_entry_api";
import {TOAST_DESCRIPTION, TOAST_TITLE} from '../../const/ErrorMessage';
import {Keyboard, TouchableWithoutFeedback} from "react-native";
import {KeyboardAwareScrollView} from "react-native-keyboard-aware-scroll-view";

const Page = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState();
  const [password, setPassword] = useState();
  const toast = useToast();
  const [isLoadingRegister, setIsLoadingRegister] = useState(false);
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const id = "toastLogin";

  const handleLogin = async () => {
    Keyboard.dismiss();
    setIsLoadingLogin(true)
    try {
      const isDataValid = checkData(username.trim(), password);
      if (isDataValid) {
        const response = await apiLogin(username.trim(), password);
        if (response?.message === 'SUCCESS') {
          await AsyncStorage.setItem(
            "customerInfo",
            JSON.stringify({
              "customerId": response.account.username,
              "accessToken": response.tokens.access.token,
              "customerName": response.account.accountName.replace('%20', ' '),
              "companyId": response.account.companyId
            })
          );
          navigation.navigate(STACK_HOME);
        }
      }
    } catch (e) {
      if (!toast.isActive(id)) {
        toast.show({
          id,
          title: TOAST_TITLE.SomeThingWrong,
          status: 'warning',
          description: TOAST_DESCRIPTION.UsernameOrPassWordIncorrect,
          duration: 1000
        });
      }

    } finally {
      setIsLoadingLogin(false)
    }
  };

  const checkData = (username, password) => {
    if (!toast.isActive(id)) {
      if (username.length === 0) {
        toast.show({
          id,
          title: TOAST_TITLE.SomeThingWrong,
          status: 'info',
          description: TOAST_DESCRIPTION.InputAccountId,
          duration: 1000
        });
        return false;
      } else if (password.length === 0) {
        toast.show({
          id,
          title: TOAST_TITLE.SomeThingWrong,
          status: 'info',
          description: TOAST_DESCRIPTION.InputPassword,
          duration: 1000
        });
        return false;
      }
    }
    return true;
  };

  const handleRegister = () => {
    setIsLoadingRegister(true)
    setTimeout(function () {
      setIsLoadingRegister(false)
      navigation.push(STACK_REGISTER)
    }, 1000);
  };

  const handleChangeUsername = (event) => {
    setUsername(event);
  }

  const handleChangePassword = (event) => {
    setPassword(event);
  }

  return (
    <KeyboardAwareScrollView keyboardShouldPersistTaps='handled'>
      <Box style={styles.fillContent} safeArea p={4}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <HStack>
            <Heading
              alignItems="center"
              size="lg"
              pt="20%"
              fontWeight="600"
              color="coolGray.800"
              mx={{
                base: "auto",
                md: "0",
              }}
              _dark>
              ログイン画面
            </Heading>
          </HStack>
        </TouchableWithoutFeedback>
        <VStack space={3} mt={5}>
          <FormControl isRequired>
            <FormControl.Label>ID</FormControl.Label>
            <Input
              value={username}
              onChangeText={handleChangeUsername}
              defaultValue=""
              type="text"
            />
          </FormControl>
          <FormControl isRequired>
            <FormControl.Label>パスワード</FormControl.Label>
            <Input
              value={password}
              onChangeText={handleChangePassword}
              defaultValue=""
              type="password"
            />
          </FormControl>
          <Button
            mt="2"
            colorScheme="indigo"
            onPress={handleLogin}
            isLoading={isLoadingLogin}>
            ログイン
          </Button>
          <Button mt="2" colorScheme="indigo" onPress={handleRegister} isLoading={isLoadingRegister}>
            アカウント作成
          </Button>
        </VStack>
      </Box>
    </KeyboardAwareScrollView>
  );
};

const styles = {
  fillContent: {
    flex: 1
  },
};

export default Page;
