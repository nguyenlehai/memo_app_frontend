//
//  JKSpeechRecognitionEngine.h
//  SpeechEngine
//
//  Created by Trịnh Quân on 5/2/20.
//  Copyright © 2020 Aimesoft.com. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol JKSpeechRecognizeEngineDelegate
-(void)speechEngine:(id)sender newPhrase:(NSString *)phrase withConfident:(float)confident;
@optional
-(void)speechEngine:(id)sender didRecognized:(NSString *)lastPhrase withConfident:(float)confident;
-(void)speechEngine:(id)sender didError:(NSError *)error;
-(void)speechEngine:(id)sender rmsChanged:(float)rms;
@end

typedef NS_ENUM(NSUInteger, SpeechRecognizeAuthStatus) {
    kSpeechRecognizeAuthStatus_notDetermined,
    kSpeechRecognizeAuthStatus_allowed,
    kSpeechRecognizeAuthStatus_denied
};

typedef void (^JKSpeechRecognizeEngineStartHandler)(NSError  * _Nullable error);

@protocol JKSpeechRecognizeEngine
@property (nonatomic, weak) id<JKSpeechRecognizeEngineDelegate> delegate;
@property (nonatomic, readonly) SpeechRecognizeAuthStatus authStatus;
@property (nonatomic) NSString *language;
@property (nonatomic, readonly) BOOL recognizing;
@property (nonatomic, readonly) NSTimeInterval minimalDelay;

-(void)startRecognize:(JKSpeechRecognizeEngineStartHandler)completion;
-(void)stopRecognize;
-(void)cancelRecognize;

@optional
-(NSTimeInterval)initialDelay;
-(NSTimeInterval)secondaryDelay;

@end

NS_ASSUME_NONNULL_END
