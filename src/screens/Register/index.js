import * as React from 'react';
import {useState} from 'react';
import {Box, Button, Heading, Input, Text, useToast, VStack,} from 'native-base';
import {useNavigation} from '@react-navigation/native';
import {STACK_HOME, STACK_LOGIN} from '../stacks';
import {TOAST_DESCRIPTION, TOAST_TITLE} from "../../const/ErrorMessage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {apiRegister} from "../../api/auth_entry_api";
import {KeyboardAwareScrollView} from "react-native-keyboard-aware-scroll-view";
import {Keyboard} from "react-native";

const Page = () => {
  const toast = useToast();
  const [companyId, setCompanyId] = useState();
  const [username, setUsername] = useState();
  const [accountName, setAccountName] = useState();
  const [password, setPassword] = useState();
  const [serviceId, setServiceId] = useState();
  const id = "toastCreateAccount";
  const [isLoadingRegister, setIsLoadingRegister] = useState(false)

  const navigation = useNavigation();

  const handleRegister = async () => {
    try {
      Keyboard.dismiss();
      setIsLoadingRegister(true)
      const isDataValid = checkValue(username.trim(), password.trim(), accountName.trim(), companyId.trim());
      if (isDataValid) {
        const response = await apiRegister(serviceId !== '' ? serviceId.trim() + "_" + username.trim() : username.trim(), password.trim(), accountName.trim(), companyId.trim());
        if (!toast.isActive(id)) {
          if (response?.message === "SUCCESS") {
            toast.show({
              id,
              title: TOAST_TITLE.AccountVerified,
              status: 'success',
              description: TOAST_DESCRIPTION.SignUpSuccess,
              duration: 1000
            });
            await AsyncStorage.setItem(
              "customerInfo",
              JSON.stringify({
                "customerId": response.account.username,
                "accessToken": response.tokens.access.token,
                "customerName": response.account.accountName.replace('%20', ' '),
                "companyId": response.account.companyId
              })
            );
            await AsyncStorage.multiSet([
              ['client.access_token', response.tokens.access.token],
              ['client.refresh_token', response.tokens.refresh.token],
            ]);
            navigation.navigate(STACK_HOME);
          } else if (response?.message === "VALID_COMPANY") {
            toast.show({
              id,
              title: TOAST_TITLE.SomeThingWrong,
              status: 'error',
              description: TOAST_DESCRIPTION.CompanyIdNotExisted,
              duration: 1000
            });
          } else if (response?.message === "VALID_USERNAME") {
            toast.show({
              id,
              title: TOAST_TITLE.SomeThingWrong,
              status: 'error',
              description: TOAST_DESCRIPTION.IdExisted,
              duration: 1000
            });
          }
        }
      }
    } catch (e) {
      if (!toast.isActive(id)) {
        toast.show({
          id,
          title: TOAST_TITLE.SomeThingWrong,
          status: 'error',
          description: TOAST_DESCRIPTION.CannotRegisterAccount,
          duration: 1000
        });
      }
    } finally {
      setIsLoadingRegister(false)
    }
  };

  const checkValue = (username, password, accountName, companyId) => {
    if (!toast.isActive(id)) {
      if (companyId.length === 0) {
        toast.show({
          id,
          title: TOAST_TITLE.SomeThingWrong,
          status: 'info',
          description: TOAST_DESCRIPTION.InputCompanyId,
          duration: 1000
        });
        return false;
      } else if (username.length === 0) {
        toast.show({
          id,
          title: TOAST_TITLE.SomeThingWrong,
          status: 'info',
          description: TOAST_DESCRIPTION.InputAccountId,
          duration: 1000
        });
        return false;
      } else if (accountName.length === 0) {
        toast.show({
          id,
          title: TOAST_TITLE.SomeThingWrong,
          status: 'info',
          description: TOAST_DESCRIPTION.InputAccountName,
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

  const handleChangeCompanyID = (event) => {
    setCompanyId(event)
  }

  const handleChangeUsername = (event) => {
    setUsername(event)
  }

  const handleChangeAccountName = (event) => {
    setAccountName(event)
  }

  const handleChangePassword = (event) => {
    setPassword(event)
  }

  const handleChangeServiceId = (event) => {
    setServiceId(event)
  }

  const _onLogin = () => navigation.push(STACK_LOGIN);

  return (
    <KeyboardAwareScrollView keyboardShouldPersistTaps='handled'>
      <Box style={styles.fillContent} safeArea p={4}>
        <Heading
          alignItems="center"
          size="xl"
          fontWeight="400"
          color="coolGray.800"
          mt={15}
          mx={{
            base: "auto",
            md: "0",
          }}
          _dark>
          アカウント作成画面
        </Heading>
        <VStack mt={5}>
          <Text>会社ID<Text style={{color: 'red'}}> *</Text></Text>
          <Input
            value={companyId}
            onChangeText={handleChangeCompanyID}
            defaultValue=""
            type="text"
          />
          <Text>ID<Text style={{color: 'red'}}> *</Text></Text>
          <Input
            value={username}
            onChangeText={handleChangeUsername}
            defaultValue=""
            type="text"
          />
          <Text>アカウント名<Text style={{color: 'red'}}> *</Text></Text>
          <Input
            value={accountName}
            onChangeText={handleChangeAccountName}
            defaultValue=""
            type="text"
          />
          <Text>パスワード<Text style={{color: 'red'}}> *</Text></Text>
          <Input
            value={password}
            onChangeText={handleChangePassword}
            defaultValue=""
            type="password"
          />
          <Text>サービスID</Text>
          <Input
            value={serviceId}
            onChangeText={handleChangeServiceId}
            defaultValue=""
            type="text"
          />
        </VStack>
        <VStack space={1} mt={2}>
          <Button
            mt="2"
            colorScheme="indigo"
            isLoading={isLoadingRegister}
            onPress={handleRegister}>
            登録
          </Button>
          <Text>アカウントをお持ちの方</Text>
          <Button mt="2" colorScheme="indigo" onPress={_onLogin}>
            ログイン
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
