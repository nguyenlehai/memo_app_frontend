import React, {useEffect, useState} from 'react';
import {Box, Button, FlatList, Input, Text, useToast, VStack} from 'native-base';
import {useNavigation} from '@react-navigation/native';
import {STACK_REGISTER_CUSTOMER, STACK_SEARCH_MEMO} from '../stacks';
import {CustomerListDetail} from "../../components/CustomerListDetail";
import {TOAST_DESCRIPTION, TOAST_TITLE} from '../../const/ErrorMessage';
import {TABLE_CONSTANT} from '../../const/TableConstant';
import {apiGetCustomers} from "../../api/customer";
import {ActivityIndicator, Keyboard, TouchableOpacity, TouchableWithoutFeedback, View} from "react-native";
import {ItemSeparatorView} from "../../components/ItemSeparatorView";
import {Row} from "react-native-table-component";

const Page = () => {
  const navigation = useNavigation();
  const toast = useToast();
  const [dataCustomer, setDataCustomer] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [isEndData, setIsEndData] = useState(false);
  const [endData, setEndData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSearchCustomer, setIsLoadingSearchCustomer] = useState(false);

  useEffect(() => {
    getData()
  }, [limit]);

  const getData = async () => {
    try {
      setLoading(true);
      setPage(page === 1 ? page : page + 1);
      const response = await apiGetCustomers(null, page, limit);
      if (response?.customers?.data?.length) {
        setTotal(response.customers.data.length);
        setDataCustomer([...dataCustomer, ...response.customers.data]);
        setLoading(false);
      } else {
        setIsEndData(true);
      }
      if (response.customers.data.length < limit) {
        setIsEndData(true);
      }
    } catch (e) {
      toast.show({
        title: TOAST_TITLE.SomeThingWrong,
        status: 'warning',
        description: TOAST_DESCRIPTION.CannotGetData,
        duration: 1000
      });
    }
  }

  const loadMoreData = async () => {
    try {
      setLoading(true);
      setPage(page + 1);
      const response = await apiGetCustomers(keyword ? keyword : null, page + 1, limit);
      if (response?.customers?.data?.length) {
        setDataCustomer([...dataCustomer, ...response.customers.data]);
        if ((response.customers.data.length < limit) || (total + response.customers.data.length === response.customers.total)) {
          setIsEndData(true)
        } else {
          setTotal(total + response.customers.data.length);
          setLoading(false);
        }
      }
    } catch (e) {
      toast.show({
        title: TOAST_TITLE.SomeThingWrong,
        status: 'warning',
        description: TOAST_DESCRIPTION.CannotGetData,
        duration: 1000
      });
    }
  }

  const registerCustomer = () => {
    setIsLoading(true)
    setTimeout(function () {
      setIsLoading(false)
      navigation.navigate(STACK_REGISTER_CUSTOMER);
    }, 1000);
  };

  const searchCustomer = async () => {
    try {
      setIsLoadingSearchCustomer(true)
      Keyboard.dismiss();
      setDataCustomer([]);
      setTotal(0);
      setEndData(false);
      setIsEndData(false);
      setPage(1)
      setLoading(true);
      const response = await apiGetCustomers(keyword ? keyword : null, 1, limit);
      if (response?.customers?.data?.length) {
        setDataCustomer(response.customers.data);
        if ((response.customers.data.length < limit) || (response.customers.data.length === response.customers.total)) {
          setIsEndData(true);
        } else {
          setTotal(response?.customers?.data?.length)
          setIsEndData(false);
          setEndData(false);
        }
      } else {
        setDataCustomer([]);
        setIsEndData(true);
        setEndData(true);
      }
    } catch (e) {
      toast.show({
        title: TOAST_TITLE.SomeThingWrong,
        status: 'warning',
        description: TOAST_DESCRIPTION.CannotSearchData,
        duration: 1000
      });
    } finally {
      setLoading(false);
      setIsLoadingSearchCustomer(false);
    }
  }

  const handleModalChangeCustomerId = (event) => {
    setKeyword(event)
  };

  const renderFooter = () => {
    if (isEndData) {
      if (endData) {
        return <Text style={styles.endData}>データがありません。</Text>
      }
      return <Text/>;
    }
    return (
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.loadMoreBtn}>
          <Button onPress={loadMoreData}>もっと読み込む</Button>
          {loading ? (<ActivityIndicator color="red" style={{marginLeft: 8}}/>) : null}
        </TouchableOpacity>
      </View>
    )
  };

  const _goToSearchMemoPage = () => navigation.navigate(STACK_SEARCH_MEMO);

  return (
    <Box style={styles.fillContent} safeArea p={4}>
      <VStack space={1} pb={2}>
        <Input value={keyword} onChangeText={handleModalChangeCustomerId} placeholder="ID or 名前: ○○ "/>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <VStack style={styles.buttonGroup}>
            <Button.Group
              colorScheme="blue"
              mx={{
                base: 'auto',
                md: 0,
              }}
              size="md">
              <Button colorScheme="indigo" onPress={registerCustomer} isLoading={isLoading}>
                登録
              </Button>
              <Button colorScheme="indigo" onPress={searchCustomer} isLoading={isLoadingSearchCustomer}>
                検索
              </Button>
            </Button.Group>
          </VStack>
        </TouchableWithoutFeedback>
      </VStack>
      <Row data={TABLE_CONSTANT.tableHeadCustomerList}/>
      <ItemSeparatorView/>
      <FlatList
        data={dataCustomer}
        keyExtractor={(item, index) => index.toString()}
        ItemSeparatorComponent={ItemSeparatorView}
        enableEmptySections={true}
        renderItem={CustomerListDetail}
        ListFooterComponent={renderFooter}
      />
      <VStack space={1} mt={2}>
        <Button colorScheme="indigo" onPress={_goToSearchMemoPage}>
          戻る
        </Button>
      </VStack>
    </Box>
  );
};

const styles = {
  fillContent: {
    flex: 1
  },
  alignRight: {
    flex: 1,
    alignItems: 'flex-end'
  },
  loadMoreBtn: {
    padding: 10,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonGroup: {
    justifyContent: 'flex-end',
  },
  endData: {
    color: 'red'
  }
};

export default Page;
