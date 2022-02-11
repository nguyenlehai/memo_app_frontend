import React, {useState} from 'react';
import {View, Animated, TouchableWithoutFeedback} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default ({onPress, isPressed, ...props}) => {
  const [animated] = useState(new Animated.Value(0));
  const [opacityA] = useState(new Animated.Value(1));

  const _runAnimation = () => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(animated, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityA, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const _renderAnimationMic = () => {
    if (isPressed) {
      _runAnimation();
      return (
        <Animated.View
          style={{
            height: 60,
            width: 60,
            borderRadius: 60,
            backgroundColor: '#cf1b1b',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: opacityA,
            transform: [
              {
                scale: animated,
              },
            ],
          }}
        />
      );
    } else {
      return (
        <View
          style={{
            height: 60,
            width: 60,
            borderRadius: 60,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: '#3366FF',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        />
      );
    }
  };

  return (
    <View {...props}>
      <TouchableWithoutFeedback onPress={onPress}>
        <View
          style={{
            height: 60,
            width: 60,
            borderRadius: 60,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            borderWidth: 1,
            borderColor: '#3366FF',
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            backgroundColor: '#fff',
          }}>
          {_renderAnimationMic()}
          <View
            style={{
              position: 'absolute',
            }}>
            <Icon name="microphone" color="#3366FF" size={30} />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};
