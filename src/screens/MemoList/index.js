import React, {useEffect, useState} from 'react';
import {Box, Button, FlatList, Heading, HStack, Input, Text, useToast, VStack} from 'native-base';
import {useNavigation} from '@react-navigation/native';
import {STACK_HOME} from '../stacks';
import {apiGetMemos} from "../../api/memo";
import {TOAST_DESCRIPTION, TOAST_TITLE} from '../../const/ErrorMessage';
import {TABLE_CONSTANT} from '../../const/TableConstant';
import {MemoListDetail} from "../../components/MemoListDetail";
import {ActivityIndicator, Keyboard, TouchableOpacity, TouchableWithoutFeedback, View} from "react-native";
import {ItemSeparatorView} from "../../components/ItemSeparatorView";
import {Row} from "react-native-table-component";

const Page = () => {
  const navigation = useNavigation();
  const [dataMemos, setDataMemos] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [keyword, setkeyword] = useState();
  const toast = useToast();
  const [isEndData, setIsEndData] = useState(false);
  const [endData, setEndData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState();
  const [isLoadingSearchMemo, setIsLoadingSearchMemo] = useState(false);

  useEffect(() => {
    getData()
  }, [limit]);

  const getData = async () => {
    try {
      setLoading(true);

      const response = await apiGetMemos(null, page, limit);
      if (response?.memos?.data?.length) {
        setTotal(response.memos.data.length);
        setDataMemos([...dataMemos, ...response.memos.data])
        setLoading(false);
      } else {
        setIsEndData(true);
      }
      if (response.memos.data.length < limit) {
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
      const response = await apiGetMemos(keyword ? keyword : null, page + 1, limit);
      if (response?.memos?.data?.length) {
        setDataMemos([...dataMemos, ...response.memos.data])
        if ((response.memos.data.length < limit) || (total + response.memos.data.length === response.memos.total)) {
          setIsEndData(true)
        } else {
          setTotal(total + response.memos.data.length);
          setIsEndData(false);
          setEndData(false);
        }
      }
      setLoading(false);
    } catch (e) {
      toast.show({
        title: TOAST_TITLE.SomeThingWrong,
        status: 'warning',
        description: TOAST_DESCRIPTION.CannotGetData,
        duration: 1000
      });
    }
  }

  const searchMemo = async () => {
    try {
      Keyboard.dismiss();
      setIsLoadingSearchMemo(true)
      setPage(1);
      setTotal(0);
      setEndData(false);
      setIsEndData(false);
      setLoading(true);
      const response = await apiGetMemos(keyword ? keyword : null, 1, limit)
      if (response?.memos?.data?.length) {
        setDataMemos(response.memos.data);
        if ((response.memos.data.length < limit) || (response.memos.data.length === response.memos.total)) {
          setIsEndData(true);
        } else {
          setTotal(response?.memos?.data?.length)
          setIsEndData(false);
          setEndData(false);
        }
      } else {
        setDataMemos([]);
        setIsEndData(true);
        setEndData(true)
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
      setIsLoadingSearchMemo(false)
    }
  };

  const handleChangeKeyword = (event) => {
    setkeyword(event);
  }

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

  const goToHomePage = () => navigation.navigate(STACK_HOME);

  return (
    <Box style={styles.fillContent} safeArea p={4}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <HStack>
          <Heading
            alignItems="center"
            size="xl"
            fontWeight="600"
            color="coolGray.800"
            mx={{
              base: "auto",
              md: "0",
            }}
            bold={true}>
            メモ一覧
          </Heading>
        </HStack>
      </TouchableWithoutFeedback>
      <HStack pb={2}>
        <Input type="text" h={defaultControlHeight} style={styles.fillContent} placeholder="キーワード"
               value={keyword} onChangeText={handleChangeKeyword}/>
        <Button
          ml={2}
          h={defaultControlHeight}
          colorScheme="indigo"
          onPress={searchMemo} isLoading={isLoadingSearchMemo}>
          検索
        </Button>
      </HStack>
      <Row data={TABLE_CONSTANT.tableHeadMemo}/>
      <ItemSeparatorView/>
      <FlatList
        data={dataMemos}
        keyExtractor={(item, index) => index.toString()}
        ItemSeparatorComponent={ItemSeparatorView}
        enableEmptySections={true}
        renderItem={MemoListDetail}
        ListFooterComponent={renderFooter}
      />
      <VStack space={1} mt={2}>
        <Button colorScheme="indigo" onPress={goToHomePage}>
          ホームへ
        </Button>
      </VStack>
    </Box>
  );
};

const defaultControlHeight = 10;

const styles = {
  fillContent: {
    flex: 1
  },
  loadMoreBtn: {
    padding: 10,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endData: {
    color: 'red'
  }
};

export default Page;
