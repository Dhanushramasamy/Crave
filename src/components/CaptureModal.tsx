import React, { useRef, useState } from 'react';
import CanvasDraw from 'react-canvas-draw';
import { Camera, PenTool, X, Check, Trash2, Undo, SwitchCamera } from 'lucide-react';
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
      className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-sidebar w-full max-w-4xl border border-zinc-800 shadow-2xl flex flex-col relative overflow-hidden"
        style={{ height: '85vh' }}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-sidebar">
          <div className="flex flex-col">
            <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none">ADD NEW<span className="text-accent underline"> ITEM</span></h3>
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Ready to take a picture</span>
          </div>
          
          <div className="flex gap-4">
             <div className="flex p-1 bg-zinc-900 border border-zinc-800">
              <button 
                onClick={() => { setActiveTab('photo'); setCapturedImage(null); }}
                className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'photo' ? 'bg-accent text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                SNAP
              </button>
              <button 
                onClick={() => { setActiveTab('sketch'); setCapturedImage(null); }}
                className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sketch' ? 'bg-accent text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                SKETCH
              </button>
              <button 
                onClick={() => { setActiveTab('text'); setCapturedImage(null); }}
                className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'text' ? 'bg-accent text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                TEXT
              </button>
            </div>
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* content area */}
        <div className="flex-1 bg-black relative overflow-hidden flex items-center justify-center">
          {/* Technical Grid Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none z-10" style={{ 
            backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
            backgroundSize: '40px 40px' 
          }} />

          {activeTab === 'photo' ? (
            capturedImage ? (
              <img src={capturedImage} className="w-full h-full object-contain" alt="Captured" />
            ) : (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transition-all duration-1000" />
            )
          ) : activeTab === 'sketch' ? (
            <div className="w-full h-full bg-zinc-50 cursor-crosshair">
              <CanvasDraw
                ref={canvasDrawRef}
                brushColor="#000"
                brushRadius={2}
                lazyRadius={0}
                canvasWidth={1200}
                canvasHeight={800}
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-zinc-900 p-12">
              <textarea 
                value={textValue}
                onChange={e => setTextValue(e.target.value)}
                placeholder="Type your notes here..."
                className="w-full h-full bg-transparent text-white text-3xl font-mono outline-none resize-none placeholder-zinc-700"
              />
            </div>
          )}
          
          {/* Controls */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-6 z-20 items-center">
            {activeTab === 'photo' && !capturedImage && (
              <>
                <button 
                  onClick={toggleCamera}
                  className="w-12 h-12 bg-zinc-900/80 backdrop-blur-md hover:bg-accent text-white hover:text-black rounded-full border border-zinc-800 flex items-center justify-center active:scale-90 transition-all"
                  title="Flip Camera"
                >
                  <SwitchCamera size={20} />
                </button>
                <button 
                  onClick={takePhoto}
                  className="w-20 h-20 bg-white hover:bg-accent rounded-full border-8 border-black shadow-2xl flex items-center justify-center active:scale-90 transition-all group"
                >
                  <div className="w-12 h-12 bg-black group-hover:bg-black rounded-full" />
                </button>
                <div className="w-12 h-12" /> {/* Spacer to balance the layout */}
              </>
            )}
            
            {(capturedImage || activeTab === 'sketch' || activeTab === 'text') && (
              <>
                <button 
                  onClick={() => {
                    if (activeTab === 'sketch') canvasDrawRef.current?.clear();
                    else if (activeTab === 'text') setTextValue('');
                    else setCapturedImage(null);
                  }}
                  className="px-8 py-4 bg-zinc-900 text-white border border-zinc-800 font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-2 group"
                >
                  <Trash2 size={16} /> <span>Discard</span>
                </button>
                {activeTab === 'sketch' && (
                  <button 
                    onClick={() => canvasDrawRef.current?.undo()}
                    className="px-8 py-4 bg-zinc-900 text-white border border-zinc-800 font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all"
                  >
                    <Undo size={16} />
                  </button>
                )}
                <button 
                  onClick={handleSave}
                  className="px-12 py-4 bg-accent text-black font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(204,255,0,0.3)]"
                >
                  <Check size={18} /> <span>Save Item</span>
                </button>
              </>
            )}
          </div>
          
          {/* Frame Decoration */}
          <div className="absolute bottom-4 left-4 h-12 w-12 border-l border-b border-accent opacity-20"></div>
          <div className="absolute bottom-4 right-4 h-12 w-12 border-r border-b border-accent opacity-20"></div>
        </div>
      </motion.div>
    </motion.div>
  );
}

