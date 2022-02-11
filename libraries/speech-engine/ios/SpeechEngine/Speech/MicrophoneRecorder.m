//
//  JKMicrophoneRecorder.m
//  SpeechEngine
//
//  Created by Trịnh Quân on 5/1/20.
//  Copyright © 2020 aimesoft.com. All rights reserved.
//

#import "MicrophoneRecorder.h"

#define JK_MIC_NUM_BUFFERS 5

typedef AudioStreamBasicDescription AudioStreamFormat;

typedef struct {
    AudioStreamFormat            format;
    AudioQueueRef                queue;
    AudioQueueBufferRef          buffers[JK_MIC_NUM_BUFFERS];
    bool                         recording;
} RecordState;

@interface JKMicrophoneRecorder() {
    RecordState mRecordState;
}
@property (nonatomic, strong) NSTimer *mPowerCheckTimer;
@end

@implementation JKMicrophoneRecorder

+(instancetype)initWithSampleRate:(int)rate {
    JKMicrophoneRecorder *recorder = [[JKMicrophoneRecorder alloc] init];
    AudioFormatFlags formatFlags = kLinearPCMFormatFlagIsSignedInteger;
    AudioStreamFormat *format = &recorder->mRecordState.format;
    format->mSampleRate = rate;
    format->mFormatID = kAudioFormatLinearPCM;
    format->mFormatFlags = formatFlags;
    format->mBytesPerPacket = RECORDING_BYTES_PER_FRAME;
    format->mFramesPerPacket = 1;
    format->mBytesPerFrame = RECORDING_BYTES_PER_FRAME;
    format->mChannelsPerFrame = RECORDING_CHANNEL_PER_FRAME;
    format->mBitsPerChannel = RECORDING_BYTES_PER_FRAME * 8;
    format->mReserved = 0;
    return recorder;
}

-(BOOL)recording {
    return mRecordState.recording;
}

-(BOOL)prepareToRecord {
    float sampleRate = mRecordState.format.mSampleRate;
    [[AVAudioSession sharedInstance] setPreferredSampleRate:sampleRate error:nil];
    [[AVAudioSession sharedInstance] setPreferredIOBufferDuration:0.01 * sampleRate error:nil];
    OSStatus status;
    status = AudioQueueNewInput(&mRecordState.format,
                                AudioInputCallback,
                                (__bridge void *) self,
                                nil, nil, 0,
                                &mRecordState.queue);
    if (status != 0) {
        return NO;
    }
    AudioQueueRef queue = mRecordState.queue;
    UInt32 formatSize = sizeof(AudioStreamFormat);
    AudioQueueGetProperty(queue,
                          kAudioQueueProperty_StreamDescription,
                          &mRecordState.format,
                          &formatSize);
    int bufferSize = [self deriveBufferSize: 0.5];
    for (int i = 0; i < JK_MIC_NUM_BUFFERS; i++) {
        AudioQueueAllocateBuffer(queue,
                                 bufferSize,
                                 &mRecordState.buffers[i]);
        AudioQueueEnqueueBuffer(queue,
                                mRecordState.buffers[i],
                                0, NULL);
    }
    UInt32 metering = 1;
    AudioQueueSetProperty(queue,
                          kAudioQueueProperty_EnableLevelMetering,
                          &metering,
                          sizeof(UInt32));
    NSTimer *timer = [NSTimer timerWithTimeInterval:0.064
                                             target:self
                                           selector:@selector(samplePower)
                                           userInfo:nil
                                            repeats:true];
    _mPowerCheckTimer = timer;
    [[NSRunLoop currentRunLoop] addTimer:timer forMode: NSRunLoopCommonModes];
    return YES;
}

-(void)startRecording {
    if (mRecordState.recording) {
        return;
    }
    if (![self prepareToRecord]) {
        return;
    }
    mRecordState.recording = true;
    AudioQueueStart(mRecordState.queue, nil);
}

-(void)stopRecording {
    if (!mRecordState.recording) {
        return;
    }
    mRecordState.recording = false;
    if (self.mPowerCheckTimer) {
        [self.mPowerCheckTimer invalidate];
        self.mPowerCheckTimer = nil;
    }
    AudioQueueRef queue = mRecordState.queue;
    if (queue == nil) {
        return;
    }
    AudioQueueStop(queue, true);
    AudioQueueDispose(queue, true);
}

-(void)dispose {
    [self stopRecording];
}

- (void)dealloc {
    [self stopRecording];
}

-(int)deriveBufferSize:(Float64)seconds {
    AudioQueueRef queue = mRecordState.queue;
    if (queue == nil) {
        return 0;
    }
    AudioStreamFormat *format = &mRecordState.format;
    int maxBufferSize = 0x50000;
    int maxPacketSize = format->mBytesPerPacket;
    if (maxPacketSize == 0) {
        UInt32 maxVBRPacketSize = 0;
        AudioQueueGetProperty(
            queue,
            kAudioQueueProperty_MaximumOutputPacketSize,
            &maxPacketSize,
            &maxVBRPacketSize);
    }
    int numBytesForTime = format->mSampleRate * maxPacketSize * seconds;
    int bufferSize = numBytesForTime < maxBufferSize ? numBytesForTime : maxBufferSize;
    return bufferSize;
}

-(void)samplePower {
    id delegate = self.delegate;
    if (delegate == nil) {
        return;
    }
    AudioQueueRef queue = mRecordState.queue;
    if (queue == nil) {
        return;
    }
    AudioQueueLevelMeterState meters[1];
    UInt32 metersSize = sizeof(meters);
    OSStatus meterStatus = AudioQueueGetProperty(queue,
                                                 kAudioQueueProperty_CurrentLevelMeterDB,
                                                 &meters, &metersSize);
    if (meterStatus == 0) {
        return;
    }
    if ([delegate respondsToSelector:@selector(onNewAudioMeter:)]) {
        [delegate onNewAudioMeter:meters[0].mAveragePower];
    }
}

void AudioInputCallback(void *inUserData,
                        AudioQueueRef queue,
                        AudioQueueBufferRef buffer,
                        const AudioTimeStamp *startTimeRef,
                        UInt32 numPackets,
                        const AudioStreamPacketDescription *packetDescriptions) {
    if (inUserData == nil) {
        return;
    }
    JKMicrophoneRecorder *recorder = (__bridge JKMicrophoneRecorder *) inUserData;
    RecordState *recordState = &recorder->mRecordState;
    if (!recordState->recording) {
        return;
    }
    AudioStreamFormat *format = &recordState->format;
    if (numPackets == 0 && format->mBytesPerPacket != 0) {
        numPackets = buffer->mAudioDataByteSize / format->mBytesPerPacket;
    }
    id delegate = recorder.delegate;
    if (delegate != nil) {
        [delegate onNewAudioData:buffer->mAudioData length:buffer->mAudioDataByteSize];
    }
    AudioQueueEnqueueBuffer(queue, buffer, 0, nil);
}

@end
