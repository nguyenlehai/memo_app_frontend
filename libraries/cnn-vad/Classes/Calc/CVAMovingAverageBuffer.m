#import "CVAMovingAverageBuffer.h"

@interface CVAMovingAverageBuffer()
@property (strong, nonatomic) NSMutableArray *queue;
@property (assign, nonatomic) NSUInteger period;
@property (assign, nonatomic) NSUInteger count;
@property (assign, nonatomic) float movingAverage;
@property (assign, nonatomic) float cumulativeAverage;
@end

@implementation CVAMovingAverageBuffer

- (id)initWithPeriod:(NSUInteger)period {
    
    self = [self init];
    if(self){
        _period = period;
        _queue = [NSMutableArray array];
    }
    return self;
}

- (void)addDatum:(NSNumber *)datum {
    
    [self.queue insertObject:datum atIndex:0];
    
    float removed = 0;
    float datumf = [datum floatValue];
    
    if(self.queue.count > self.period) {
        removed = [[self.queue lastObject] floatValue];
        [self.queue removeLastObject];
    }
    
    self.movingAverage = self.movingAverage - (removed/self.period) + (datumf/self.period);
    
    self.cumulativeAverage = self.cumulativeAverage + (datumf - self.cumulativeAverage)/++self.count;
    
}

- (void)reset {
    self.movingAverage = 0;
    self.cumulativeAverage = 0;
    self.count = 0;
    [self.queue removeAllObjects];
}

@end
