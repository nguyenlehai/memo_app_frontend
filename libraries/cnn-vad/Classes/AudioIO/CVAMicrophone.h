//
//  CVAMicrophone.h
//  CNN-VAD
//
//  Created by Trịnh Quân on 5/8/20.
//  Copyright © 2020 Trịnh Quân. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^CVAMicrophoneDataHandler)(void * audio, UInt32 length);

@interface CVAMicrophone : NSObject
-(id)initWithSampleRate:(double)sampleRate sampleBuffer:(int)sampleBuffer;

-(void)startRecording:(CVAMicrophoneDataHandler)handler;
-(void)stopRecording;
@end

NS_ASSUME_NONNULL_END
