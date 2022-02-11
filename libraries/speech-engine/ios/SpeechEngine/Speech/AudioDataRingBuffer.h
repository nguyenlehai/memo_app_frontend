//
//  AudioDataRingBuffer.h
//  SpeechEngine
//
//  Created by Trịnh Quân on 5/8/20.
//  Copyright © 2020 Aimesoft.com. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface AudioDataRingBuffer : NSObject
@property (nonatomic) NSUInteger limit;
@property (nonatomic, readonly) NSData *data;
@property (nonatomic, readonly) NSData *innerData;

-(id)initWithLimit:(NSUInteger)limit;

-(void)appendData:(NSData *)other;
-(void)appendBytes:(const void *)bytes length:(NSUInteger)length;
-(NSData *)consume:(NSUInteger)sizeHint;
-(void)reset;

@end

NS_ASSUME_NONNULL_END
