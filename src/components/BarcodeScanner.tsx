import React, { useEffect, useRef, useState } from 'react';
import Quagga from 'quagga';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose, isOpen }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && !isInitialized) {
      initializeScanner();
    }

    return () => {
      if (isInitialized) {
        Quagga.stop();
        setIsInitialized(false);
      }
    };
  }, [isOpen, isInitialized]);

  const initializeScanner = async () => {
    try {
      const config = {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment"
          }
        },
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader", 
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader"
          ]
        },
        locate: true,
        numOfWorkers: 2,
        frequency: 10,
        debug: {
          drawBoundingBox: true,
          showFrequency: false,
          drawScanline: true,
          showPattern: false
        }
      };

      await new Promise<void>((resolve, reject) => {
        Quagga.init(config, (err) => {
          if (err) {
            console.error('Quagga init error:', err);
            reject(err);
            return;
          }
          Quagga.start();
          setIsInitialized(true);
          resolve();
        });
      });

      Quagga.onDetected((result) => {
        const code = result.codeResult.code;
        if (code) {
          onScan(code);
          toast({
            title: "Barcode Scanned",
            description: `UPC: ${code}`,
          });
          handleClose();
        }
      });

    } catch (error) {
      console.error('Scanner initialization error:', error);
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Could not access camera for scanning.",
      });
    }
  };

  const handleClose = () => {
    if (isInitialized) {
      Quagga.stop();
      setIsInitialized(false);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="card-surface w-full max-w-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <QrCode className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-semibold">Scan UPC Code</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div 
              ref={scannerRef}
              className="relative w-full h-64 bg-muted rounded-xl overflow-hidden"
            >
              {!isInitialized && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Initializing camera...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Position the barcode within the viewfinder</p>
              <p>The scanner will automatically detect and scan the code</p>
            </div>

            <Button
              onClick={handleClose}
              variant="secondary"
              className="btn-secondary w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BarcodeScanner;
