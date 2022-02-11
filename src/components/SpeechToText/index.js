import React, {forwardRef, useEffect, useImperativeHandle, useRef} from 'react';
import SpeechEngine from 'speech-engine';
import * as __ from 'lodash';

const SpeechToText = ({onStartListen, onSpeechEnd, onMessage}, ref) => {
  const manualFlagRef = useRef(false);
  useImperativeHandle(ref, () => {
    return {
      async start() {
        manualFlagRef.current = true;
        try {
          return await SpeechEngine.start('ja-JP', {
            apikey: 'AIzaSyCjIK2O9pNbN8ePW_kd-cT6sowVezlTmLg',
          });
        } catch (e) {
          manualFlagRef.current = false;
        }
      },
      async resume() {
        return await SpeechEngine.start('ja-JP', {
          apikey: 'AIzaSyCjIK2O9pNbN8ePW_kd-cT6sowVezlTmLg',
        });
      },
      async stop() {
        manualFlagRef.current = false;
        return await SpeechEngine.stop();
      },
      async cancel() {
        manualFlagRef.current = false;
        return await SpeechEngine.cancel();
      }
    };
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const cleanupSpeechEngine = SpeechEngine.useEffect();

    SpeechEngine.onSpeechStart = () => {
      if (typeof onStartListen === 'function') {
        onStartListen(true);
      }
    };

    SpeechEngine.onSpeechEnd = __.debounce(() => {
      if (typeof onSpeechEnd === 'function') {
        const userRequest = !manualFlagRef.current;
        onSpeechEnd(userRequest);
      }
    }, 250);

    SpeechEngine.onSpeechPartialResults = ({value}) => {
      const message = value.shift();
      if (message) {
        onMessage(message, false);
      }
    };

    SpeechEngine.onSpeechResults = ({value}) => {
      const message = value.shift();
      if (message && message !== '...') {
        onMessage(message, true);
      }
    };

    return () => {
      SpeechEngine.cancel();
      cleanupSpeechEngine();
    };
  }, []);

  return <></>;
};

export default forwardRef(SpeechToText);
