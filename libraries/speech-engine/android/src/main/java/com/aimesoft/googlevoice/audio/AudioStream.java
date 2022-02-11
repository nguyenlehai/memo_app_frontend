package com.aimesoft.googlevoice.audio;

public interface AudioStream {
    void start();

    void stop();

    int read(byte[] buffer, int offsetInByte, int length);

    int sampleRate();

    int channels();

    int desireBufferSize();

    boolean stopped();
}
