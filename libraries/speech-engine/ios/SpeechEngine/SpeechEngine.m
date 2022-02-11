#import "SpeechEngine.h"
#import <AVFoundation/AVFoundation.h>
#import <React/RCTLog.h>
#import <UIKit/UIKit.h>
#import <React/RCTUtils.h>
#import <React/RCTEventEmitter.h>
#import "SpeechRecognition.h"
#import "GoogleSpeechRecognitionEngine.h"

#ifndef DebugLog
#ifdef DEBUG
#define DebugLog(s, ...) NSLog(s, ##__VA_ARGS__)
#else
#define DebugLog(s, ...)
#endif
#endif

@interface SpeechEngine () <JKSpeechRecognitionDelegate>

@property (nonatomic) JKSpeechRecognition* speechRecognizer;
@property (nonatomic) AVAudioSession* audioSession;
/** Whether speech recognition is finishing.. */
@property (nonatomic) BOOL isTearingDown;
/** Previous category the user was on prior to starting speech recognition */
@property (nonatomic) NSString* priorAudioCategory;
@end

@implementation SpeechEngine
/** Returns "YES" if no errors had occurred */
-(BOOL) setupAudioSession {
    if ([self isHeadsetPluggedIn] || [self isHeadSetBluetooth]){
        [self.audioSession setCategory:AVAudioSessionCategoryPlayAndRecord withOptions:AVAudioSessionCategoryOptionAllowBluetooth error: nil];
    } else {
        [self.audioSession setCategory:AVAudioSessionCategoryPlayAndRecord withOptions:AVAudioSessionCategoryOptionDefaultToSpeaker error: nil];
    }
    
    NSError* audioSessionError = nil;
    
    // Activate the audio session
    [self.audioSession setActive:YES withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation error:&audioSessionError];
    
    if (audioSessionError != nil) {
        [self sendEventWithName:@"onSpeechError"
                           body:@{@"error": @{@"code": @"audio", @"message": [audioSessionError localizedDescription]}}];
        return NO;
    }

    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(teardown) name:RCTBridgeWillReloadNotification object:nil];
    
    return YES;
}

- (BOOL)isHeadsetPluggedIn {
    AVAudioSessionRouteDescription* route = [[AVAudioSession sharedInstance] currentRoute];
    for (AVAudioSessionPortDescription* desc in [route outputs]) {
        if ([[desc portType] isEqualToString:AVAudioSessionPortHeadphones] || [[desc portType] isEqualToString:AVAudioSessionPortBluetoothA2DP])
            return YES;
    }
    return NO;
}

-(BOOL)isHeadSetBluetooth {
    NSArray *arrayInputs = [[AVAudioSession sharedInstance] availableInputs];
    for (AVAudioSessionPortDescription *port in arrayInputs)
    {
        if ([port.portType isEqualToString:AVAudioSessionPortBluetoothHFP])
        {
            return YES;
        }
    }
    return NO;
}

- (void) teardown {
    self.isTearingDown = YES;
    
    // Set back audio session category
    if (self.speechRecognizer) {
        [self.speechRecognizer cancel];
        self.speechRecognizer = nil;
    }
    [self resetAudioSession];
    self.isTearingDown = NO;
}

-(void) resetAudioSession {
    if (self.audioSession == nil) {
        self.audioSession = [AVAudioSession sharedInstance];
    }
    // Set audio session to inactive and notify other sessions
    // [self.audioSession setActive:NO withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation error: nil];
    NSString* audioCategory = [self.audioSession category];
    // Category hasn't changed -- do nothing
    if ([self.priorAudioCategory isEqualToString:audioCategory]) return;
    // Reset back to the previous category
    if ([self isHeadsetPluggedIn] || [self isHeadSetBluetooth]) {
        [self.audioSession setCategory:self.priorAudioCategory withOptions:AVAudioSessionCategoryOptionAllowBluetooth error: nil];
    } else {
        [self.audioSession setCategory:self.priorAudioCategory withOptions:AVAudioSessionCategoryOptionDefaultToSpeaker error: nil];
    }
    // Remove pointer reference
    self.audioSession = nil;
}

- (void) setupAndStartRecognizing:(NSString*)language withAPIkey:(NSString *)apiKey {
    self.audioSession = [AVAudioSession sharedInstance];
    self.priorAudioCategory = [self.audioSession category];
    // Tear down resources before starting speech recognition..
    [self teardown];
    if (self.speechRecognizer == nil) {
        id<JKSpeechRecognizeEngine> engine = [GoogleSpeechRecognitionEngine initWithApikey:apiKey withLanguage:language];
        self.speechRecognizer = [JKSpeechRecognition initWithEngine:engine];
        self.speechRecognizer.interimResults = YES;
        self.speechRecognizer.delegate = self;
    } else {
        self.speechRecognizer.language = language;
    }
    
    // Start audio session...
    if (![self setupAudioSession]) {
        [self teardown];
        return;
    }
    [self.speechRecognizer startListening];
}

- (NSArray<NSString *> *)supportedEvents {
    return @[
        @"onSpeechResults",
        @"onSpeechStart",
        @"onSpeechPartialResults",
        @"onSpeechError",
        @"onSpeechEnd",
        @"onSpeechRecognized",
        @"onSpeechVolumeChanged"
    ];
}

#pragma mark - JKSpeechRecognitionDelegate
-(void)speechDidStartListening {
    DebugLog(@"->SPEECH DELEGATE: speechDidStartListening");
    [self sendEventWithName:@"onSpeechStart" body:nil];
}

-(void)speechDidEnd:(NSError *)error {
    DebugLog(@"->SPEECH DELEGATE: speechDidEnd, error: %@", error);
    if (error != nil) {
        [self sendEventWithName:@"onSpeechError" body:@{@"error": @{@"code": @"recognition_fail", @"message": error.localizedDescription}}];
    } else {
        [self sendEventWithName:@"onSpeechEnd" body:@{@"error": @false}];
    }
}

-(void)speechDidRecognizedText:(NSString *)text isFinal:(BOOL)isFinal {
    DebugLog(@"->SPEECH DELEGATE: speechDidRecognizedText: %@, %d", text, isFinal);
    [self sendEventWithName:@"onSpeechPartialResults" body:@{@"value": @[text]}];
    if (isFinal) {
        [self sendEventWithName:@"onSpeechResults" body:@{@"value": @[text]}];
    }
}

-(void)speechDidChangeAudio:(float)level {
    [self sendEventWithName:@"onSpeechVolumeChanged" body:@{@"value": [NSNumber numberWithFloat:level]}];
}

#pragma mark - React export

RCT_EXPORT_METHOD(stopSpeech:(RCTResponseSenderBlock)callback) {
    DebugLog(@"->FROM JS: stopSpeech");
    if (self.speechRecognizer) {
        [self.speechRecognizer stopListening];
    }
    callback(@[@false]);
}


RCT_EXPORT_METHOD(cancelSpeech:(RCTResponseSenderBlock)callback) {
    DebugLog(@"->FROM JS: cancelSpeech");
    if (self.speechRecognizer) {
        [self.speechRecognizer cancel];
    }
    callback(@[@false]);
}

RCT_EXPORT_METHOD(destroySpeech:(RCTResponseSenderBlock)callback) {
    DebugLog(@"->FROM JS: destroySpeech");
    [self teardown];
    callback(@[@false]);
}

RCT_EXPORT_METHOD(isSpeechAvailable:(RCTResponseSenderBlock)callback) {
    callback(@[@true]);
}

RCT_EXPORT_METHOD(isRecognizing:(RCTResponseSenderBlock)callback) {
    if (self.speechRecognizer) {
        if (self.speechRecognizer.listening) {
            callback(@[@true]);
            return;
        }
    }
    callback(@[@false]);
}

RCT_EXPORT_METHOD(startSpeech:(NSString*)localeStr opts:(NSDictionary *)opts callback:(RCTResponseSenderBlock)callback) {
    DebugLog(@"->FROM JS: startSpeech %@ - %@", localeStr, opts);
    if (self.speechRecognizer) {
        if (self.speechRecognizer.listening) {
            [self sendEventWithName:@"onSpeechError" body:@{@"error": RCTMakeError(@"Speech recognition already started!", nil, nil)}];
            return;
        }
    }
    NSString *apiKey = [opts[@"apikey"] copy];
    localeStr = [localeStr copy];
    [self setupAndStartRecognizing:localeStr withAPIkey:apiKey];
    callback(@[@false]);
}

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE()
@end
