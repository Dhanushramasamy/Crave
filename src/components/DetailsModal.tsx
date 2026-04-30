import React, { useState } from 'react';
import { X, Check, Trash2, Tag, Home, AlignLeft } from 'lucide-react';
import { motion } from 'motion/react';
import CanvasDraw from 'react-canvas-draw';
import { SpaceItem, ROOMS } from '../types';

interface DetailsModalProps {
  item: SpaceItem;
  onUpdate: (id: string, updates: Partial<SpaceItem>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function DetailsModal({ item, onUpdate, onDelete, onClose }: DetailsModalProps) {
  const [formData, setFormData] = useState({
    name: item.name,
    category: item.category,
    room: item.room,
    description: item.description || ''
  });

  const handleSave = () => {
    onUpdate(item.id, formData);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-sidebar w-full max-w-4xl border border-zinc-800 shadow-2xl flex flex-col md:flex-row overflow-hidden"
        style={{ height: '80vh' }}
      >
        {/* Visual Preview */}
        <div className="w-full md:w-1/2 bg-white flex items-center justify-center relative border-r border-zinc-800 overflow-hidden">
          {item.type === 'photo' ? (
            <img src={item.image_url} className="w-full h-full object-contain" alt={item.name} />
          ) : (
            <div className="w-full h-full p-8 flex items-center justify-center">
               <CanvasDraw
                disabled
                hideGrid
                saveData={item.sketch_data}
                canvasWidth={400}
                canvasHeight={500}
                className="w-full h-full"
                backgroundColor="transparent"
              />
            </div>
          )}
          <div className="absolute top-4 left-4 font-mono text-[8px] text-black/50 uppercase tracking-[4px] z-10">Resource_Preview</div>
        </div>

        {/* Content & Edit Form */}
        <div className="flex-1 flex flex-col bg-sidebar overflow-y-auto">
          <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-sidebar sticky top-0 z-10">
            <div>
              <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">EDIT<span className="text-accent underline">_ENTRY</span></h3>
              <p className="text-[8px] font-mono text-zinc-500 uppercase mt-1">LAST SYNC: {new Date(item.created_at).toLocaleTimeString()}</p>
            </div>
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-8 flex-1">
            {/* Form Fields */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Tag size={12} className="text-accent" /> Item Identity
                </label>
                <input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-lg font-bold tracking-tight focus:border-accent outline-none transition-all uppercase italic"
                  placeholder="ITEM NAME"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <AlignLeft size={12} className="text-accent" /> Category
                  </label>
                  <input 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 px-4 py-2 font-mono text-xs focus:border-accent outline-none transition-all uppercase"
                    placeholder="ENTER CATEGORY"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Home size={12} className="text-accent" /> Destination
                  </label>
                  <select 
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 px-4 py-2 font-mono text-xs focus:border-accent outline-none transition-all uppercase appearance-none"
                  >
                    {ROOMS.filter(r => r !== 'All').map(room => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 text-zinc-100">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Aesthetic Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm font-medium focus:border-accent outline-none transition-all resize-none"
                  placeholder="Describe the vibes..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-8 border-t border-zinc-800 bg-sidebar flex gap-4 mt-auto sticky bottom-0 z-10">
            <button 
              onClick={() => onDelete(item.id)}
              className="flex-1 bg-zinc-900 text-zinc-500 border border-zinc-800 py-4 font-black text-[10px] uppercase tracking-widest hover:bg-red-950 hover:text-red-500 hover:border-red-500 transition-all flex items-center justify-center gap-2 group"
            >
              <Trash2 size={14} /> PURGE ARCHIVE
            </button>
            <button 
              onClick={handleSave}
              className="flex-[2] bg-accent text-black py-4 font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.2)]"
            >
              <Check size={14} /> COMMIT CHANGES
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
