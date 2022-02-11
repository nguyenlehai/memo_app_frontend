//
//  JKSpeechRecognition.h
//  SpeechEngine
//
//  Created by Trịnh Quân on 5/2/20.
//  Copyright © 2020 Aimesoft.com. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "SpeechRecognitionEngine.h"

NS_ASSUME_NONNULL_BEGIN

@protocol JKSpeechRecognitionDelegate
-(void)speechDidStartListening;
-(void)speechDidEnd:(NSError * __nullable)error;
-(void)speechDidRecognizedText:(NSString *)text isFinal:(BOOL)isFinal;
-(void)speechDidChangeAudio:(float)level;
@end

@interface JKSpeechRecognition : NSObject
+(instancetype)initWithEngine:(id<JKSpeechRecognizeEngine>)engine;

@property (nonatomic, readonly) BOOL listening;
@property (nonatomic) NSString *language;
@property (nonatomic) BOOL interimResults;
@property (nonatomic, weak) id<JKSpeechRecognitionDelegate> __nullable delegate;

-(void)startListening;
-(void)stopListening;
-(void)cancel;

@end

NS_ASSUME_NONNULL_END
