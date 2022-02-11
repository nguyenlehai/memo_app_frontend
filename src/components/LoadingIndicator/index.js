import React from 'react';
import {Spinner, View} from 'native-base';

const centerStyle = {
  justifyContent: 'center',
  alignItems: 'center',
};

const LoadingIndicator = ({style}) => (
  <View style={[style, centerStyle]}>
    <Spinner size="sm" />
  </View>
);

export default LoadingIndicator;
