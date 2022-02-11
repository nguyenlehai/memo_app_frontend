package com.aimesoft.googlevoice.audio;

import android.content.Context;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;

public class MicrophoneAudioStream implements AudioStream {
    private final Context context;
    private final int sampleRate;
    private final int channels;
    private final int desireBufferSize;

    private final AudioRecord recorder;
    private volatile boolean recording;

    public static AudioStream create(Context context, int recognitionSampleRate, int recognitionAudioChannels) {
        return new MicrophoneAudioStream(context, recognitionSampleRate, recognitionAudioChannels);
    }

    public MicrophoneAudioStream(Context context, int sampleRate, int channels) {
        this.context = context;
        this.sampleRate = sampleRate;
        this.channels = channels;

        int channelsConfig = channels == 1 ? AudioFormat.CHANNEL_IN_MONO : AudioFormat.CHANNEL_IN_STEREO;
        int recordingBufferSize = AudioRecord.getMinBufferSize(sampleRate, channelsConfig, AudioFormat.ENCODING_PCM_16BIT);
        recorder = new AudioRecord(MediaRecorder.AudioSource.MIC, sampleRate, channelsConfig, AudioFormat.ENCODING_PCM_16BIT, recordingBufferSize);
        desireBufferSize = recordingBufferSize;
    }

    @Override
    public void start() {
        if (recording) {
            return;
        }
        recording = true;
        recorder.startRecording();
    }

    @Override
    public void stop() {
        if (!recording) {
            return;
        }
        recording = false;
        recorder.stop();
    }

    @Override
    public int read(byte[] buffer, int offsetInByte, int length) {
        return recorder.read(buffer, offsetInByte, length);
    }

    @Override
    public int sampleRate() {
        return sampleRate;
    }

    @Override
    public int channels() {
        return channels;
    }

    @Override
    public int desireBufferSize() {
        return desireBufferSize;
    }

    @Override
    public boolean stopped() {
        return recorder.getRecordingState() == AudioRecord.RECORDSTATE_STOPPED;
    }
}
