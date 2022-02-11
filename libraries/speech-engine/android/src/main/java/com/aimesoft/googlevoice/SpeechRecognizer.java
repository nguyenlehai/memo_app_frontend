package com.aimesoft.googlevoice;

import android.content.Intent;
import android.speech.RecognitionListener;

public interface SpeechRecognizer {
    String RESULTS_RECOGNITION = android.speech.SpeechRecognizer.RESULTS_RECOGNITION;
    int ERROR_AUDIO = android.speech.SpeechRecognizer.ERROR_AUDIO;
    int ERROR_CLIENT = android.speech.SpeechRecognizer.ERROR_CLIENT;
    int ERROR_INSUFFICIENT_PERMISSIONS = android.speech.SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS;
    int ERROR_NETWORK = android.speech.SpeechRecognizer.ERROR_NETWORK;
    int ERROR_NETWORK_TIMEOUT = android.speech.SpeechRecognizer.ERROR_NETWORK_TIMEOUT;
    int ERROR_NO_MATCH = android.speech.SpeechRecognizer.ERROR_NO_MATCH;
    int ERROR_RECOGNIZER_BUSY = android.speech.SpeechRecognizer.ERROR_RECOGNIZER_BUSY;
    int ERROR_SERVER = android.speech.SpeechRecognizer.ERROR_SERVER;
    int ERROR_SPEECH_TIMEOUT = android.speech.SpeechRecognizer.ERROR_SPEECH_TIMEOUT;

    void startListening(Intent intent);

    void destroy();

    void setRecognitionListener(RecognitionListener listener);

    void stopListening();

    void cancel();
}
