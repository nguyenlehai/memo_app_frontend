import React, {useCallback, useEffect, useRef, useState} from 'react';
import {AlertDialog, Box, Button, FlatList, HStack, Input, Text, useToast, VStack} from 'native-base';
import {useNavigation} from '@react-navigation/native';
import {STACK_HOME, STACK_MEMO_LIST} from '../stacks';
import MicButton from '../../components/MicButton';
import SpeechToText from '../../components/SpeechToText';
import {apiCreateMemo} from "../../api/memo";
import {apiGetCustomers} from "../../api/customer";
import {ModalCustomerListDetail} from "../../components/ModalCustomerListDetail";
import {ItemSeparatorView} from "../../components/ItemSeparatorView";
import {TOAST_DESCRIPTION, TOAST_TITLE} from "../../const/ErrorMessage";
import {TABLE_CONSTANT} from "../../const/TableConstant";
import {ActivityIndicator, Keyboard, TouchableOpacity, TouchableWithoutFeedback, View} from "react-native";
import {Row} from "react-native-table-component";
import Modal from "react-native-modal";

const useInputState = (onChange) => {
  const [value, setValue] = useState('');
  return {
    value, onChangeText(text) {
      setValue(text)
      if (onChange) {
        onChange(text);
      }
    }
  };
};

const Page = () => {
  const sptRef = useRef();
  const navigation = useNavigation();
  const [stableMessage, setStableMessage] = useState('');
  const [candidateMessage, setCandidateMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const toast = useToast();
  const [page, setPage] = useState(1);
  const limit = 10;
  const [value, setValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const [dataCustomer, setDataCustomer] = useState([]);
  const [isListening, setListening] = useState(false);
  const [checkBlurOnSubmit, setCheckBlurOnSubmit] = useState(false);
  const [isInvalidValue, setIsInvalidValue] = useState(false);
  const [isEndData, setIsEndData] = useState(false);
  const [endData, setEndData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = React.useState(false);
  const [total, setTotal] = useState();
  const [isLoadingOpenModal, setIsLoadingOpenModal] = useState(false)
  const [isLoadingSearchCustomer, setIsLoadingSearchCustomer] = useState(false)
  const [isLoadingSaveMemo, setIsLoadingSaveMemo] = useState(false)
  const [isLoadingGoToMemoList, setIsLoadingGoToMemoList] = useState(false)
  const multilineInputState = useInputState(useCallback((text) => {
    if (!isListening) {
      setStableMessage(text)
      setCandidateMessage("")
    }
  }, [isListening]));
  const id = "toastMemo";

  const loadMoreData = async () => {
    try {
      setLoading(true);
      setPage(page + 1);
      const response = await apiGetCustomers(keyword ? keyword : null, page + 1, limit);
      if (response?.customers?.data?.length) {
        setDataCustomer([...dataCustomer, ...response.customers.data]);
        if ((response.customers.data.length < limit) || (total + response.customers.data.length === response.customers.total)) {
          setIsEndData(true);
        } else {
          setLoading(false);
          setTotal(total + response.customers.data.length)
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

  const onMicButtonPressed = useCallback(() => {
    Keyboard.dismiss();
    const listening = isListening;
    setListening(!listening);
    if (!listening) {
      if (stableMessage.length > 0) {
        setStableMessage(stableMessage.trim() + "\n");
      }
      sptRef.current.start();
    } else {
      if (candidateMessage.length > 0) {
        setStableMessage(stableMessage + candidateMessage + '。');
      }
      sptRef.current.cancel();
    }
    setCandidateMessage('');
  }, [isListening, stableMessage, candidateMessage]);

  const onStartListen = useCallback(listening => {
  }, []);

  const onSpeechEnd = useCallback(byUser => {
    if (byUser) {
      if (candidateMessage.length > 0) {
        multilineInputState.onChangeText(stableMessage + candidateMessage + '\n')
      }
      setCheckBlurOnSubmit(true);
      setListening(false);
    } else {
      multilineInputState.onChangeText(stableMessage + candidateMessage + '。')
      sptRef.current.resume(); // continue start listening
    }
  }, []);

  const onMessage = useCallback((message, final) => {
    if (final) {
      setCandidateMessage('');
      if (message.length > 0) {
        setStableMessage(previous => {
          return previous + message + "。";
        });
      }
    } else {
      setCandidateMessage(message);
    }
  }, []);

  useEffect(() => {
    multilineInputState.onChangeText(stableMessage + candidateMessage);
  }, [multilineInputState, stableMessage, candidateMessage]);

  const onClose = () => setIsOpen(false)
  const onOk = () => {
    setIsOpen(false);
    navigation.navigate(STACK_HOME);
  }
  const cancelRef = React.useRef(null)

  const _goToHomePage = () => {
    if (multilineInputState.value.length !== 0) {
      setIsOpen(!isOpen);
    } else {
      navigation.navigate(STACK_HOME);
    }
  };

  const saveMemo = async () => {
    try {
      Keyboard.dismiss();
      setIsLoadingSaveMemo(true)
      if (!toast.isActive(id)) {
        if (value && multilineInputState.value) {
          const responseCreateMemo = await apiCreateMemo(value, multilineInputState.value);
          if (responseCreateMemo) {
            toast.show({
              id,
              title: TOAST_TITLE.Saved,
              status: 'success',
              description: TOAST_DESCRIPTION.MemoSaved,
              duration: 1000
            });
          } else {
            toast.show({
              id,
              title: TOAST_TITLE.SomeThingWrong,
              status: 'warning',
              description: TOAST_DESCRIPTION.CustomerNotExist,
              duration: 1000
            });
          }
        } else if (!multilineInputState.value) {
          toast.show({
            id,
            title: TOAST_TITLE.SomeThingWrong,
            status: 'info',
            description: TOAST_DESCRIPTION.InputMemo,
            duration: 1000
          });
        } else {
          toast.show({
            id,
            title: TOAST_TITLE.SomeThingWrong,
            status: 'info',
            description: TOAST_DESCRIPTION.InputCustomerId,
            duration: 1000
          });
        }
      }
    } catch (e) {
      if (!toast.isActive(id)) {
        toast.show({
          id,
          title: TOAST_TITLE.SomeThingWrong,
          status: 'warning',
          description: TOAST_DESCRIPTION.CheckAgain,
          duration: 1000
        });
      }
    } finally {
      setIsLoadingSaveMemo(false)
    }
  };

  const openModalAndSearch = async () => {
    try {
      Keyboard.dismiss();
      setIsLoadingOpenModal(true)
      setDataCustomer([]);
      setLoading(true);
      setKeyword(null);
      setKeyword(value);
      setEndData(false);
      setIsEndData(false);
      setPage(1);
      if (value !== "") {
        setIsInvalidValue(false)
        setShowModal(true);
        const response = await apiGetCustomers(value, 1, limit);
        if (response?.customers?.data?.length) {
          setTotal(response.customers.data.length);
          setDataCustomer([...[], ...response.customers.data])
          if (response.customers.data.length < limit || response.customers.data.length === response.customers.total) {
            setIsEndData(true);
          }
        } else {
          setIsEndData(true);
          setEndData(true);
        }
      } else {
        setIsInvalidValue(true)
      }
      setLoading(false);
    } catch (e) {
      toast.show({
        title: TOAST_TITLE.SomeThingWrong,
        status: 'warning',
        description: TOAST_DESCRIPTION.CannotSearchData,
        duration: 1000
      });
    } finally {
      setIsLoadingOpenModal(false)
    }
  };

  const searchCustomer = async () => {
    try {
      Keyboard.dismiss();
      setIsLoadingSearchCustomer(true)
      setIsEndData(false);
      setDataCustomer([]);
      setLoading(true);
      setTotal(0);
      setPage(1);
      const response = await apiGetCustomers(keyword, 1, limit);
      if (response?.customers?.data?.length) {
        setDataCustomer(response.customers.data);
        if ((response.customers.data.length < limit) || (response.customers.data.length === response.customers.total)) {
          setIsEndData(true);
        } else {
          setTotal(total + response.customers.data.length);
          setIsEndData(false);
          setEndData(false);
        }
      } else {
        setIsEndData(true);
        setEndData(true);
      }
      setLoading(false);
    } catch (e) {
      toast.show({
        title: TOAST_TITLE.SomeThingWrong,
        status: 'warning',
        description: TOAST_DESCRIPTION.CheckAgain,
        duration: 1000
      });
    } finally {
      setIsLoadingSearchCustomer(false)
    }
  };

  const handleChange = (event) => {
    setValue(event)
  };

  const handleChangeKeyword = (event) => {
    setKeyword(event)
  };

  const goToMemoList = () => {
    setIsLoadingGoToMemoList(true)
    setTimeout(function () {
      setIsLoadingGoToMemoList(false)
      navigation.push(STACK_MEMO_LIST)
    }, 1000);
  }

  const renderFooter = () => {
    return (
      <VStack space={1} mt={2}>
        <Button.Group
          colorScheme="blue"
          mx={{
            base: 'auto',
            md: 0,
          }}
          size="sm">
          <Button style={styles.fillContent} height={defaultControlHeight} colorScheme="indigo" onPress={_goToHomePage}>
            キャンセル
          </Button>
          <Button style={styles.fillContent} height={defaultControlHeight} colorScheme="indigo" onPress={saveMemo}
                  isLoading={isLoadingSaveMemo}>
            保存
          </Button>
          <Button style={styles.fillContent} height={defaultControlHeight} colorScheme="indigo" onPress={goToMemoList}
                  isLoading={isLoadingGoToMemoList}>
            メモ一覧
          </Button>
          <AlertDialog
            leastDestructiveRef={cancelRef}
            isOpen={isOpen}
            onClose={onClose}
          >
            <AlertDialog.Content>
              <AlertDialog.CloseButton/>
              <AlertDialog.Header>メモは編集中です。</AlertDialog.Header>
              <AlertDialog.Body>
                編集中のメモがありますが、終了しますか？
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button.Group space={2}>
                  <Button
                    variant="unstyled"
                    colorScheme="green"
                    onPress={onClose}
                    ref={cancelRef}
                  >
                    キャンセル
                  </Button>
                  <Button colorScheme="red" onPress={onOk}>
                    OK
                  </Button>
                </Button.Group>
              </AlertDialog.Footer>
            </AlertDialog.Content>
          </AlertDialog>
        </Button.Group>
      </VStack>
    );
  }

  const renderFooterModal = () => {
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

  const renderItem = (item) => <ModalCustomerListDetail item={item} setShowModal={setShowModal} setValue={setValue}/>

  return (
    <Box style={styles.fillContent} safeArea p={4}>
      <HStack>
        <Input value={value} onChangeText={handleChange} type="text" h="10" style={styles.fillContent}
               isInvalid={isInvalidValue}
               placeholder="ID: ○○ "/>
        <Button ml={2} h={defaultControlHeight} w="20" colorScheme="indigo" isLoading={isLoadingOpenModal}
                onPress={() => openModalAndSearch()}>
          検索
        </Button>
        <Modal propagateSwipe isVisible={showModal} style={styles.modal}
               onSwipeComplete={() => setShowModal(false)}
               onBackButtonPress={() => setShowModal(false)}>
          <Input value={keyword} onChangeText={handleChangeKeyword}
                 placeholder="ID or 名前: ○○ "/>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <HStack>
              <Button mx={{
                base: "auto",
                md: "0",
              }} mt={3} pb={2} w="20" alignItems="center" colorScheme="indigo" onPress={searchCustomer}
                      isLoading={isLoadingSearchCustomer}>
                検索
              </Button>
            </HStack>
          </TouchableWithoutFeedback>
          <Row data={TABLE_CONSTANT.tableHeadModalCustomerList}/>
          <View style={styles.fillContent}>
            <FlatList
              data={dataCustomer}
              keyExtractor={(item, index) => index.toString()}
              ItemSeparatorComponent={ItemSeparatorView}
              enableEmptySections={true}
              renderItem={(item) => renderItem(item.item)}
              ListFooterComponent={renderFooterModal}/>
          </View>
          <View>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <VStack>
                <Button mx={{
                  base: "auto",
                  md: "0",
                }} pb={2} w="20" alignItems="center" colorScheme="indigo" onPress={() => {
                  setShowModal(false)
                }}>
                  閉じる
                </Button><Text/>
              </VStack>
            </TouchableWithoutFeedback>
          </View>
        </Modal>
      </HStack>
      <Text style={{color: 'red'}}>{isInvalidValue ? "Please Input Your Id" : ""}</Text>
      <VStack space={1} mt={1} style={styles.fillContent}>
        <Input
          type="text"
          style={styles.fillContent}
          multiline={true}
          textAlignVertical={'top'}
          onChangeText={''}
          placeholder="ここにテキストを入力"
          blurOnSubmit={checkBlurOnSubmit}
          {...multilineInputState}
        />
      </VStack>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <VStack alignItems="center" mt={2}>
          <MicButton onPress={onMicButtonPressed} isPressed={isListening}/>
        </VStack>
      </TouchableWithoutFeedback>
      {renderFooter()}
      <SpeechToText
        ref={sptRef}
        onSpeechEnd={onSpeechEnd}
        onMessage={onMessage}
        onStartListen={onStartListen}
      />
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
  },
  modal: {
    flex: 1,
    paddingLeft: '2%',
    paddingRight: '2%',
    paddingTop: '1%',
    backgroundColor: 'white'
  }
};

export default Page;
