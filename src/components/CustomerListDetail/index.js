import React from 'react';
import {StyleSheet} from 'react-native';
import {VStack} from "native-base";
import moment from "moment";
import {Rows, Table} from 'react-native-table-component';

const HOURS = 2;

export const CustomerListDetail = ({item}) => {
  const changeDateTimeToJapanLocation = Date.parse(item.createdAt) + HOURS * 60 * 60 * 1000;
  let dateTime = moment(new Date(changeDateTimeToJapanLocation)).format('LL') +
    ' ' + moment(new Date(changeDateTimeToJapanLocation)).format('HH:mm:ss');
  let month = dateTime.replace('January', '1').replace('February', '2')
    .replace('March', '3').replace('April', '4')
    .replace('May', '5').replace('June', '6')
    .replace('July', '7').replace('August', '8')
    .replace('September', '9').replace('October', '10')
    .replace('November', '11').replace('December', '12').slice(0, 1);
  dateTime = dateTime.slice(dateTime.length - 13, dateTime.length - 9) + '年' +
    month + "月" + dateTime.slice(dateTime.length - 17, dateTime.length - 15) + "日 " + dateTime.slice(dateTime.length - 8, dateTime.length)
  const state = {
    tableData: [
      [item.customerId, item.customerName, dateTime],
    ]
  }

  return (
    <VStack style={styles.container}>
      <Table>
        <Rows data={state.tableData} textStyle={styles.text}/>
      </Table>
    </VStack>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  text: {margin: 6}
});