//
//  CNNAudioProcessing.h
//  CNNVad
//
//  Created by Abhishek Sehgal on 3/14/17.
//  Copyright © 2017 axs145031. All rights reserved.
//

#ifndef CNNAudioProcessing_h
#define CNNAudioProcessing_h

#include <stdio.h>
#include "CNNFTTTransforms.h"
#include "CNNMelSpectrogram.h"
#include "CNNFIRFilter.h"

typedef struct CNNVariables {
    
    FIR* downsampleFilter;
    Transform* fft;
    MelSpectrogram* melSpectrogram;
    
    float* inputBuffer;
    float* downsampled;
    float* decimated;
    float* frame;
    
    int samplingFrequency;
    int stepSize;
    int decimatedStepSize;
    
} CNNVariables;

CNNVariables* cnnInitalize(int frequency, int stepsize);
void cnnCompute(CNNVariables* memoryPointer, short* input);
void cnnGetMelImage(CNNVariables* memoryPointer, float** melImage);
void cnnDeinitialize(CNNVariables **memoryPointer);

#endif
