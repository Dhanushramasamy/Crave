import React, { useRef, useState } from 'react';
import CanvasDraw from 'react-canvas-draw';
import { Camera, PenTool, X, Check, Trash2, Undo, SwitchCamera, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CaptureModalProps {
  onCapture: (data: { type: 'photo' | 'sketch' | 'text', data: string }) => void;
  onClose: () => void;
}

export default function CaptureModal({ onCapture, onClose }: CaptureModalProps) {
  const [activeTab, setActiveTab] = useState<'photo' | 'sketch' | 'text'>('photo');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [textValue, setTextValue] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasDrawRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async (currentFacingMode = facingMode) => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: currentFacingMode } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const toggleCamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    startCamera(newMode);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUri = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUri);
      
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    }
  };

  const handleSave = () => {
    if (activeTab === 'photo' && capturedImage) {
      onCapture({ type: 'photo', data: capturedImage });
    } else if (activeTab === 'sketch' && canvasDrawRef.current) {
      const data = canvasDrawRef.current.getSaveData();
      onCapture({ type: 'sketch', data });
    } else if (activeTab === 'text' && textValue.trim()) {
      onCapture({ type: 'text', data: textValue.trim() });
    }
  };

  React.useEffect(() => {
    if (activeTab === 'photo' && !capturedImage) {
      startCamera(facingMode);
    } else if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeTab, capturedImage]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-paper-white/95 backdrop-blur-xl z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-fossil w-full max-w-4xl rounded-[16px] shadow-2xl flex flex-col relative overflow-hidden"
        style={{ height: '90vh' }}
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-pewter/30 flex flex-col md:flex-row items-center justify-between bg-paper-white gap-4">
          <div className="flex flex-row items-center w-full md:w-auto justify-between">
            <div className="flex flex-col">
              <h3 className="text-subheading font-medium tracking-tight uppercase leading-none text-midnight-ink">ADD NEW<span className="text-dusty-ash ml-2">ITEM</span></h3>
              <span className="text-caption text-dusty-ash uppercase tracking-wide mt-1 hidden md:block">Ready to capture</span>
            </div>
            <button onClick={onClose} className="p-2 text-dusty-ash hover:text-midnight-ink transition-colors md:hidden">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex w-full md:w-auto gap-4 items-center justify-between">
             <div className="flex flex-1 md:flex-none p-1 bg-fossil rounded-buttons border border-pewter/30 w-full md:w-auto">
              <button 
                onClick={() => { setActiveTab('photo'); setCapturedImage(null); }}
                className={`flex-1 md:flex-none px-3 md:px-6 py-2 text-caption font-medium uppercase tracking-wide rounded-buttons transition-all ${activeTab === 'photo' ? 'bg-midnight-ink text-paper-white shadow-sm' : 'text-dusty-ash hover:text-midnight-ink'}`}
              >
                SNAP
              </button>
              <button 
                onClick={() => { setActiveTab('sketch'); setCapturedImage(null); }}
                className={`flex-1 md:flex-none px-3 md:px-6 py-2 text-caption font-medium uppercase tracking-wide rounded-buttons transition-all ${activeTab === 'sketch' ? 'bg-midnight-ink text-paper-white shadow-sm' : 'text-dusty-ash hover:text-midnight-ink'}`}
              >
                SKETCH
              </button>
              <button 
                onClick={() => { setActiveTab('text'); setCapturedImage(null); }}
                className={`flex-1 md:flex-none px-3 md:px-6 py-2 text-caption font-medium uppercase tracking-wide rounded-buttons transition-all ${activeTab === 'text' ? 'bg-midnight-ink text-paper-white shadow-sm' : 'text-dusty-ash hover:text-midnight-ink'}`}
              >
                TEXT
              </button>
            </div>
            <button onClick={onClose} className="p-2 text-dusty-ash hover:text-midnight-ink transition-colors hidden md:block">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* content area */}
        <div className="flex-1 bg-fossil relative overflow-hidden flex items-center justify-center">
          {activeTab === 'photo' ? (
            capturedImage ? (
              <img src={capturedImage} className="w-full h-full object-contain" alt="Captured" />
            ) : (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transition-all duration-1000" />
            )
          ) : activeTab === 'sketch' ? (
            <div className="w-full h-full bg-paper-white cursor-crosshair">
              <CanvasDraw
                ref={canvasDrawRef}
                brushColor="#0D0D0D"
                brushRadius={2}
                lazyRadius={0}
                canvasWidth={1200}
                canvasHeight={800}
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-paper-white p-12">
              <textarea 
                value={textValue}
                onChange={e => setTextValue(e.target.value)}
                placeholder="Type your notes here..."
                className="w-full h-full bg-transparent text-midnight-ink text-heading font-medium outline-none resize-none placeholder-pewter"
              />
            </div>
          )}
          
          {/* Controls */}
          <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex gap-4 md:gap-6 z-20 items-center">
            {activeTab === 'photo' && !capturedImage && (
              <>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 md:w-12 md:h-12 bg-paper-white/80 backdrop-blur-md hover:bg-fossil text-midnight-ink rounded-full border border-fossil flex items-center justify-center active:scale-90 transition-all shadow-sm"
                  title="Upload Photo"
                >
                  <Upload size={20} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  onClick={takePhoto}
                  className="w-16 h-16 md:w-20 md:h-20 bg-paper-white hover:bg-fossil rounded-full border-4 border-paper-white shadow-md flex items-center justify-center active:scale-90 transition-all group"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-midnight-ink rounded-full" />
                </button>
                <button 
                  onClick={toggleCamera}
                  className="w-10 h-10 md:w-12 md:h-12 bg-paper-white/80 backdrop-blur-md hover:bg-fossil text-midnight-ink rounded-full border border-fossil flex items-center justify-center active:scale-90 transition-all shadow-sm"
                  title="Flip Camera"
                >
                  <SwitchCamera size={20} />
                </button>
              </>
            )}
            
            {(capturedImage || activeTab === 'sketch' || activeTab === 'text') && (
              <div className="flex gap-2 md:gap-4 p-2 bg-paper-white/90 backdrop-blur-md rounded-buttons border border-pewter/30 shadow-sm">
                <button 
                  onClick={() => {
                    if (activeTab === 'sketch') canvasDrawRef.current?.clear();
                    else if (activeTab === 'text') setTextValue('');
                    else setCapturedImage(null);
                  }}
                  className="px-4 md:px-6 py-2 md:py-3 bg-transparent text-midnight-ink font-medium text-caption uppercase tracking-wide hover:bg-fossil rounded-buttons transition-all flex items-center gap-2"
                >
                  <Trash2 size={16} className="text-dusty-ash" /> <span className="hidden sm:inline">Discard</span>
                </button>
                {activeTab === 'sketch' && (
                  <button 
                    onClick={() => canvasDrawRef.current?.undo()}
                    className="px-4 md:px-6 py-2 md:py-3 bg-transparent text-midnight-ink font-medium text-caption uppercase tracking-wide hover:bg-fossil rounded-buttons transition-all"
                  >
                    <Undo size={16} className="text-dusty-ash" />
                  </button>
                )}
                <button 
                  onClick={handleSave}
                  className="px-6 md:px-8 py-2 md:py-3 bg-midnight-ink text-paper-white font-medium text-caption uppercase tracking-wide rounded-buttons hover:bg-midnight-ink/90 active:scale-95 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Check size={18} /> <span>Save Item</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

