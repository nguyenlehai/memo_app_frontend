//
//  GoogleSpeechGRPC.h
//  SpeechEngine
//
//  Created by Trịnh Quân on 5/1/20.
//  Copyright © 2020 aimesoft.com. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <googleapis/CloudSpeech.pbrpc.h>

#define GG_SPEECH_SAMPLERATE 16000

NS_ASSUME_NONNULL_BEGIN
typedef void (^GoogleSpeechGRPCCompletionHandler)(StreamingRecognizeResponse * _Nullable object, NSError * _Nullable error);

@interface GoogleSpeechGRPC: NSObject

+(instancetype)sharedInstance;

-(void)streamAudioData:(NSData *)audioData
          withCompletion:(GoogleSpeechGRPCCompletionHandler)completion;

-(void)stopStreaming;

-(BOOL)isStreaming;

@property (nonatomic, strong) NSString *apiKey;
@property (nonatomic, strong) NSString *language;

@end

NS_ASSUME_NONNULL_END
