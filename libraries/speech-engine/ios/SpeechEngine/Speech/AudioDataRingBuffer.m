//
//  RingNSData.m
//  SpeechEngine
//
//  Created by Trịnh Quân on 5/8/20.
//  Copyright © 2020 Aimesoft.com. All rights reserved.
//

#import "AudioDataRingBuffer.h"

@interface AudioDataRingBuffer()
@property (nonatomic, strong) NSMutableData *mInnerData;
@property (nonatomic) NSUInteger mInnerLimit;
@end

@implementation AudioDataRingBuffer

-(id)initWithLimit:(NSUInteger)limit {
    self = [super init];
    self.mInnerLimit = limit;
    self.mInnerData = [[NSMutableData alloc] initWithLength:0];
    return self;
}

-(void)setLimit:(NSUInteger)limit {
    self.mInnerLimit = limit;
    [self trim];
}

-(NSUInteger)limit {
    return self.mInnerLimit;
}

-(NSData *)data {
    return [[NSData alloc] initWithData:self.innerData];
}

-(NSData *)innerData {
    return self.mInnerData;
}

-(void)appendData:(NSData *)other {
    [self.mInnerData appendData:other];
    [self trim];
}

-(void)appendBytes:(const void *)bytes length:(NSUInteger)length {
    [self.mInnerData appendBytes:bytes length:length];
    [self trim];
}

-(NSData *)consume:(NSUInteger)sizeHint {
    if (self.innerData.length <= sizeHint) {
        NSData *data = [self data];
        self.mInnerData.length = 0;
        return data;
    }
    NSRange range = NSMakeRange(0, sizeHint);
    NSData *data = [self.innerData subdataWithRange:range];
    [self.mInnerData replaceBytesInRange:range withBytes:NULL length:0];
    return data;
}

-(void)reset {
    self.mInnerData.length = 0;
}

-(void)trim {
    NSUInteger limit = self.limit;
    if (limit <= 0 || self.innerData.length <= limit) {
        return;
    }
    NSRange range = NSMakeRange(0, self.innerData.length - limit);
    [self.mInnerData replaceBytesInRange:range withBytes:NULL length:0];
}

@end
