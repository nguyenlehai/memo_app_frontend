//
//  CNMicrophone.m
//  CNN-VAD
//
//  Created by Trịnh Quân on 5/8/20.
//  Copyright © 2020 Trịnh Quân. All rights reserved.
//

#import "CVAMicrophone.h"
#import <AVFoundation/AVFoundation.h>
#import <AudioToolbox/AudioToolbox.h>
#import <AudioUnit/AudioUnit.h>

#define kInputBus 1

@interface CVAMicrophone() {
    AudioUnit        au;
    AudioBufferList  *inputBufferList;
}

@property AudioUnit au;
@property AudioBufferList *inputBufferList;
@property (nonatomic) double mSampleRate;
@property (nonatomic) int mSampleBuffer;
@property (nonatomic) BOOL mStarted;
@property (nonatomic, strong) CVAMicrophoneDataHandler mDataHandler;
@end

static OSStatus recordingCallback(void *inRefCon,
                                  AudioUnitRenderActionFlags *ioActionFlags,
                                  const AudioTimeStamp *inTimeStamp,
                                  UInt32 inBusNumber,
                                  UInt32 inNumberFrames,
                                  AudioBufferList *ioData) {
    CVAMicrophone *micro = (__bridge CVAMicrophone *) inRefCon;
    AudioBufferList *inputBufferList = micro.inputBufferList;
    inputBufferList->mNumberBuffers = 1;
    inputBufferList->mBuffers[0].mDataByteSize = inNumberFrames*sizeof(short);
    inputBufferList->mBuffers[0].mNumberChannels = 1;
    inputBufferList->mBuffers[0].mData = malloc(inputBufferList->mBuffers[0].mDataByteSize);
    
    AudioUnitRender(micro.au,
                        ioActionFlags,
                        inTimeStamp,
                        inBusNumber,
                        inNumberFrames,
                        inputBufferList);
    CVAMicrophoneDataHandler handlerFn = micro.mDataHandler;
    if (handlerFn != nil) {
        handlerFn((void*) inputBufferList->mBuffers[0].mData,
                inputBufferList->mBuffers[0].mDataByteSize);
    }
    free(inputBufferList->mBuffers[0].mData);
    inputBufferList->mBuffers[0].mData = NULL;
    return noErr;
}

@implementation CVAMicrophone
@synthesize au, inputBufferList;


-(id)initWithSampleRate:(double)sampleRate sampleBuffer:(int)sampleBuffer {
    self = [super init];
    self.mSampleRate = sampleRate;
    self.mSampleBuffer = sampleBuffer;
    return self;
}

-(void)startRecording:(CVAMicrophoneDataHandler)handler {
    self.mDataHandler = handler;
    if (self.mStarted) {
        return;
    }
    self.mStarted = YES;
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayAndRecord
                                           error: NULL];
    [[AVAudioSession sharedInstance] setMode:AVAudioSessionModeMeasurement
                                       error:NULL];
    [[AVAudioSession sharedInstance] setPreferredSampleRate:self.mSampleRate error:NULL];
    [[AVAudioSession sharedInstance] setPreferredIOBufferDuration:(float)self.mSampleBuffer/self.mSampleRate error:NULL];
    
    AudioComponentDescription desc;
    desc.componentType = kAudioUnitType_Output;
    desc.componentSubType = kAudioUnitSubType_RemoteIO;
    desc.componentFlags = 0;
    desc.componentFlagsMask = 0;
    desc.componentManufacturer = kAudioUnitManufacturer_Apple;
    AudioComponent component = AudioComponentFindNext(NULL, &desc);
    if (AudioComponentInstanceNew(component, &au) != 0) abort();
    UInt32 value = 1;
    if (AudioUnitSetProperty(au, kAudioOutputUnitProperty_EnableIO, kAudioUnitScope_Output, 0, &value, sizeof(value))) abort();
    value = 1;
    if (AudioUnitSetProperty(au, kAudioOutputUnitProperty_EnableIO, kAudioUnitScope_Input, 1, &value, sizeof(value))) abort();
    
    // 16-bit interleaved stereo PCM. While the native audio format is different, conversion does not add any latency (just some CPU).
    AudioStreamBasicDescription format;
    format.mSampleRate          = self.mSampleRate;
    format.mFormatID            = kAudioFormatLinearPCM;
    format.mFormatFlags         = kAudioFormatFlagIsSignedInteger;
    format.mFramesPerPacket     = 1;
    format.mChannelsPerFrame    = 1;
    format.mBitsPerChannel      = 16;
    format.mBytesPerPacket      = 2;
    format.mBytesPerFrame       = 2;
    if (AudioUnitSetProperty(au, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Input, 0, &format, sizeof(format))) abort();
    if (AudioUnitSetProperty(au, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Output, 1, &format, sizeof(format))) abort();
    // Set input callback
    AURenderCallbackStruct callbackStruct;
    callbackStruct.inputProc = recordingCallback;
    callbackStruct.inputProcRefCon = (__bridge void *)(self);
    AudioUnitSetProperty(au,
                         kAudioOutputUnitProperty_SetInputCallback,
                         kAudioUnitScope_Global,
                         kInputBus,
                         &callbackStruct,
                         sizeof(callbackStruct));
    inputBufferList = (AudioBufferList*) malloc(sizeof(AudioBufferList) + sizeof(AudioBuffer) * 2);
    AudioUnitInitialize(au);
    AudioOutputUnitStart(au);
}

-(void)stopRecording {
    if (!self.mStarted) {
        return;
    }
    self.mStarted = NO;
    self.mDataHandler = nil;
    AudioOutputUnitStop(au);
    free(inputBufferList);
    inputBufferList = NULL;
}

-(void)dealloc {
    [self stopRecording];
}

@end
