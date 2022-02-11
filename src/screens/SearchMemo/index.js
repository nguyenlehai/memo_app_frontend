import React from 'react';
import {Box, Button, Heading, VStack} from 'native-base';
import {useNavigation} from '@react-navigation/native';
import {STACK_CUSTOMER_LIST, STACK_HOME, STACK_MEMO_LIST} from '../stacks';

const Page = () => {
  const navigation = useNavigation();
  const _goToHomePage = () => navigation.push(STACK_HOME);
  const _goToCustomerListPage = () => navigation.push(STACK_CUSTOMER_LIST);
  const _goToMemoListPage = () => navigation.push(STACK_MEMO_LIST);

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
        編集(検索)
      </Heading>
      <VStack space={1} style={styles.fillContent}>
        <Button mt="2" colorScheme="indigo" onPress={_goToCustomerListPage}>
          ①顧客一覧
        </Button>
        <Button mt="2" colorScheme="indigo" onPress={_goToMemoListPage}>
          ②メモ一覧
        </Button>
      </VStack>
      <VStack style={styles.footer}>
        <Button colorScheme="indigo" onPress={_goToHomePage}>
          ホームへ
        </Button>
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
