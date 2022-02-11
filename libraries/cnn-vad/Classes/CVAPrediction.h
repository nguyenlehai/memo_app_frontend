#import <Foundation/Foundation.h>

#define CNN_VAD_BUFFER 64
#define CNN_VAD_FRAMESIZE 600
#define CNN_VAD_DEFAULT_SAMPLERATE 48000
#define CNN_VAD_TENSOR_SHAPE 40

@interface CVAPrediction : NSObject
@property (nonatomic) float threshold;
@property (nonatomic, readonly) BOOL lastPrediction;
@property (nonatomic, readonly) NSData *lastBuffer;

- (id) init;
- (id) initWithModel:(NSString *)path;
- (id) init:(float)sampleRate;
- (id) init:(float)sampleRate withModel:(NSString *)path;

- (void) reset;
- (BOOL) predict;
- (void) feedAudio:(void*)data length:(UInt32)length;
- (void) setPredictRate:(float)rate;

@end
