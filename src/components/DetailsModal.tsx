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
      className="fixed inset-0 bg-paper-white/95 backdrop-blur-xl z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-fossil w-full max-w-4xl rounded-[16px] border border-pewter/20 shadow-2xl flex flex-col md:flex-row overflow-hidden"
        style={{ height: '90vh' }}
      >
        {/* Visual Preview */}
        <div className="w-full md:w-1/2 h-48 md:h-auto bg-paper-white flex items-center justify-center relative border-b md:border-b-0 md:border-r border-pewter/30 overflow-hidden shrink-0">
          {item.type === 'photo' ? (
            <img src={item.image_url} className="w-full h-full object-contain" alt={item.name} />
          ) : (
            <div className="w-full h-full p-4 md:p-8 flex items-center justify-center">
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
          <div className="absolute top-4 left-4 md:top-6 md:left-6 text-caption font-medium text-dusty-ash uppercase tracking-wide z-10">Resource Preview</div>
        </div>

        {/* Content & Edit Form */}
        <div className="flex-1 flex flex-col bg-fossil overflow-y-auto">
          <div className="p-4 md:p-8 border-b border-pewter/30 flex justify-between items-center bg-fossil sticky top-0 z-10">
            <div>
              <h3 className="text-subheading font-medium tracking-tight uppercase leading-none text-midnight-ink">EDIT<span className="text-dusty-ash ml-2">ENTRY</span></h3>
              <p className="text-caption text-dusty-ash uppercase tracking-wide mt-1">LAST SYNC: {new Date(item.created_at).toLocaleTimeString()}</p>
            </div>
            <button onClick={onClose} className="p-2 text-dusty-ash hover:text-midnight-ink transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="p-4 md:p-8 space-y-6 md:space-y-8 flex-1">
            {/* Form Fields */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-caption font-medium text-dusty-ash uppercase tracking-wide flex items-center gap-2">
                  <Tag size={14} className="text-midnight-ink" /> Item Identity
                </label>
                <input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-paper-white border border-pewter/30 px-4 py-3 text-body font-medium text-midnight-ink focus:border-midnight-ink outline-none transition-all rounded-[16px] uppercase"
                  placeholder="ITEM NAME"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-caption font-medium text-dusty-ash uppercase tracking-wide flex items-center gap-2">
                    <AlignLeft size={14} className="text-midnight-ink" /> Category
                  </label>
                  <input 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-paper-white border border-pewter/30 px-4 py-3 text-body font-medium text-midnight-ink focus:border-midnight-ink outline-none transition-all rounded-[16px] uppercase"
                    placeholder="ENTER CATEGORY"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-caption font-medium text-dusty-ash uppercase tracking-wide flex items-center gap-2">
                    <Home size={14} className="text-midnight-ink" /> Destination
                  </label>
                  <select 
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full bg-paper-white border border-pewter/30 px-4 py-3 text-body font-medium text-midnight-ink focus:border-midnight-ink outline-none transition-all rounded-[16px] uppercase appearance-none"
                  >
                    {ROOMS.filter(r => r !== 'All').map(room => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-caption font-medium text-dusty-ash uppercase tracking-wide">Aesthetic Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full bg-paper-white border border-pewter/30 px-4 py-3 text-body text-midnight-ink focus:border-midnight-ink outline-none transition-all resize-none rounded-[16px]"
                  placeholder="Describe the vibes..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 md:p-8 border-t border-pewter/30 bg-fossil flex flex-col sm:flex-row gap-4 mt-auto sticky bottom-0 z-10">
            <button 
              onClick={() => onDelete(item.id)}
              className="flex-1 bg-transparent text-midnight-ink border border-midnight-ink py-3 md:py-4 font-medium text-caption uppercase tracking-wide hover:bg-cardinal-red hover:text-paper-white hover:border-cardinal-red transition-all flex items-center justify-center gap-2 rounded-buttons group"
            >
              <Trash2 size={16} /> PURGE
            </button>
            <button 
              onClick={handleSave}
              className="flex-[2] bg-midnight-ink text-paper-white py-3 md:py-4 font-medium text-caption uppercase tracking-wide hover:bg-midnight-ink/90 active:scale-95 transition-all flex items-center justify-center gap-2 rounded-buttons shadow-sm"
            >
              <Check size={16} /> COMMIT CHANGES
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
