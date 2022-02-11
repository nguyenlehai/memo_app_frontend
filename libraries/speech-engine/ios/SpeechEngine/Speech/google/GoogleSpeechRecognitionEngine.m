//
//  GoogleSpeechRecognitionEngine.m
//
//  Created by Trịnh Quân on 5/2/20.
//  Copyright © 2020 aimesoft.com. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <CnnVad/CnnVad.h>
#import "GoogleSpeechRecognitionEngine.h"
#import "GoogleSpeechGRPC.h"
#import "MicrophoneRecorder.h"
#import "AudioDataRingBuffer.h"


#define RECORDING_BYTES_PER_SEC RECORDING_BYTES_PER_FRAME * RECORDING_CHANNEL_PER_FRAME * GG_SPEECH_SAMPLERATE
#define RECORDING_RING_BUFFER_SECONDS 0.8
#define VAD_CHECK_RATE 0.06
#define VAD_CHECK_THRESHOLD 0.45

@interface GoogleSpeechRecognitionEngine()<JKMicrophoneRecorderDelegate>
@property (nonatomic) float mLastRmsDb;
@property (nonatomic) BOOL mStopped;
@property (nonatomic) BOOL mActiveSpeech;
@property (nonatomic, strong) NSMutableData *mAudioData;
@property (nonatomic, strong) AudioDataRingBuffer *mRingBuffer;
@property (nonatomic, strong) GoogleSpeechGRPC *mRecognizeService;
@property (nonatomic, strong) JKMicrophoneRecorder *mMicro;
@property (nonatomic, strong) CVAMicrophone *mPredictMicro;
@property (nonatomic, strong) CVAPrediction *mPredict;
@property (nonatomic, strong) NSTimer *mVadTimer;

@property (nonatomic) NSTimeInterval mRingBufferTime;
@end

@implementation GoogleSpeechRecognitionEngine {
    GoogleSpeechGRPCCompletionHandler mStreamCompletionHandler;
}
@synthesize delegate;
@synthesize recognizing;

+ (instancetype)initWithApikey:(NSString *)apikey {
    return [self initWithApikey:apikey withLanguage:@"en-US"];
}

+ (instancetype)initWithApikey:(NSString *)apikey withLanguage:(NSString *)language {
    return [[self alloc] initWithApikey:apikey withLanguage:language];
}

-(id)initWithApikey:(NSString *)apikey withLanguage:(NSString *)language {
    self = [super init];
    self.delegate = delegate;
    self.mRecognizeService = [GoogleSpeechGRPC sharedInstance];
    self.mRecognizeService.apiKey = apikey;
    self.mRecognizeService.language = language;
    self.mRingBuffer = [[AudioDataRingBuffer alloc] initWithLimit:RECORDING_BYTES_PER_SEC * RECORDING_RING_BUFFER_SECONDS];
    self.mPredictMicro = [[CVAMicrophone alloc] initWithSampleRate:CNN_VAD_DEFAULT_SAMPLERATE sampleBuffer:CNN_VAD_BUFFER];
    self.mMicro = [JKMicrophoneRecorder initWithSampleRate:GG_SPEECH_SAMPLERATE];
    self.mMicro.delegate = self;
    self.mPredict = [[CVAPrediction alloc] init:CNN_VAD_DEFAULT_SAMPLERATE];
    self.mPredict.threshold = VAD_CHECK_THRESHOLD;
    [self.mPredict setPredictRate:VAD_CHECK_RATE];
    self.mLastRmsDb = 0;
    self.mStopped = NO;
    return self;
}

- (void)dealloc {
    self.mStopped = YES;
    if (self.mRecognizeService) {
        [self.mRecognizeService stopStreaming];
        self.mRecognizeService = nil;
    }
    [self stopRecord];
    if (self.mMicro != nil) {
        self.mMicro.delegate = nil;
        [self.mMicro dispose];
        self.mMicro = nil;
    }
    self.mAudioData = nil;
}

#pragma mark - JKSpeechRecognizeEngine
-(SpeechRecognizeAuthStatus)authStatus {
    AVAudioSessionRecordPermission permission = [[AVAudioSession sharedInstance] recordPermission];
    if (permission == AVAudioSessionRecordPermissionUndetermined) {
        return kSpeechRecognizeAuthStatus_notDetermined;
    }
    switch (permission) {
        case AVAudioSessionRecordPermissionUndetermined:
            return kSpeechRecognizeAuthStatus_notDetermined;
        case AVAudioSessionRecordPermissionGranted:
            return kSpeechRecognizeAuthStatus_allowed;
        default:
            return kSpeechRecognizeAuthStatus_denied;
    }
}

-(BOOL)recognizing {
    if (self.mRecognizeService != nil) {
        return [self.mRecognizeService isStreaming];
    }
    return NO;
}

-(NSString *)language {
    if (self.mRecognizeService != nil) {
        return [self.mRecognizeService language];
    }
    return @"";
}

- (void)setLanguage:(NSString *)language {
    if (self.mRecognizeService != nil) {
        [self.mRecognizeService setLanguage:language];
    }
}

- (void)startRecognize:(JKSpeechRecognizeEngineStartHandler)completion {
    [self cancelVADCheck];
    self.mActiveSpeech = NO;
    [self.mPredict reset];
    [self.mRingBuffer reset];
    __weak typeof(self) weakSelf = self;
    [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
        __strong typeof(self) self = weakSelf;
        if (self == nil) {
            return;
        }
        if (!granted) {
            completion([NSError errorWithDomain:@"" code:0 userInfo:@{NSLocalizedDescriptionKey:@"Permission error"}]);
            return;
        }
        GoogleSpeechGRPC *service = self.mRecognizeService;
        if (service == nil || service.apiKey.length == 0) {
            completion([NSError errorWithDomain:@"" code:0 userInfo:@{NSLocalizedDescriptionKey:@"API key error"}]);
            return;
        }
        self.mAudioData = [[NSMutableData alloc] initWithCapacity:0];
        BOOL started = [self startRecord];
        if (!started) {
            completion([NSError errorWithDomain:@"" code:0 userInfo:@{NSLocalizedDescriptionKey:@"Recorder error"}]);
            return;
        }
        completion(nil);
        self.mStopped = NO;
    }];
}

- (void)stopRecognize {
    [self cancelVADCheck];
    if (self.mStopped) {
        return;
    }
    if (!self.mActiveSpeech) {
        [self emitSpeechDidRecognized:nil withConfident:1];
    }
    [self stopRecord];
    if (self.mRecognizeService != nil) {
        [self.mRecognizeService stopStreaming];
    }
}

- (void)cancelRecognize {
    [self cancelVADCheck];
    if (self.mStopped) {
        return;
    }
    self.mStopped = YES;
    [self stopRecord];
    if (self.mRecognizeService != nil) {
        [self.mRecognizeService stopStreaming];
    }
}

- (NSTimeInterval)minimalDelay {
    return 2.5;
}

- (NSTimeInterval)initialDelay {
    return 14;
}

- (NSTimeInterval)secondaryDelay {
    return 6;
}

- (BOOL)startRecord {
    if (self.mPredictMicro == nil || self.mMicro == nil) {
        return NO;
    }
    __weak typeof(self) weakSelf = self;
    [self.mPredictMicro startRecording:^(void * _Nonnull audio, UInt32 length) {
        __strong typeof(self) self = weakSelf;
        if (self == nil) {
            return;
        }
        if (!self.mActiveSpeech) {
            [self.mPredict feedAudio:audio length:length];
        }
    }];
    [self.mMicro startRecording];
    self.mVadTimer = [NSTimer scheduledTimerWithTimeInterval:VAD_CHECK_RATE
                                                      target:self
                                                    selector:@selector(vadCheck)
                                                    userInfo:nil
                                                     repeats:YES];
    return YES;
}

- (void)stopRecord {
    [self cancelVADCheck];
    if (self.mPredictMicro != nil) {
        [self.mPredictMicro stopRecording];
    }
    if (self.mMicro != nil)  {
        [self.mMicro stopRecording];
    }
}

- (void)cancelVADCheck {
    if (self.mVadTimer == nil) {
        return;
    }
    [self.mVadTimer invalidate];
    self.mVadTimer = nil;
}

- (void)vadCheck {
    BOOL detected = [self.mPredict predict];
    if (!detected) {
        return;
    }
    [self emitNewPhrase:@"..." withConfident:0];
    [self cancelVADCheck];
    NSTimeInterval sinceBufferHeartBeat = [[NSDate date] timeIntervalSince1970] - self.mRingBufferTime;
    if (sinceBufferHeartBeat <= RECORDING_RING_BUFFER_SECONDS) {
        self.mAudioData = [[NSMutableData alloc] initWithData:self.mRingBuffer.innerData];
        [self.mRingBuffer reset];
    }
    self.mActiveSpeech = YES;
}

- (GoogleSpeechGRPCCompletionHandler)streamCompletion {
    if (!mStreamCompletionHandler) {
        __weak typeof(self) weakSelf = self;
        mStreamCompletionHandler = ^(StreamingRecognizeResponse *response, NSError * error) {
            __strong typeof(self) self = weakSelf;
            if (self == nil) {
                return;
            }
            if (error != nil) {
#if DEBUG
                NSLog(@"ERROR: %@", error);
#endif
                [self emitSpeechError:error];
                [self stopRecognize];
                return;
            }
#if DEBUG
            NSLog(@"RESPONSE: %@", response);
#endif
            if (response == nil) {
                return;
            }
            NSArray *resultArr = response.resultsArray;
            if (resultArr == nil || [resultArr count] == 0) {
                return;
            }
            StreamingRecognitionResult *streamRecognizeResult = resultArr.firstObject;
            resultArr = streamRecognizeResult.alternativesArray;
            if (resultArr == nil || [resultArr count] == 0) {
                return;
            }
            SpeechRecognitionAlternative *firstRecognizeResult = resultArr.firstObject;
            NSString *phrase = firstRecognizeResult.transcript;
            if (phrase == nil) {
                phrase = @"";
            } else {
                phrase = [phrase copy];
            }
            float confident = firstRecognizeResult.confidence;
            if (confident == 0) {
                confident = 1;
            }
            [self emitNewPhrase:phrase withConfident:confident];
            if (streamRecognizeResult.isFinal) {
                [self emitSpeechDidRecognized:phrase withConfident:confident];
            }
        };
    }
    return mStreamCompletionHandler;
}

#pragma mark - JKMicrophoneRecorderDelegate
- (void)onNewAudioData:(void *)data length:(UInt32)length {
    if (!self.mActiveSpeech) {
        [self.mRingBuffer appendBytes:data length:length];
        self.mRingBufferTime = [[NSDate date] timeIntervalSince1970];
        return;
    }
    GoogleSpeechGRPC *service = self.mRecognizeService;
    if (service == nil) {
        return;
    }
    NSMutableData *audioData = self.mAudioData;
    if (audioData == nil) {
        audioData = [[NSMutableData alloc] initWithCapacity:length];
    }
    [audioData appendBytes:data length: length];
    float minChunkSize = 0.1 * (GG_SPEECH_SAMPLERATE << 1);
    if ([audioData length] < minChunkSize) {
        self.mAudioData = audioData;
        return;
    }
    [service streamAudioData:audioData withCompletion:[self streamCompletion]];
    self.mAudioData = nil;
}

- (void)onNewAudioMeter:(Float32)level {
    if (level != self.mLastRmsDb) {
        self.mLastRmsDb = level;
        id delegate = self.delegate;
        if (delegate != nil && [delegate respondsToSelector:@selector(speechEngine:rmsChanged:)]) {
            [delegate speechEngine:self rmsChanged:level];
        }
    }
}

#pragma mark - Emit result
-(void)emitSpeechError:(NSError *)error {
    if (self.mStopped) { // already emit
        return;
    }
    self.mStopped = YES;
    id delegate = self.delegate;
    if (delegate != nil && [delegate respondsToSelector:@selector(speechEngine:didError:)]) {
        [delegate speechEngine:self didError:error];
    }
}

-(void)emitSpeechDidRecognized:(NSString *)phrase withConfident:(float)confident {
    if (self.mStopped) { // already emit
        return;
    }
    id delegate = self.delegate;
    if (delegate != nil && [delegate respondsToSelector:@selector(speechEngine:didRecognized:withConfident:)]) {
        [delegate speechEngine:self didRecognized:phrase withConfident:confident];
    }
    [self cancelRecognize];
}

-(void)emitNewPhrase:(NSString *)phrase withConfident:(float)confident {
    if (self.mStopped) { // already stopped
        return;
    }
    id<JKSpeechRecognizeEngineDelegate> delegate = self.delegate;
    if (delegate != nil) {
        [delegate speechEngine:self newPhrase:phrase withConfident:confident];
    }
}

@end
