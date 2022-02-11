//
//  JKMicrophoneRecorder.h
//  SpeechEngine
//
//  Created by Trịnh Quân on 5/1/20.
//  Copyright © 2020 aimesoft.com. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>

#define RECORDING_BYTES_PER_FRAME 2
#define RECORDING_CHANNEL_PER_FRAME 1

NS_ASSUME_NONNULL_BEGIN

@protocol JKMicrophoneRecorderDelegate
-(void)onNewAudioData:(void *)audioData length:(UInt32)length;
@optional
-(void)onNewAudioMeter:(Float32)level;
@end

@interface JKMicrophoneRecorder : NSObject

@property (nonatomic, weak) id<JKMicrophoneRecorderDelegate> __nullable delegate;
@property (nonatomic, readonly) AudioStreamBasicDescription format;
@property (nonatomic, readonly) BOOL recording;

+(instancetype)initWithSampleRate:(int)rate;
-(void)startRecording;
-(void)stopRecording;
-(void)dispose;

@end

NS_ASSUME_NONNULL_END
