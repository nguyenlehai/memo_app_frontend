"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_native_1 = require("react-native");
const invariant_1 = __importDefault(require("invariant"));
const Voice = react_native_1.NativeModules.SpeechEngine;
// NativeEventEmitter is only availabe on React Native platforms, so this conditional is used to avoid import conflicts in the browser/server
const voiceEmitter = react_native_1.Platform.OS !== 'web'
    ? new react_native_1.NativeEventEmitter(Voice)
    : null;
function emptyEvents() {
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
        return new Promise((resolve, reject) => {
            Voice.destroySpeech((error) => {
                if (error) {
                    reject(new Error(error));
                }
                else {
                    if (this._listeners) {
                        this._listeners.map(listener => listener.remove());
                        this._listeners = null;
                    }
                    resolve();
                }
            });
        });
    }
    start(locale, options = {}) {
        if (!this._loaded && !this._listeners && voiceEmitter !== null) {
            this._listeners = Object.keys(this._nativeEvents).map((key) => voiceEmitter.addListener(key, this._nativeEvents[key]));
        }
        return new Promise((resolve, reject) => {
            const callback = (error) => {
                if (error) {
                    reject(new Error(error));
                }
                else {
                    resolve();
                }
            };
            if (react_native_1.Platform.OS === 'android') {
                Voice.startSpeech(locale, Object.assign({
                    EXTRA_MAX_RESULTS: 1,
                    EXTRA_PARTIAL_RESULTS: true,
                    REQUEST_PERMISSIONS_AUTO: true,
                }, options), callback);
            }
            else {
                Voice.startSpeech(locale, options, callback);
            }
        });
    }
    stop() {
        if (!this._loaded && !this._listeners) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            Voice.stopSpeech((error) => {
                if (error) {
                    reject(new Error(error));
                }
                else {
                    resolve();
                }
            });
        });
    }
    cancel() {
        if (!this._loaded && !this._listeners) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            Voice.cancelSpeech((error) => {
                if (error) {
                    reject(new Error(error));
                }
                else {
                    resolve();
                }
            });
        });
    }
    isAvailable() {
        return new Promise((resolve, reject) => {
            Voice.isSpeechAvailable((isAvailable, error) => {
                if (error) {
                    reject(new Error(error));
                }
                else {
                    resolve(isAvailable);
                }
            });
        });
    }
    /**
     * (Android) Get a list of the speech recognition engines available on the device
     * */
    getSpeechRecognitionServices() {
        if (react_native_1.Platform.OS !== 'android') {
            invariant_1.default(Voice, 'Speech recognition services can be queried for only on Android');
            return;
        }
        return Voice.getSpeechRecognitionServices();
    }
    isRecognizing() {
        return new Promise(resolve => {
            Voice.isRecognizing((isRecognizing) => resolve(isRecognizing));
        });
    }
    set onSpeechStart(fn) {
        this._events.onSpeechStart = fn;
    }
    set onSpeechRecognized(fn) {
        this._events.onSpeechRecognized = fn;
    }
    set onSpeechEnd(fn) {
        this._events.onSpeechEnd = fn;
    }
    set onSpeechError(fn) {
        this._events.onSpeechError = fn;
    }
    set onSpeechResults(fn) {
        this._events.onSpeechResults = fn;
    }
    set onSpeechPartialResults(fn) {
        this._events.onSpeechPartialResults = fn;
    }
    set onSpeechVolumeChanged(fn) {
        this._events.onSpeechVolumeChanged = fn;
    }
}
exports.default = new RCTVoice();
