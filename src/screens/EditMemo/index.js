import React, {PureComponent, useState} from 'react';
import {Box, Button, Input, useToast, VStack} from 'native-base';
import {useNavigation} from '@react-navigation/native';
import {STACK_MEMO_LIST} from '../stacks';
import {apiUpdateMemo} from "../../api/memo";
import {TOAST_DESCRIPTION, TOAST_TITLE} from "../../const/ErrorMessage";
import {Keyboard, TouchableWithoutFeedback} from "react-native";
import {debounce} from "lodash";

const usePreventDoubleClick = (WrappedComponent) => {
  class PreventDoubleClick extends PureComponent {
    debouncedOnPress = () => {
      this.props.onPress && this.props.onPress();
    }
    onPress = debounce(this.debouncedOnPress, 300, {leading: true, trailing: false});

    render() {
      return <WrappedComponent {...this.props} onPress={this.onPress}/>;
    }
  }

  PreventDoubleClick.displayName = `withPreventDoubleClick(${WrappedComponent.displayName || WrappedComponent.name})`
  return PreventDoubleClick;
}

const Page = ({route}) => {
  const navigation = useNavigation();
  const [memo, setMemo] = useState(route.params.memo);
  const customerId = route.params.customerId;
  const idMemo = route.params.id;
  const toast = useToast();
  const id = "one_toast";
  const [isLoadingSaveMemo, setIsLoadingSaveMemo] = useState(false)
  const ButtonPreventDoubleClick = usePreventDoubleClick(Button);

  const handleChangeMemo = (event) => {
    setMemo(event);
  }

  const goToMemoListPage = () => {
    toast.closeAll();
    navigation.push(STACK_MEMO_LIST)
  };

  const saveMemo = async () => {
    try {
      Keyboard.dismiss();
      setIsLoadingSaveMemo(true)
      const response = await apiUpdateMemo(idMemo, {
        "memo": memo,
        "id": idMemo
      });
      if (response?.message === "SUCCESS" && !toast.isActive(id)) {
        toast.show({
          id,
          title: TOAST_TITLE.Saved,
          duration: 1000
        });
      }
    } catch (e) {
      if (!toast.isActive(id)) {
        toast.show({
          id,
          title: TOAST_TITLE.SomeThingWrong,
          status: 'error',
          description: TOAST_DESCRIPTION.CannotSaveMemo,
          duration: 1000
        });
      }
    } finally {
      setIsLoadingSaveMemo(false)
    }
  };

  return (
    <Box style={styles.fillContent} safeArea p={4}>
      <VStack space={1}>
        <Input isDisabled={true} value={customerId}/>
      </VStack>
      <VStack space={3} pt={3} style={styles.fillContent}>
        <Input style={styles.fillContent} value={memo} onChangeText={handleChangeMemo} multiline={true}
               placeholder="メモ ○○" type="text" textAlignVertical={'top'}/>
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
            <ButtonPreventDoubleClick style={styles.fillContent} colorScheme="indigo" onPress={goToMemoListPage}>
              戻る
            </ButtonPreventDoubleClick>
            <Button style={styles.fillContent} colorScheme="indigo" onPress={saveMemo} isLoading={isLoadingSaveMemo}>
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
