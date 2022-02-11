import React, {useState} from 'react';
import {Box, Button, Input, useToast, VStack} from 'native-base';
import {useNavigation} from '@react-navigation/native';
import {STACK_CUSTOMER_LIST} from '../stacks';
import {apiCreateCustomer} from "../../api/customer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {TOAST_DESCRIPTION, TOAST_TITLE} from "../../const/ErrorMessage";
import {Keyboard, TouchableWithoutFeedback} from "react-native";

const Page = () => {
  const navigation = useNavigation();
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerMemo, setCustomerMemo] = useState("");
  const toast = useToast();
  const id = "toastCreateCustomer";
  const [isLoading, setIsLoading] = useState(false)

  const handleChangeCustomerId = (event) => {
    setCustomerId(event)
  };

  const handleChangeCustomerName = (event) => {
    setCustomerName(event)
  };

  const handleChangeCustomerMemo = (event) => {
    setCustomerMemo(event)
  };

  const goToCustomerListPage = () => navigation.push(STACK_CUSTOMER_LIST);

  const registerCustomer = async () => {
    try {
      setIsLoading(true);
      Keyboard.dismiss();
      const isDataValid = checkData(customerId.trim(), customerName.trim());
      if (isDataValid) {
        let customerInfo = await AsyncStorage.getItem('customerInfo')
        customerInfo = JSON.parse(customerInfo);
        const response = await apiCreateCustomer(customerId.trim(), customerName.trim(), customerInfo.companyId, customerMemo.trim())
        if (!toast.isActive(id)) {
          if (response?.message === "SUCCESS") {
            toast.show({
              id,
              title: TOAST_TITLE.Created,
              status: 'success',
              description: TOAST_DESCRIPTION.RegisterSuccess,
              duration: 1000
            });
          } else if (response?.message === 'VALID_CUSTOMER_ID') {
            toast.show({
              id,
              title: TOAST_TITLE.SomeThingWrong,
              status: 'error',
              description: TOAST_DESCRIPTION.CustomerIdExisted,
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
          description: TOAST_DESCRIPTION.CannotRegisterCustomer,
          duration: 1000
        });
      }
    } finally {
      setIsLoading(false)
    }
  }

  const checkData = (customerId, customerName) => {
    if (!toast.isActive(id)) {
      if (customerId.length === 0) {
        toast.show({
          id,
          title: TOAST_TITLE.SomeThingWrong,
          status: 'info',
          description: TOAST_DESCRIPTION.InputCustomerId,
          duration: 1000
        });
        return false;
      } else if (customerName.length === 0) {
        toast.show({
          id,
          title: TOAST_TITLE.SomeThingWrong,
          status: 'info',
          description: TOAST_DESCRIPTION.InputCustomerName,
          duration: 1000
        });
        return false;
      }
    }
    return true;
  }

  return (
    <Box style={styles.fillContent} safeArea p={4}>
      <VStack space={1}>
        <Input value={customerId} onChangeText={handleChangeCustomerId} placeholder="ID: ○○ "/>
        <Input value={customerName} onChangeText={handleChangeCustomerName} placeholder="名前: ○○ "/>
      </VStack>
      <VStack space="3" pt={3} style={styles.fillContent}>
        <Input style={styles.fillContent} value={customerMemo} onChangeText={handleChangeCustomerMemo} multiline={true}
               type="text" textAlignVertical={'top'} placeholder="メモ"/>
      </VStack>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <VStack space={1} mt={2} style={styles.footer}>
          <Button.Group
            colorScheme="blue"
            mx={{
              base: 'auto',
              md: 0,
            }}
            size="md">
            <Button style={styles.fillContent} colorScheme="indigo" onPress={goToCustomerListPage}>
              戻る
            </Button>
            <Button style={styles.fillContent} colorScheme="indigo" onPress={registerCustomer} isLoading={isLoading}>
              保存
            </Button>
          </Button.Group>
        </VStack>
      </TouchableWithoutFeedback>
    </Box>
  );
};

const styles = {
  fillContent: {
    flex: 1
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
  }
};

export default Page;
