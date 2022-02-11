import React, {useState} from 'react';
import {AlertDialog, Box, Button, Heading, VStack} from 'native-base';
import {useNavigation} from '@react-navigation/native';
import {STACK_CREATE_MEMO, STACK_LOGIN, STACK_SEARCH_MEMO} from '../stacks';
import AsyncStorage from "@react-native-async-storage/async-storage";

const Page = () => {
  const navigation = useNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingLogout, setIsLoadingLogout] = useState(false)

  const _goToNewInputPage = () => navigation.push(STACK_CREATE_MEMO);
  const _goToSearchMemoPage = () => navigation.navigate(STACK_SEARCH_MEMO);

  const onClose = () => {
    setIsOpen(false)
    setIsLoadingLogout(false)
  }
  const onOk = async () => {
    setIsOpen(false);
    setIsLoadingLogout(false)
    await AsyncStorage.removeItem("customerInfo");
    navigation.push(STACK_LOGIN);
  }

  const logout = () => {
    setIsLoadingLogout(true)
    setIsOpen(!isOpen);
  }

  const cancelRef = React.useRef(null)

  return (
    <Box style={styles.fillContent} safeArea p={4}>
      <Heading
        justifyContent="center"
        alignItems="center"
        size="xl"
        fontWeight="600"
        pt={20}
        color="coolGray.800"
        mx={{
          base: "auto",
          md: "0",
        }}
        style={styles.fillContent}
        _dark>
        マイページ
      </Heading>
      <VStack space={1} style={styles.fillContent}>
        <Button mt="2" colorScheme="indigo" onPress={_goToNewInputPage}>
          新規入力
        </Button>
        <Button mt="2" colorScheme="indigo" onPress={_goToSearchMemoPage}>
          編集
        </Button>
      </VStack>
      <VStack style={styles.footer}>
        <Button colorScheme="indigo" onPress={logout} isLoading={isLoadingLogout}>
          ログアウト
        </Button>
        <AlertDialog
          leastDestructiveRef={cancelRef}
          isOpen={isOpen}
          onClose={onClose}
        >
          <AlertDialog.Content>
            <AlertDialog.CloseButton/>
            <AlertDialog.Header>ログアウト。</AlertDialog.Header>
            <AlertDialog.Body>
              ログアウトしますか。？
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
      </VStack>
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
