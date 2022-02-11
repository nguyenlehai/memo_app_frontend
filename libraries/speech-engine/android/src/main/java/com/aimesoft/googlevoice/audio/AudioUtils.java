package com.aimesoft.googlevoice.audio;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

public class AudioUtils {
    public static float calcRmsLevel(byte[] buffer) {
        return calcRmsLevel(buffer, 0, buffer.length);
    }

    public static float calcRmsLevel(byte[] buffer, int offset, int length) {
        ByteBuffer byteBuffer = ByteBuffer.wrap(buffer, offset, length).order(ByteOrder.LITTLE_ENDIAN);
        float samples = length / 2f;
        float sum = 0f;
        while (byteBuffer.hasRemaining()) {
            sum += Math.abs(byteBuffer.getShort()) / samples;
        }
        return sum;
    }
}
