#import <Foundation/Foundation.h>

@interface CVAMovingAverageBuffer : NSObject

@property (readonly, nonatomic) float movingAverage;
@property (readonly, nonatomic) float cumulativeAverage;
@property (readonly, nonatomic) NSUInteger count;

- (id) initWithPeriod:(NSUInteger)period;
- (void) addDatum:(NSNumber *)datum;
- (void) reset;

@end
