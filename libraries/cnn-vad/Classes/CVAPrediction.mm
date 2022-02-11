#include <stdlib.h>
#import "CVAPrediction.h"
#import <TensorFlowLiteObjC/TFLTensorFlowLite.h>
#include "TPCircularBuffer.h"
extern "C"{
#include "CNNAudioProcessing.h"
}
#import "CVAMovingAverageBuffer.h"

#ifndef SHORT2FLOAT
#define SHORT2FLOAT 1/32768.0
#endif

#ifndef FLOAT2SHORT
#define FLOAT2SHORT 32768.0;
#endif

@interface CVAPrediction()
@property CVAMovingAverageBuffer* predictBuffer;
@property (nonatomic) float mSampleRate;
@property (nonatomic) BOOL mLastPredict;
@property (nonatomic) BOOL mCnnUpdated;
@end

@implementation CVAPrediction {
    TPCircularBuffer inputBuffer;
    TPCircularBuffer cacheBuffer;
    CNNVariables* memoryPointer;
    CVAMovingAverageBuffer* timeBuffer;
    TFLInterpreter *tfInterpreter;
    float tensorInputMatrix[CNN_VAD_TENSOR_SHAPE][CNN_VAD_TENSOR_SHAPE];
    float tensorOutputMatrix[2];
    NSUInteger predictedRequestCount;
    NSUInteger skipPredictRequest;
    NSUInteger predictionPeriod;
    NSUInteger predictionPeriodEarly;
}

@synthesize predictBuffer;

-(id)init {
    return [self init:CNN_VAD_DEFAULT_SAMPLERATE];
}

-(id)initWithModel:(NSString *)path {
    return [self init:CNN_VAD_DEFAULT_SAMPLERATE withModel:path];
}

-(id)init:(float)sampleRate {
    NSString* source = [[NSBundle mainBundle] pathForResource:@"cnn_vad_model" ofType:@"tflite"];
    return [self init:sampleRate withModel:source];
}

-(id)init:(float)sampleRate withModel:(NSString *)path {
    self = [super init];
    self.mSampleRate = sampleRate;
    if (![self loadModelFromPath:path]) {
        return nil;
    }
    self.mCnnUpdated = NO;
    TPCircularBufferInit(&inputBuffer, 2048*16);
    TPCircularBufferInit(&cacheBuffer, round(sampleRate * 16 * 0.5));
    memoryPointer = cnnInitalize(sampleRate, CNN_VAD_FRAMESIZE);
    self.threshold = 0.5;
    [self setPredictRate:0.064];
    return self;
}

-(BOOL)lastPrediction {
    return self.mLastPredict;
}

-(NSData *)lastBuffer {
    int32_t availableBytes;
    void* tail = TPCircularBufferTail(&cacheBuffer, &availableBytes);
    TPCircularBufferConsume(&cacheBuffer, availableBytes);
    return [[NSData alloc] initWithBytes:tail length:availableBytes];
}

-(void)dealloc {
    TPCircularBufferCleanup(&inputBuffer);
    TPCircularBufferCleanup(&cacheBuffer);
    cnnDeinitialize(&memoryPointer);
}

- (BOOL)loadModelFromPath:(NSString *)path {
    TFLInterpreterOptions *options = [[TFLInterpreterOptions alloc] init];
    options.numberOfThreads = 2;
    NSError *error;
    tfInterpreter = [[TFLInterpreter alloc] initWithModelPath:path options:options error:&error];
    if (tfInterpreter == nil || error != nil) {
        NSString *results = [NSString stringWithFormat:@"Failed to create the interpreter due to error: %@", error.localizedDescription];
#if DEBUG
        NSLog(@"Error reading graph: %@", results);
#endif
        return NO;
    }
    [tfInterpreter allocateTensorsWithError:&error];
    if (error != nil) {
        NSString *results = [NSString stringWithFormat:@"Failed to create the interpreter due to error: %@", error.localizedDescription];
#if DEBUG
        NSLog(@"Error reading graph: %@", results);
#endif
        return NO;
    }
    return YES;
}

- (BOOL)predict {
    if (!self.mCnnUpdated) {
        return self.lastPrediction;
    }
    if (predictedRequestCount < skipPredictRequest) { // skip first n requests. Wrong detection
        ++predictedRequestCount;
        return NO;
    }
    BOOL predicted = NO;
    @try {
        TFLInterpreter *interpreter = tfInterpreter;
        if (interpreter == nil) {
#if DEBUG
            NSLog(@"TFinterpreter is not init");
#endif
            return NO;
        }
        NSError *error;
        TFLTensor *inputTensor = [interpreter inputTensorAtIndex:0 error:&error];
        if (error != nil) {
#if DEBUG
            NSLog(@"No input tensor: %@", error);
#endif
            return NO;
        }
        for (int i = 0; i < CNN_VAD_TENSOR_SHAPE; i++) {
            for (int j = 0; j < CNN_VAD_TENSOR_SHAPE; j++) {
                tensorInputMatrix[i][j] = memoryPointer->melSpectrogram->melSpectrogramImage[i][j];
            }
        }
        NSData *inputData = [[NSData alloc] initWithBytes:&tensorInputMatrix length:sizeof(tensorInputMatrix)];
        [inputTensor copyData:inputData error:&error];
        if (error != nil) {
#if DEBUG
            NSLog(@"Copy input tensor error: %@", error);
#endif
            return NO;
        }
        [interpreter invokeWithError:&error];
        if (error != nil) {
#if DEBUG
            NSLog(@"Invoke error: %@", error);
#endif
            return NO;
        }
        TFLTensor *outputTensor = [interpreter outputTensorAtIndex:0 error:&error];
        if (error != nil) {
#if DEBUG
            NSLog(@"No output tensor %@", error);
#endif
            return NO;
        }
        NSData *outputData = [outputTensor dataWithError:&error];
        if (error != nil) {
#if DEBUG
            NSLog(@"No output tensor data %@", error);
#endif
            return NO;
        }
        
        [outputData getBytes:&tensorOutputMatrix length:sizeof(tensorOutputMatrix)];
        float result = tensorOutputMatrix[1];
        [predictBuffer addDatum: [NSNumber numberWithFloat:result]];
#if DEBUG && CNN_DEBUG
        NSLog(@"predict %lu, %f %f %f", predictBuffer.count, result, predictBuffer.movingAverage, self.threshold);
#endif
        if (predictBuffer.count <= predictionPeriodEarly) {
            return NO;
        }
        predicted = predictBuffer.movingAverage > self.threshold;
        return predicted;
    } @finally {
        self.mLastPredict = predicted;
    }
}

- (void)reset {
    self.mCnnUpdated = NO;
    self.mLastPredict = NO;
    predictedRequestCount = 0;
    [predictBuffer reset];
    TPCircularBufferClear(&inputBuffer);
    TPCircularBufferClear(&cacheBuffer);
}

- (void)feedAudio:(void *)data length:(UInt32)length {
    TPCircularBufferProduceBytes(&inputBuffer, data, length);
    TPCircularBufferProduceBytes(&cacheBuffer, data, length);
    while (inputBuffer.fillCount >= CNN_VAD_FRAMESIZE * sizeof(short)) {
        [self processAudio];
    }
}

- (void)processAudio {
    uint32_t frameSize = CNN_VAD_FRAMESIZE * sizeof(short);
    int32_t availableBytes;
    short* tail = (short *)TPCircularBufferTail(&inputBuffer, &availableBytes);
    if (availableBytes >= frameSize) {
        cnnCompute(memoryPointer, tail);
        TPCircularBufferConsume(&inputBuffer, frameSize);
        self.mCnnUpdated = YES;
    }
}

- (void)setPredictRate:(float)predictRate {
    skipPredictRequest = round(0.45 / predictRate);
    predictionPeriod = ceil(0.3 / predictRate);
    predictionPeriodEarly = round(2.0 / 3.0 * predictionPeriod);
    predictBuffer = [[CVAMovingAverageBuffer alloc] initWithPeriod:predictionPeriod];
}

@end
