//
//  JKSpeechRecognition.m
//  SpeechEngine
//
//  Created by Trịnh Quân on 5/2/20.
//  Copyright © 2020 Aimesoft.com. All rights reserved.
//

#import "SpeechRecognition.h"

#define JK_FIRST_WAIT_TIME 6
#define JK_WAIT_THRESHOLD 2

@interface JKSpeechRecognition()<JKSpeechRecognizeEngineDelegate>

@property (nonatomic, strong) id<JKSpeechRecognizeEngine> mEngine;
@property (nonatomic, strong) NSString * __nullable mLastPhrase;
@property (nonatomic) BOOL mListening;
@property (nonatomic) BOOL mStopped;
@property (nonatomic) int mEmitCount;
@property (nonatomic, strong) NSTimer *mWaitTimer;

@end

@implementation JKSpeechRecognition

+(instancetype)initWithEngine:(id<JKSpeechRecognizeEngine>)engine {
    return [[self alloc] initWithEngine:engine];
}

-(instancetype)initWithEngine:(id<JKSpeechRecognizeEngine>)engine {
    self = [super init];
    self.mEngine = engine;
    engine.delegate = self;
    return self;
}

-(BOOL)listening {
    return self.mListening;
}

- (void)setLanguage:(NSString *)language {
    self.mEngine.language = language;
}

- (NSString *)language {
    return self.mEngine.language;
}

- (void)startListening {
    self.mLastPhrase = nil;
    self.mEmitCount = 0;
    __weak typeof(self) weakSelf = self;
    [self.mEngine startRecognize:^(NSError * error) {
        __strong typeof(self) self = weakSelf;
        if (self == nil) {
            return;
        }
        if (error == nil) {
            [self emitStarted];
            NSTimeInterval wait = JK_FIRST_WAIT_TIME;
            id engine = self.mEngine;
            if ([engine respondsToSelector:@selector(initialDelay)]) {
                wait = [engine initialDelay];
            }
            [self resetWaitingThreshold:wait];
        } else {
            [self emitError:error];
        }
    }];
}

-(void)stopListening {
    [self.mEngine stopRecognize];
}

-(void)cancel {
    [self.mEngine cancelRecognize];
    [self cancelWaitingThreshold];
    if (self.listening) {
         [self emitEnd];
    }
}

-(void)fireTextResult:(NSString * __nullable)phrase {
    if (self.mStopped) {
        return;
    }
    if (phrase != nil && [phrase length] > 0) {
        [self emitText:phrase isFinal:YES];
        [self emitEnd];
    } else {
#if DEBUG
        NSLog(@"No speech recognized");
#endif
        [self emitEnd];
    }
}

#pragma mark - wait threshold
-(void)resetWaitingThreshold:(NSTimeInterval)wait {
    [self cancelWaitingThreshold];
    wait = MAX(wait, self.mEngine.minimalDelay);
    self.mWaitTimer = [NSTimer scheduledTimerWithTimeInterval:wait
                                                       target:self
                                                     selector:@selector(onWaitingThreshold)
                                                     userInfo:nil
                                                      repeats:NO];
}

-(void)cancelWaitingThreshold {
    if (self.mWaitTimer != nil) {
        [self.mWaitTimer invalidate];
        self.mWaitTimer = nil;
    }
}

-(void)onWaitingThreshold {
    dispatch_async(dispatch_get_main_queue(), ^{
        [self fireTextResult:self.mLastPhrase];
        [self.mEngine cancelRecognize];
    });
}

#pragma mark - delegate bubble up
-(void)emitStarted {
    self.mListening = YES;
    self.mStopped = NO;
    id delegate = self.delegate;
    if (delegate != nil && [delegate respondsToSelector:@selector(speechDidStartListening)]) {
        [delegate speechDidStartListening];
    }
}

-(void)emitError:(NSError *)error {
    self.mListening = NO;
    self.mStopped = YES;
    id delegate = self.delegate;
    if (delegate != nil && [delegate respondsToSelector:@selector(speechDidEnd:)]) {
        [delegate speechDidEnd:error];
    }
}

-(void)emitEnd {
    self.mListening = NO;
    self.mStopped = YES;
    id delegate = self.delegate;
    if (delegate != nil && [delegate respondsToSelector:@selector(speechDidEnd:)]) {
        [delegate speechDidEnd:nil];
    }
}

-(void)emitText:(NSString *)text isFinal:(BOOL)final {
    id delegate = self.delegate;
    if (delegate != nil && [delegate respondsToSelector:@selector(speechDidRecognizedText:isFinal:)]) {
        [delegate speechDidRecognizedText:text isFinal:final];
    }
}

-(void)emitRms:(float)level {
    id delegate = self.delegate;
    if (delegate != nil && [delegate respondsToSelector:@selector(speechDidChangeAudio:)]) {
        [delegate speechDidChangeAudio:level];
    }
}

#pragma mark - SpeechRecognizeEngineDelegate
- (void)speechEngine:(nonnull id)sender newPhrase:(nonnull NSString *)phrase withConfident:(float)confident {
    self.mEmitCount += 1;
    if (confident > 0) {
        self.mLastPhrase = phrase;
    }
    if (self.mListening) {
        NSTimeInterval wait = JK_WAIT_THRESHOLD;
        if (self.mEmitCount < 2) {
            id engine = self.mEngine;
            if ([engine respondsToSelector:@selector(secondaryDelay)]) {
                wait = [engine secondaryDelay];
            }
        }
        [self resetWaitingThreshold:wait];
    } else {
        [self cancelWaitingThreshold];
    }
    if (self.interimResults && !self.mStopped) {
        [self emitText:phrase isFinal:NO];
    }
}
-(void)speechEngine:(id)sender didRecognized:(NSString *)lastPhrase withConfident:(float)confident {
    [self cancelWaitingThreshold];
    [self fireTextResult:lastPhrase];
}

-(void)speechEngine:(id)sender didError:(NSError *)error {
    [self cancelWaitingThreshold];
    if (!self.mStopped) {
        [self emitError:error];
    }
}

-(void)speechEngine:(id)sender rmsChanged:(float)rms {
    if (!self.mListening) {
        [self emitRms:rms];
    }
}
@end
