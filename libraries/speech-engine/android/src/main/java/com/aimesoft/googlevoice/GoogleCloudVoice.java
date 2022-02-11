package com.aimesoft.googlevoice;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.aimesoft.googlevoice.audio.AudioStream;
import com.aimesoft.googlevoice.audio.AudioUtils;
import com.aimesoft.googlevoice.audio.MicrophoneAudioStream;
import com.aimesoft.googlevoice.utils.SignatureUtils;
import com.google.api.gax.core.FixedCredentialsProvider;
import com.google.api.gax.rpc.ClientStream;
import com.google.api.gax.rpc.HeaderProvider;
import com.google.api.gax.rpc.ResponseObserver;
import com.google.api.gax.rpc.StreamController;
import com.google.auth.Credentials;
import com.google.cloud.speech.v1.*;
import com.google.protobuf.ByteString;

import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.TimeUnit;

public class GoogleCloudVoice implements SpeechRecognizer {

    public static final int RECOGNITION_SAMPLE_RATE = 16000;
    public static final int RECOGNITION_AUDIO_CHANNELS = 1;
    private static final long FIRST_DELAY = TimeUnit.SECONDS.toMillis(15);
    private static final long LISTENING_DELAY = TimeUnit.SECONDS.toMillis(10);
    private static final long MAX_RECOGNITION_SESSION_TIME = TimeUnit.SECONDS.toMillis(55);

    private final Context context;
    private RecognitionListener recognitionListener;
    private RecognitionThread recognitionThread;

    public GoogleCloudVoice(Context context) {
        this.context = context;
    }

    public static SpeechRecognizer create(Context context) {
        return new GoogleCloudVoice(context);
    }

    @Override
    public void startListening(Intent intent) {
        cancel();

        String apiKey = intent.getStringExtra("apikey");
        if (apiKey == null) {
            apiKey = defaultApiKey();
        }
        if (apiKey == null) {
            RecognitionListener listener = recognitionListener;
            if (listener != null) {
                listener.onError(ERROR_CLIENT);
            }
            return;
        }
        RecognitionRequest request = new RecognitionRequest.Builder(apiKey)
                .maxAlternatives(intent.getIntExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1))
                .autoStop(false)
                .interimResults(intent.getBooleanExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true))
                .language(intent.getStringExtra(RecognizerIntent.EXTRA_LANGUAGE))
                .bufferOut(intent.getBooleanExtra("AUDIO_BUFFER_OUT", false))
                .rmsDBOut(intent.getBooleanExtra("RMS_DB_OUT", false))
                .build();
        AudioStream micro = MicrophoneAudioStream.create(context, RECOGNITION_SAMPLE_RATE, RECOGNITION_AUDIO_CHANNELS);
        recognitionThread = new RecognitionThread(request, micro);
        recognitionThread.start();
    }

    private String defaultApiKey() {
        SharedPreferences preferences = context.getSharedPreferences("google", Context.MODE_PRIVATE);
        return preferences.getString("google_api_key", null);
    }

    public void destroy() {
        cancel();
    }

    @Override
    public void setRecognitionListener(RecognitionListener listener) {
        recognitionListener = listener;
    }

    @Override
    public synchronized void stopListening() {
        RecognitionThread thread = recognitionThread;
        recognitionThread = null;
        if (thread != null) {
            thread.requestStopListening();
        }
    }

    @Override
    public synchronized void cancel() {
        RecognitionThread thread = recognitionThread;
        recognitionThread = null;
        if (thread != null) {
            thread.requestCancelListening();
        }
    }

    @NonNull
    private SpeechClient createApiClient(@NonNull String apiKey) throws IOException {
        final Map<String, String> headers = SignatureUtils.calculateSignatureHeaders(context, apiKey);
        SpeechSettings settings = SpeechSettings.newBuilder()
                .setHeaderProvider(new HeaderProvider() {
                    @Override
                    public Map<String, String> getHeaders() {
                        return headers;
                    }
                })
                .setCredentialsProvider(new FixedCredentialsProvider() {
                    @Override
                    public Credentials getCredentials() {
                        return new DummyCredential();
                    }
                })
                .build();
        return SpeechClient.create(settings);
    }

    /* Start event notify */
    void notifySpeechReady() {
        RecognitionListener listener = recognitionListener;
        if (listener != null) {
            listener.onReadyForSpeech(null);
        }
    }

    void notifyAudioBuffer(byte[] buffer) {
        RecognitionListener listener = recognitionListener;
        if (listener != null) {
            listener.onBufferReceived(buffer);
        }
    }

    void notifyVoiceDB(float dbLevel) {
        RecognitionListener listener = recognitionListener;
        if (listener != null) {
            listener.onRmsChanged(dbLevel);
        }
    }

    void notifySpeechEnd(@Nullable Throwable e) {
        RecognitionListener listener = recognitionListener;
        if (listener != null) {
            if (e != null) {
                listener.onError(ERROR_SERVER);
            } else {
                listener.onEndOfSpeech();
            }
        }
    }

    void notifyIntermediateResult(String text) {
        RecognitionListener listener = recognitionListener;
        if (listener != null) {
            Bundle bundle = new Bundle();
            ArrayList<String> results = new ArrayList<>(1);
            results.add(text);
            bundle.putStringArrayList(RESULTS_RECOGNITION, results);
            listener.onPartialResults(bundle);
        }
    }

    void notifyResult(String text) {
        RecognitionListener listener = recognitionListener;
        if (listener != null) {
            Bundle bundle = new Bundle();
            ArrayList<String> results = new ArrayList<>(1);
            results.add(text);
            bundle.putStringArrayList(RESULTS_RECOGNITION, results);
            listener.onResults(bundle);
        }
    }

    /* End event notify */
    @NonNull
    private static String joinString(@NonNull String separator, @NonNull String... others) {
        if (others.length == 0) {
            return "";
        }
        StringBuilder s = new StringBuilder();
        for (String other : others) {
            if (other != null && other.length() > 0) {
                s.append(other);
                s.append(separator);
            }
        }
        if (s.length() > separator.length()) { // separator added
            s.delete(s.length() - separator.length(), s.length());
        }
        return s.toString();
    }

    private static class RecognitionRequest {
        private String apiKey;
        private int maxAlternatives;
        private String language;
        private boolean interimResults;
        private boolean autoStop;
        private boolean bufferOut;
        private boolean rmsDBOut;

        public String getApiKey() {
            return apiKey;
        }

        public int getMaxAlternatives() {
            return maxAlternatives;
        }

        public String getLanguage() {
            return language;
        }

        public boolean isInterimResults() {
            return interimResults;
        }

        public boolean isAutoStop() {
            return autoStop;
        }

        public boolean isBufferOut() {
            return bufferOut;
        }

        public boolean isRmsDBOut() {
            return rmsDBOut;
        }

        public static class Builder {
            private final String apiKey;
            private int maxAlternatives = 1;
            private String language = "en-US";
            private boolean interimResults = true;
            private boolean autoStop = true;
            private boolean bufferOut = false;
            private boolean rmsDBOut = true;

            public Builder(String apiKey) {
                this.apiKey = apiKey;
            }

            public Builder maxAlternatives(int maxAlternatives) {
                this.maxAlternatives = maxAlternatives;
                return this;
            }

            public Builder autoStop(boolean autoStop) {
                this.autoStop = autoStop;
                return this;
            }

            public Builder interimResults(boolean interimResults) {
                this.interimResults = interimResults;
                return this;
            }

            public Builder language(String lang) {
                this.language = lang;
                return this;
            }

            public Builder bufferOut(boolean bufferOut) {
                this.bufferOut = bufferOut;
                return this;
            }

            public Builder rmsDBOut(boolean rmsDBOut) {
                this.rmsDBOut = rmsDBOut;
                return this;
            }

            public RecognitionRequest build() {
                RecognitionRequest r = new RecognitionRequest();
                r.apiKey = apiKey;
                r.maxAlternatives = maxAlternatives;
                r.autoStop = autoStop;
                r.interimResults = interimResults;
                r.language = language;
                r.bufferOut = bufferOut;
                r.rmsDBOut = rmsDBOut;
                return r;
            }
        }
    }

    private class RecognitionThread extends Thread {
        private final RecognitionRequest request;
        private final AudioStream recorder;

        private volatile boolean stopped = false;
        private volatile boolean canceled = false;
        private Timer timer;

        public RecognitionThread(@NonNull RecognitionRequest request, @NonNull AudioStream recorder) {
            this.request = request;
            this.recorder = recorder;
        }

        @Override
        public void run() {
            float bufferTime = 0.3f;
            int recognitionBufferSize = (int) (bufferTime * RECOGNITION_SAMPLE_RATE * 2);
            try {
                int bufferSize = Math.min(recognitionBufferSize, recorder.desireBufferSize());
                byte[] buffer = new byte[bufferSize];
                notifySpeechReady();
                recorder.start();
                scheduleAutoStopTimer(FIRST_DELAY);
                startRecognitionMulti(recorder, buffer);
            } finally {
                cancelAutoStopTimer();
                recorder.stop();
            }
        }

        private final ResponseObserver<StreamingRecognizeResponse> responseObserver = new ResponseObserver<StreamingRecognizeResponse>() {
            @Override
            public void onStart(StreamController controller) {

            }

            @Override
            public void onResponse(StreamingRecognizeResponse response) {
                if (canceled) {
                    return;
                }
                StreamingRecognitionResult streamResult = getStreamResult(response);
                if (streamResult == null) {
                    return;
                }
                List<SpeechRecognitionAlternative> alternativeList = streamResult.getAlternativesList();
                if (alternativeList.size() == 0) {
                    return;
                }
                String candidate = alternativeList.get(0).getTranscript().trim();
                notifyIntermediateResult(candidate.trim());
                if (streamResult.getIsFinal()) {
                    notifyResult(candidate);
                    if (request.autoStop) {
                        requestStopListening();
                    } else {
                        if (!stopped) {
                            scheduleAutoStopTimer(LISTENING_DELAY);
                        }
                    }
                } else {
                    if (!stopped) {
                        scheduleAutoStopTimer(LISTENING_DELAY);
                    }
                }
            }

            @Nullable
            private StreamingRecognitionResult getStreamResult(@NonNull StreamingRecognizeResponse response) {
                List<StreamingRecognitionResult> resultList = response.getResultsList();
                if (resultList.size() == 0) {
                    return null;
                }
                for (StreamingRecognitionResult recognitionResult : resultList) {
                    if (recognitionResult.getIsFinal()) {
                        return recognitionResult;
                    }
                }
                return resultList.get(0);
            }

            @Override
            public void onError(Throwable error) {
                if (canceled) {
                    return;
                }
                requestCancelListening();
                notifySpeechEnd(error);
            }

            @Override
            public void onComplete() {

            }
        };

        private void startRecognitionMulti(@NonNull AudioStream recorder, @NonNull byte[] buffer) {
            try {
                while (!stopped && !canceled) {
                    startRecognitionSingle(recorder, buffer);
                }
            } catch (Exception e) {
                responseObserver.onError(e);
            } finally {
                if (!canceled) {
                    notifySpeechEnd(null);
                }
            }
        }

        private void startRecognitionSingle(@NonNull AudioStream recorder, @NonNull byte[] buffer) throws IOException {
            SpeechClient client = null;
            try {
                client = createApiClient(request.apiKey);
                ClientStream<StreamingRecognizeRequest> clientStream = client.streamingRecognizeCallable()
                        .splitCall(responseObserver);
                RecognitionConfig config = RecognitionConfig.newBuilder()
                        .setEncoding(RecognitionConfig.AudioEncoding.LINEAR16)
                        .setAudioChannelCount(RECOGNITION_AUDIO_CHANNELS)
                        .setMaxAlternatives(request.maxAlternatives)
                        .setLanguageCode(request.language)
                        .setSampleRateHertz(RECOGNITION_SAMPLE_RATE)
                        .build();
                StreamingRecognitionConfig streamConfig = StreamingRecognitionConfig.newBuilder()
                        .setInterimResults(request.interimResults)
                        .setConfig(config)
                        .build();
                StreamingRecognizeRequest request = StreamingRecognizeRequest.newBuilder()
                        .setStreamingConfig(streamConfig)
                        .build();
                clientStream.send(request);
                long startTime = System.currentTimeMillis();
                int bufferSize = buffer.length;
                int rmsCounter = 0;
                while (true) {
                    if (stopped || canceled) {
                        break;
                    }
                    long estimatedTime = System.currentTimeMillis() - startTime;
                    if (estimatedTime > MAX_RECOGNITION_SESSION_TIME) {
                        break;
                    }
                    int byteRead = recorder.read(buffer, 0, bufferSize);
                    if (byteRead <= 0) {
                        break;
                    }
                    StreamingRecognizeRequest audioRequest = StreamingRecognizeRequest.newBuilder()
                            .setAudioContent(ByteString.copyFrom(buffer, 0, byteRead))
                            .build();
                    clientStream.send(audioRequest);
                    if (!canceled) {
                        if (this.request.bufferOut) {
                            tryNotifyAudioBuffer(buffer, byteRead);
                        }
                        if (this.request.rmsDBOut) {
                            rmsCounter = tryNotifyRmsDB(rmsCounter, buffer, byteRead);
                        }
                    }
                }
                clientStream.closeSend();
            } finally {
                if (client != null) {
                    client.close();
                }
            }
        }

        private void tryNotifyAudioBuffer(byte[] buffer, int length) {
            byte[] readBuffer = new byte[length]; // prevent stale buffer
            System.arraycopy(buffer, 0, readBuffer, 0, length);
            notifyAudioBuffer(readBuffer);
        }

        private int tryNotifyRmsDB(int rmsCounter, byte[] buffer, int length) {
            if (rmsCounter > 3) {
                rmsCounter = 0;
            } else {
                rmsCounter++;
            }
            if (rmsCounter == 0) {
                notifyVoiceDB(AudioUtils.calcRmsLevel(buffer, 0, length));
            }
            return rmsCounter;
        }

        public synchronized void requestStopListening() {
            if (stopped || canceled) {
                return;
            }
            stopped = true;
            canceled = false;
            cancelAutoStopTimer();
        }

        private synchronized void requestCancelListening() {
            if (stopped || canceled) {
                return;
            }
            stopped = false;
            canceled = true;
            cancelAutoStopTimer();
        }

        private void scheduleAutoStopTimer(final long delay) {
            cancelAutoStopTimer();
            timer = new Timer();
            timer.schedule(new TimerTask() {
                @Override
                public void run() {
                    requestStopListening();
                }
            }, delay);
        }

        private void cancelAutoStopTimer() {
            Timer timer = this.timer;
            this.timer = null;
            if (timer != null) {
                timer.cancel();
            }
        }
    }

    private static class DummyCredential extends Credentials {

        @Override
        public String getAuthenticationType() {
            return "dummy";
        }

        @Override
        public Map<String, List<String>> getRequestMetadata(URI uri) throws IOException {
            return Collections.emptyMap();
        }

        @Override
        public boolean hasRequestMetadata() {
            return false;
        }

        @Override
        public boolean hasRequestMetadataOnly() {
            return false;
        }

        @Override
        public void refresh() throws IOException {

        }
    }
}
