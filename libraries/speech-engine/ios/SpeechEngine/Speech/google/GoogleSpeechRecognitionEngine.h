//
//  GoogleSpeechRecognitionEngine.h
//
//  Created by Trịnh Quân on 5/2/20.
//  Copyright © 2020 aimesoft.com. All rights reserved.

#import "SpeechRecognitionEngine.h"

NS_ASSUME_NONNULL_BEGIN

@interface GoogleSpeechRecognitionEngine : NSObject<JKSpeechRecognizeEngine>

+(instancetype)initWithApikey:(NSString *)apikey;
+(instancetype)initWithApikey:(NSString *)apikey withLanguage:(NSString *)language;

@end

NS_ASSUME_NONNULL_END
