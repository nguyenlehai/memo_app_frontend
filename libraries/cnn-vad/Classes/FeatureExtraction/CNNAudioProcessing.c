//
//  CNNAudioProcessing.c
//  CNNVad
//
//  Created by Abhishek Sehgal on 3/14/17.
//  Copyright © 2017 axs145031. All rights reserved.
//

#include "CNNAudioProcessing.h"
#define SHORT2FLOAT         1/32768.0
#define FLOAT2SHORT         32768.0
#define NFILT               40
#define FREQLOW             300
#define FREQHIGH            8000
#define DECIMATION_FACTOR   3
#define EPS 1.0e-7
#define S2F 3.051757812500000e-05f
#define F2S 32768

CNNVariables* cnnInitalize(int frequency, int stepsize) {
    
    CNNVariables* inParam = (CNNVariables*) malloc(sizeof(CNNVariables));
    
    inParam->stepSize = stepsize;
    inParam->decimatedStepSize = stepsize/DECIMATION_FACTOR;
    inParam->samplingFrequency = frequency/DECIMATION_FACTOR;
    
    inParam->inputBuffer = (float*)calloc(stepsize, sizeof(float));
    inParam->downsampled = (float*)calloc(stepsize, sizeof(float));
    inParam->decimated   = (float*)calloc(2*inParam->decimatedStepSize, sizeof(float));
    
    inParam->fft = newTransform(2*inParam->decimatedStepSize, (int)(frequency/stepsize));
    inParam->melSpectrogram = initMelSpectrogram(NFILT, FREQLOW, FREQHIGH, 2*inParam->decimatedStepSize, inParam->samplingFrequency, inParam->fft->points);
    
    inParam->downsampleFilter = initFIR(stepsize);
    
    return inParam;
}

void cnnCompute(CNNVariables* memoryPointer, short* input) {
    CNNVariables* inParam = (CNNVariables*) memoryPointer;
    
    int i, j;
    
    for (i = 0; i < inParam->stepSize; i++) {
        inParam->inputBuffer[i] = input[i] * S2F;
    }
    // Downsample the audio
    processFIRFilter(inParam->downsampleFilter, inParam->inputBuffer, inParam->downsampled);
    
    // Decimate the audio
    for (i = 0, j = 0; i < inParam->decimatedStepSize; i++, j+= 3) {
        inParam->decimated[i] = inParam->decimated[i+inParam->decimatedStepSize];
        inParam->decimated[i+inParam->decimatedStepSize] = inParam->downsampled[j];
    }
    
    ForwardFFT(inParam->fft, inParam->decimated);
    updateImage(inParam->melSpectrogram, inParam->fft->power);
}

void cnnGetMelImage(CNNVariables* memoryPointer, float** melImage){
    CNNVariables* inParam = (CNNVariables*) memoryPointer;
    for (size_t i = 0; i < NFILT; i++) {
        for (size_t j = 0; j < NFILT; j++) {
            melImage[i][j] = inParam->melSpectrogram->melSpectrogramImage[i][j];
        }
    }
}

void cnnDeinitialize(CNNVariables **memoryPointer) {
    CNNVariables *in = *memoryPointer;
    if (in != NULL) {
        if (in->fft != NULL) {
            destroyTransform(&in->fft);
            in->fft = NULL;
        }
        if (in->melSpectrogram != NULL) {
            destroyMelSpectrogram(&in->melSpectrogram);
            in->melSpectrogram = NULL;
        }
        if (in->downsampleFilter != NULL) {
            destroyFIR(&in->downsampleFilter);
            in->downsampleFilter = NULL;
        }
        if (in->inputBuffer != NULL) {
            free(in->inputBuffer);
            in->inputBuffer = NULL;
        }
        if (in->downsampled != NULL) {
            free(in->downsampled);
            in->downsampled = NULL;
        }
        if (in->decimated != NULL) {
            free(in->decimated);
            in->decimated = NULL;
        }
        free(in);
        (*memoryPointer) = NULL;
    }
}
