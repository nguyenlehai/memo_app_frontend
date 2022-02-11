//
//  SpeechRecognitionService.m
//  SpeechEngine
//
//  Created by Trịnh Quân on 5/1/20.
//  Copyright © 2020 aimesoft.com. All rights reserved.
//

#import "GoogleSpeechGRPC.h"
#import <GRPCClient/GRPCCall.h>
#import <RxLibrary/GRXBufferedPipe.h>
#import <ProtoRPC/ProtoRPC.h>

#define HOST @"speech.googleapis.com"

@interface GoogleSpeechGRPC()

@property (nonatomic, assign) BOOL streaming;
@property (nonatomic, strong) Speech *client;
@property (nonatomic, strong) GRXBufferedPipe *writer;
@property (nonatomic, strong) GRPCProtoCall *call;

@end

@implementation GoogleSpeechGRPC

+(instancetype)sharedInstance {
    static GoogleSpeechGRPC *instance = nil;
    if (!instance) {
        instance = [[self alloc] init];
        instance.language = @"en-US";
        instance.apiKey = @"";
    }
    return instance;
}

-(void)setApiKey:(NSString *)apiKey{
    if (apiKey.length == 0 || [_apiKey isEqualToString:apiKey]) {
        return;
    }
    _apiKey = apiKey;
    [self stopStreaming];
}

-(void)setLanguage:(NSString *)language{
    if (language.length == 0 || [_language isEqualToString:language]) {
        return;
    }
    _language = language;
    [self stopStreaming];
}

-(void)streamAudioData:(NSData *)audioData
        withCompletion:(GoogleSpeechGRPCCompletionHandler)completion {
    
    if (!_streaming) {
        // if we aren't already streaming, set up a gRPC connection
        _client = [[Speech alloc] initWithHost:HOST];
        _writer = [[GRXBufferedPipe alloc] init];
        _call = [_client RPCToStreamingRecognizeWithRequestsWriter:_writer
                                                      eventHandler:^(BOOL done, StreamingRecognizeResponse *response, NSError *error) {
            completion(response, error);
        }];
        
        // authenticate using an API key obtained from the Google Cloud Console
        _call.requestHeaders[@"X-Goog-Api-Key"] = self.apiKey;
        // if the API key has a bundle ID restriction, specify the bundle ID like this
        _call.requestHeaders[@"X-Ios-Bundle-Identifier"] = [[NSBundle mainBundle] bundleIdentifier];
        
#if DEBUG
        NSLog(@"HEADERS: %@", _call.requestHeaders);
#endif
        
        [_call start];
        _streaming = YES;
        
        // send an initial request message to configure the service
        RecognitionConfig *recognitionConfig = [RecognitionConfig message];
        recognitionConfig.encoding = RecognitionConfig_AudioEncoding_Linear16;
        recognitionConfig.sampleRateHertz = GG_SPEECH_SAMPLERATE;
        recognitionConfig.languageCode = self.language;
        recognitionConfig.maxAlternatives = 2;
        
        StreamingRecognitionConfig *streamingRecognitionConfig = [StreamingRecognitionConfig message];
        streamingRecognitionConfig.config = recognitionConfig;
        streamingRecognitionConfig.singleUtterance = NO;
        streamingRecognitionConfig.interimResults = YES;
        
        StreamingRecognizeRequest *streamingRecognizeRequest = [StreamingRecognizeRequest message];
        streamingRecognizeRequest.streamingConfig = streamingRecognitionConfig;
        
        [_writer writeValue:streamingRecognizeRequest];
    }
    
    // send a request message containing the audio data
    StreamingRecognizeRequest *streamingRecognizeRequest = [StreamingRecognizeRequest message];
    streamingRecognizeRequest.audioContent = audioData;
    [_writer writeValue:streamingRecognizeRequest];
}

-(void)stopStreaming {
    if (!_streaming) {
        return;
    }
    [_writer finishWithError:nil];
    _streaming = NO;
}

-(BOOL)isStreaming {
    return _streaming;
}

@end
