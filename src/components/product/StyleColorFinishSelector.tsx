import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface DoorStyle {
  id: string;
  name: string;
  base_rate_per_sqm: number;
  image_url?: string;
}

interface Color {
  id: string;
  name: string;
  surcharge_rate_per_sqm: number;
  hex_code?: string;
}

interface Finish {
  id: string;
  name: string;
  rate_per_sqm: number;
  finish_type: string;
}

interface StyleColorFinishSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doorStyles: DoorStyle[];
  colors: Color[];
  finishes: Finish[];
  selectedDoorStyle?: string;
  selectedColor?: string;
  selectedFinish?: string;
  onSelectionComplete: (doorStyleId: string, colorId: string, finishId: string) => void;
}

export const StyleColorFinishSelector: React.FC<StyleColorFinishSelectorProps> = ({
  open,
  onOpenChange,
  doorStyles,
  colors,
  finishes,
  selectedDoorStyle,
  selectedColor,
  selectedFinish,
  onSelectionComplete
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [tempDoorStyle, setTempDoorStyle] = useState(selectedDoorStyle || '');
  const [tempColor, setTempColor] = useState(selectedColor || '');
  const [tempFinish, setTempFinish] = useState(selectedFinish || '');

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete selection
      if (tempDoorStyle && tempColor && tempFinish) {
        onSelectionComplete(tempDoorStyle, tempColor, tempFinish);
        onOpenChange(false);
      }
    }
  };

  const handleDoorStyleSelect = (styleId: string) => {
    setTempDoorStyle(styleId);
    // Auto-advance to color step
    setTimeout(() => {
      setCurrentStep(2);
    }, 300);
  };

  const handleColorSelect = (colorId: string) => {
    setTempColor(colorId);
    // Auto-advance to finish step
    setTimeout(() => {
      setCurrentStep(3);
    }, 300);
  };

  const handleFinishSelect = (finishId: string) => {
    setTempFinish(finishId);
    // Auto-complete and close
    setTimeout(() => {
      if (tempDoorStyle && tempColor) {
        onSelectionComplete(tempDoorStyle, tempColor, finishId);
        onOpenChange(false);
      }
    }, 300);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!tempDoorStyle;
      case 2:
        return !!tempColor;
      case 3:
        return !!tempFinish;
      default:
        return false;
    }
  };

  const steps = [
    { number: 1, title: 'Door Style', subtitle: 'Choose your door design' },
    { number: 2, title: 'Color', subtitle: 'Select your color' },
    { number: 3, title: 'Finish', subtitle: 'Pick your finish' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header with Steps */}
        <DialogHeader>
          <DialogTitle className="text-xl">Customize Your Cabinet</DialogTitle>
          <div className="flex items-center justify-center gap-4 mt-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex flex-col items-center ${index > 0 ? 'ml-4' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep === step.number 
                      ? 'bg-primary text-primary-foreground' 
                      : currentStep > step.number
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {currentStep > step.number ? <Check className="w-4 h-4" /> : step.number}
                  </div>
                  <div className="text-xs text-center mt-1">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-muted-foreground">{step.subtitle}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-px ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-muted'
                  } mx-2 mt-[-20px]`} />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-1">
          {/* Step 1: Door Style */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Choose Door Style</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doorStyles.map((style) => (
                  <Card 
                    key={style.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      tempDoorStyle === style.id ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleDoorStyleSelect(style.id)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-muted">
                        {style.image_url ? (
                          <img 
                            src={style.image_url} 
                            alt={style.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-4xl">🚪</div>
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium text-center">{style.name}</h4>
                      <p className="text-sm text-muted-foreground text-center mt-1">
                        +${style.base_rate_per_sqm}/m²
                      </p>
                      {tempDoorStyle === style.id && (
                        <div className="flex justify-center mt-2">
                          <Badge variant="default" className="text-xs">
                            <Check className="w-3 h-3 mr-1" /> Selected
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Color */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Choose Color</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {colors.map((color) => (
                  <Card 
                    key={color.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      tempColor === color.id ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleColorSelect(color.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center space-y-3">
                        <div 
                          className="w-16 h-16 rounded-full border-2 border-border shadow-sm"
                          style={{ backgroundColor: color.hex_code || '#f3f4f6' }}
                        />
                        <div className="text-center">
                          <h4 className="font-medium text-sm">{color.name}</h4>
                          {color.surcharge_rate_per_sqm > 0 && (
                            <p className="text-xs text-muted-foreground">
                              +${color.surcharge_rate_per_sqm}/m²
                            </p>
                          )}
                        </div>
                        {tempColor === color.id && (
                          <Badge variant="default" className="text-xs">
                            <Check className="w-3 h-3 mr-1" /> Selected
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Finish */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Choose Finish</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {finishes.map((finish) => (
                  <Card 
                    key={finish.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      tempFinish === finish.id ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleFinishSelect(finish.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{finish.name}</h4>
                          <p className="text-sm text-muted-foreground">{finish.finish_type}</p>
                          {finish.rate_per_sqm > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              +${finish.rate_per_sqm}/m²
                            </p>
                          )}
                        </div>
                        {tempFinish === finish.id && (
                          <Badge variant="default" className="text-xs">
                            <Check className="w-3 h-3 mr-1" /> Selected
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between p-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of 3
          </div>
          
          <Button 
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2"
          >
            {currentStep === 3 ? 'Complete' : 'Next'}
            {currentStep < 3 && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};