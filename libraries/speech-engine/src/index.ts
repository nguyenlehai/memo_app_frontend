import {
  NativeEventEmitter,
  NativeModule,
  NativeModules,
  Platform,
} from 'react-native';
import invariant from 'invariant';
import {
  SpeechEndEvent,
  SpeechErrorEvent,
  SpeechEvents,
  SpeechRecognizedEvent,
  SpeechResultsEvent,
  SpeechStartEvent,
  SpeechVolumeChangeEvent,
  VoiceModule,
} from './VoiceModuleTypes';

const Voice = NativeModules.SpeechEngine as VoiceModule;

// NativeEventEmitter is only availabe on React Native platforms, so this conditional is used to avoid import conflicts in the browser/server
const voiceEmitter =
  Platform.OS !== 'web'
    ? new NativeEventEmitter((Voice as unknown) as NativeModule)
    : null;
type SpeechEvent = keyof SpeechEvents;

function emptyEvents(): Required<SpeechEvents> {
  return {
    onSpeechStart: () => {
    },
    onSpeechRecognized: () => {
    },
    onSpeechEnd: () => {
    },
    onSpeechError: () => {
    },
    onSpeechResults: () => {
    },
    onSpeechPartialResults: () => {
    },
    onSpeechVolumeChanged: () => {
    },
  };
}

class RCTVoice {
  _loaded: boolean;
  _listeners: any[] | null;
  _events: Required<SpeechEvents>;
  _eventStacks: Required<SpeechEvents>[];
  _nativeEvents: Required<SpeechEvents>;

  constructor() {
    this._loaded = false;
    this._listeners = null;
    this._events = emptyEvents();
    this._eventStacks = [this._events];
    this._nativeEvents = {
      onSpeechStart: e => {
        if (this._events.onSpeechStart) {
          this._events.onSpeechStart(e);
        }
      },
      onSpeechRecognized: e => {
        if (this._events.onSpeechRecognized) {
          this._events.onSpeechRecognized(e);
        }
      },
      onSpeechEnd: e => {
        if (this._events.onSpeechEnd) {
          this._events.onSpeechEnd(e);
        }
      },
      onSpeechError: e => {
        if (this._events.onSpeechError) {
          this._events.onSpeechError(e);
        }
      },
      onSpeechResults: e => {
        if (this._events.onSpeechResults) {
          this._events.onSpeechResults(e);
        }
      },
      onSpeechPartialResults: e => {
        if (this._events.onSpeechPartialResults) {
          this._events.onSpeechPartialResults(e);
        }
      },
      onSpeechVolumeChanged: e => {
        if (this._events.onSpeechVolumeChanged) {
          this._events.onSpeechVolumeChanged(e);
        }
      },
    };
  }

  useEffect() {
    const events = emptyEvents();
    this._events = events;
    this._eventStacks.push(events);
    return () => {
      this._eventStacks = this._eventStacks.filter(e => e !== events);
      this._events =
        this._eventStacks[this._eventStacks.length - 1] || emptyEvents();
    };
  }

  removeAllListeners() {
    Voice.onSpeechStart = undefined;
    Voice.onSpeechRecognized = undefined;
    Voice.onSpeechEnd = undefined;
    Voice.onSpeechError = undefined;
    Voice.onSpeechResults = undefined;
    Voice.onSpeechPartialResults = undefined;
    Voice.onSpeechVolumeChanged = undefined;
  }

  destroy() {
    if (!this._loaded && !this._listeners) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      Voice.destroySpeech((error: string) => {
        if (error) {
          reject(new Error(error));
        } else {
          if (this._listeners) {
            this._listeners.map(listener => listener.remove());
            this._listeners = null;
          }
          resolve();
        }
      });
    });
  }

  start(locale: any, options = {}) {
    if (!this._loaded && !this._listeners && voiceEmitter !== null) {
      this._listeners = (Object.keys(this._nativeEvents) as SpeechEvent[]).map(
        (key: SpeechEvent) =>
          voiceEmitter.addListener(key, this._nativeEvents[key]),
      );
    }

    return new Promise<void>((resolve, reject) => {
      const callback = (error: string) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve();
        }
      };
      if (Platform.OS === 'android') {
        Voice.startSpeech(
            locale,
            Object.assign(
                {
                  EXTRA_MAX_RESULTS: 1,
                  EXTRA_PARTIAL_RESULTS: true,
                  REQUEST_PERMISSIONS_AUTO: true,
                },
                options,
            ),
            callback,
        );
      } else {
        Voice.startSpeech(locale, options, callback);
      }
    });
  }

  stop() {
    if (!this._loaded && !this._listeners) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      Voice.stopSpeech((error: string | undefined) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve();
        }
      });
    });
  }

  cancel() {
    if (!this._loaded && !this._listeners) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      Voice.cancelSpeech((error: string | undefined) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve();
        }
      });
    });
  }

  isAvailable(): Promise<0 | 1> {
    return new Promise((resolve, reject) => {
      Voice.isSpeechAvailable((isAvailable: 0 | 1, error: string) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve(isAvailable);
        }
      });
    });
  }

  /**
   * (Android) Get a list of the speech recognition engines available on the device
   * */
  getSpeechRecognitionServices() {
    if (Platform.OS !== 'android') {
      invariant(
          Voice,
          'Speech recognition services can be queried for only on Android',
      );
      return;
    }

    return Voice.getSpeechRecognitionServices();
  }

  isRecognizing(): Promise<0 | 1> {
    return new Promise(resolve => {
      Voice.isRecognizing((isRecognizing: 0 | 1) => resolve(isRecognizing));
    });
  }

  set onSpeechStart(fn: (e: SpeechStartEvent) => void) {
    this._events.onSpeechStart = fn;
  }

  set onSpeechRecognized(fn: (e: SpeechRecognizedEvent) => void) {
    this._events.onSpeechRecognized = fn;
  }

  set onSpeechEnd(fn: (e: SpeechEndEvent) => void) {
    this._events.onSpeechEnd = fn;
  }

  set onSpeechError(fn: (e: SpeechErrorEvent) => void) {
    this._events.onSpeechError = fn;
  }

  set onSpeechResults(fn: (e: SpeechResultsEvent) => void) {
    this._events.onSpeechResults = fn;
  }

  set onSpeechPartialResults(fn: (e: SpeechResultsEvent) => void) {
    this._events.onSpeechPartialResults = fn;
  }

  set onSpeechVolumeChanged(fn: (e: SpeechVolumeChangeEvent) => void) {
    this._events.onSpeechVolumeChanged = fn;
  }
}

export {
  SpeechEndEvent,
  SpeechErrorEvent,
  SpeechEvents,
  SpeechStartEvent,
  SpeechRecognizedEvent,
  SpeechResultsEvent,
  SpeechVolumeChangeEvent,
};
export default new RCTVoice();
