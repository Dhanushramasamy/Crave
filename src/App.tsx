import React from 'react';
import { LayoutGrid, Camera, PenTool, Folder, Search, Sparkles, MoveRight, Trash2, Edit3, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import logoImage from '../images/logo.png';
import CaptureModal from './components/CaptureModal';
import DetailsModal from './components/DetailsModal';
import { SpaceItem, ROOMS } from './types';
import { analyzeImage } from './services/geminiService';
import { supabase, isSupabaseConfigured } from './lib/supabase';

export default function App() {
  const [items, setItems] = React.useState<SpaceItem[]>([]);
  const [isCaptureOpen, setIsCaptureOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<SpaceItem | null>(null);
  const [activeRoom, setActiveRoom] = React.useState('All');
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [rooms, setRooms] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('userRooms');
    if (saved === JSON.stringify(['Living Room', 'Office', 'Bathroom', 'Bedroom', 'Kitchen', 'Outdoor', 'Other'])) {
      return [];
    }
    return saved ? JSON.parse(saved) : [];
  });
  const [isAddingRoom, setIsAddingRoom] = React.useState(false);
  const [newRoomName, setNewRoomName] = React.useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Load items on mount
  React.useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured) {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (catData && !catError) {
          const fetchedRooms = catData.map(c => c.name);
          if (fetchedRooms.length > 0) {
            setRooms(fetchedRooms);
            localStorage.setItem('userRooms', JSON.stringify(fetchedRooms));
          }
        }

        const { data, error } = await supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (data && !error) {
          setItems(data);
        }
      }
    }
    loadData();
  }, []);

  const handleCapture = async (data: { type: 'photo' | 'sketch' | 'text', data: string }) => {
    setIsCaptureOpen(false);
    setIsAnalyzing(true);
    
    let analysis = { name: 'Untitled Item', category: 'General', room: 'Other', description: '' };
    
    if (data.type === 'photo') {
      const result = await analyzeImage(data.data);
      if (result) analysis = result;
    } else if (data.type === 'text') {
      analysis.name = 'Text Note';
      analysis.description = data.data;
    }

    let finalImageUrl = data.type === 'photo' ? data.data : undefined;
    let finalSketchData = data.type === 'sketch' ? data.data : undefined;

    if (isSupabaseConfigured && data.type === 'photo' && data.data.startsWith('data:image')) {
      try {
        const response = await fetch(data.data);
        const blob = await response.blob();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('items')
          .upload(fileName, blob, { contentType: 'image/jpeg' });
          
        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('items')
            .getPublicUrl(uploadData.path);
          finalImageUrl = publicUrlData.publicUrl;
        }
      } catch (err) {
        console.error("Error uploading image:", err);
      }
    }

    const newItem: SpaceItem = {
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      name: analysis.name,
      category: analysis.category,
      room: activeRoom !== 'All' ? activeRoom : analysis.room,
      description: analysis.description,
      image_url: finalImageUrl,
      sketch_data: finalSketchData,
      type: data.type
    };

    setItems(prevItems => [newItem, ...prevItems]);
    setIsAnalyzing(false);

    // If Gemini suggested a new room, save it
    if (activeRoom === 'All' && analysis.room && !rooms.includes(analysis.room)) {
      const updatedRooms = [...rooms, analysis.room];
      setRooms(updatedRooms);
      localStorage.setItem('userRooms', JSON.stringify(updatedRooms));
      if (isSupabaseConfigured) {
        supabase.from('categories').insert([{ name: analysis.room }]).then();
      }
    }

    if (isSupabaseConfigured) {
      await supabase.from('items').insert([newItem]);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const itemToDelete = items.find(item => item.id === id);
    setItems(items.filter(item => item.id !== id));
    setSelectedItem(null);
    if (isSupabaseConfigured) {
      if (itemToDelete?.image_url && itemToDelete.image_url.includes('/storage/v1/object/public/items/')) {
         const path = itemToDelete.image_url.split('/storage/v1/object/public/items/')[1];
         if (path) {
           await supabase.storage.from('items').remove([path]);
         }
      }
      await supabase.from('items').delete().eq('id', id);
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<SpaceItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
    if (isSupabaseConfigured) {
      await supabase.from('items').update(updates).eq('id', id);
    }
  };

  const filteredItems = activeRoom === 'All' 
    ? items 
    : items.filter(item => item.room === activeRoom);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-paper-white text-midnight-ink font-cosmosoracle">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-6 border-b border-fossil bg-paper-white sticky top-0 z-30">
        <div>
          <img src={logoImage} alt="Crave Logo" className="h-8 w-auto object-contain" />
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-paper-white rounded-buttons border border-pewter text-midnight-ink">
           {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Scrim */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:sticky top-0 left-0 w-80 lg:w-80 border-r border-fossil flex flex-col p-8 bg-paper-white h-[100dvh] shrink-0 z-40 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="mb-16 hidden lg:block">
          <img src={logoImage} alt="Crave Logo" className="h-12 w-auto object-contain mb-4" />
          <p className="text-caption text-dusty-ash tracking-wide uppercase">Your Personal Collection</p>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          <div 
            onClick={() => { setActiveRoom('All'); setIsMobileMenuOpen(false); }}
            className={`group cursor-pointer py-2 border-b flex justify-between items-end transition-colors ${activeRoom === 'All' ? 'border-midnight-ink text-midnight-ink' : 'border-fossil hover:border-midnight-ink text-dusty-ash hover:text-midnight-ink'}`}
          >
            <span className={`text-subheading font-medium tracking-tight uppercase ${activeRoom === 'All' ? '' : ''}`}>All</span>
            <span className={`text-caption mb-1 transition-opacity ${activeRoom === 'All' ? 'opacity-100' : 'opacity-40'}`}>
              {items.length.toString().padStart(2, '0')}
            </span>
          </div>
          {rooms.map(room => (
            <div 
              key={room}
              onClick={() => { setActiveRoom(room); setIsMobileMenuOpen(false); }}
              className={`group cursor-pointer py-2 border-b flex justify-between items-end transition-colors ${activeRoom === room ? 'border-midnight-ink text-midnight-ink' : 'border-fossil hover:border-midnight-ink text-dusty-ash hover:text-midnight-ink'}`}
            >
              <span className={`flex items-center gap-2 text-subheading font-medium tracking-tight uppercase ${activeRoom === room ? '' : ''}`}>
                {room}
                <Trash2 
                  size={14} 
                  className="opacity-0 group-hover:opacity-100 hover:text-cardinal-red text-dusty-ash transition-opacity" 
                  onClick={(e) => {
                    e.stopPropagation();
                    const updated = rooms.filter(r => r !== room);
                    setRooms(updated);
                    localStorage.setItem('userRooms', JSON.stringify(updated));
                    if (isSupabaseConfigured) {
                      supabase.from('categories').delete().eq('name', room).then();
                    }
                    if (activeRoom === room) setActiveRoom('All');
                  }}
                />
              </span>
              <span className={`text-caption mb-1 transition-opacity ${activeRoom === room ? 'opacity-100' : 'opacity-40'}`}>
                {items.filter(i => room === 'All' || i.room === room).length.toString().padStart(2, '0')}
              </span>
            </div>
          ))}
          {isAddingRoom ? (
            <div className="py-2 border-b border-fossil flex items-center gap-2">
              <input 
                autoFocus
                type="text" 
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newRoomName.trim() && !rooms.includes(newRoomName.trim())) {
                    const newName = newRoomName.trim();
                    const updated = [...rooms, newName];
                    setRooms(updated);
                    localStorage.setItem('userRooms', JSON.stringify(updated));
                    setNewRoomName('');
                    setIsAddingRoom(false);
                    if (isSupabaseConfigured) {
                      supabase.from('categories').insert([{ name: newName }]).then();
                    }
                  } else if (e.key === 'Escape') {
                    setIsAddingRoom(false);
                    setNewRoomName('');
                  }
                }}
                onBlur={() => {
                  setIsAddingRoom(false);
                  setNewRoomName('');
                }}
                className="bg-transparent border-none outline-none text-subheading font-medium uppercase w-full text-midnight-ink placeholder:text-pewter"
                placeholder="NEW CATEGORY"
              />
            </div>
          ) : (
            <div 
              onClick={() => setIsAddingRoom(true)}
              className="group cursor-pointer py-2 border-b border-fossil hover:border-midnight-ink flex justify-between items-end transition-colors"
            >
              <span className="text-subheading font-medium tracking-tight uppercase text-dusty-ash group-hover:text-midnight-ink">+ ADD CATEGORY</span>
            </div>
          )}
        </nav>

        <div className="mt-8 pt-8 border-t border-fossil">
          <button 
            onClick={() => setIsCaptureOpen(true)}
            className="w-full bg-midnight-ink text-paper-white py-4 px-6 rounded-buttons font-medium text-body hover:bg-midnight-ink/90 transition-colors flex items-center justify-center gap-2 group active:scale-95 shadow-sm"
          >
            <Camera size={18} className="group-hover:scale-110 transition-transform" />
            SNAP NEW +
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-6 lg:p-12 lg:px-24 min-w-0 mb-10">
        <header className="flex justify-between items-start mb-16">
          <div>
            <h2 className="text-display font-medium tracking-display leading-display mb-6 uppercase text-midnight-ink">
              {activeRoom}<br/><span className="text-pewter">SPACES</span>
            </h2>
            <div className="flex gap-4 text-caption text-dusty-ash uppercase tracking-wide">
              <span>Sorted by: Recency</span>
              <span>/</span>
              <span>Viewing: Archive Grid</span>
            </div>
          </div>
          {activeRoom !== 'All' && (
            <button 
              onClick={() => setIsCaptureOpen(true)}
              className="px-6 py-4 bg-paper-white border border-midnight-ink text-midnight-ink rounded-buttons hover:bg-fossil active:scale-95 transition-all flex items-center justify-center shrink-0 gap-2 font-medium"
            >
              <Camera size={20} />
              <span>Capture</span>
            </button>
          )}
        </header>

        {/* Status indicator for analysis */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="mb-8 p-6 rounded-2xl border border-fossil bg-fossil flex items-center gap-4 shadow-sm"
            >
              <Sparkles size={24} className="text-terracotta animate-pulse" />
              <div className="text-body font-medium uppercase tracking-wide text-midnight-ink">
                Curating your item...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visual Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          <AnimatePresence mode="popLayout">
            {filteredItems.map(item => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative flex flex-col group"
              >
                <div 
                  onClick={() => setSelectedItem(item)}
                  className="aspect-square bg-fossil rounded-2xl flex items-center justify-center overflow-hidden relative cursor-pointer"
                >
                   {item.type === 'photo' ? (
                     <>
                       <img 
                        src={item.image_url} 
                        className="w-full h-full object-cover transition-all duration-700 hover:scale-105" 
                        alt={item.name} 
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-midnight-ink/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                     </>
                   ) : item.type === 'sketch' ? (
                     <div className="w-full h-full bg-paper-white flex items-center justify-center p-12 relative overflow-hidden">
                        <PenTool size={64} className="text-pewter opacity-20 absolute rotate-12 -right-4 -bottom-4" />
                        <div className="z-10 w-full h-full border border-pewter/30 border-dashed flex items-center justify-center">
                          <span className="text-caption text-dusty-ash uppercase tracking-wide font-medium">Concept Sketch Item</span>
                        </div>
                     </div>
                   ) : (
                     <div className="w-full h-full bg-paper-white flex flex-col p-6 relative overflow-hidden text-left border border-fossil">
                        <div className="z-10 flex-1 overflow-hidden w-full mt-2">
                          <p className="text-body text-dusty-ash break-words line-clamp-[8] whitespace-pre-wrap">{item.description}</p>
                        </div>
                     </div>
                   )}
                   
                   <div className="absolute bottom-6 left-6 right-6 z-20 pointer-events-none">
                      {/* Using hover overlay for info to maintain clean gallery look */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-4 group-hover:translate-y-0">
                        <span className="text-caption text-paper-white/80 mb-1 block uppercase tracking-wide">
                          {item.category} / {item.room}
                        </span>
                        <p className="text-subheading font-medium leading-tight text-paper-white drop-shadow-md">
                          {item.name}
                        </p>
                      </div>
                   </div>

                   {/* Quick Actions Overlay */}
                   <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                        className="p-3 bg-paper-white/90 backdrop-blur-md rounded-full text-midnight-ink hover:bg-paper-white transition-all shadow-sm"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                        className="p-3 bg-paper-white/90 backdrop-blur-md rounded-full text-midnight-ink hover:text-cardinal-red transition-all shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>
                </div>
                <div className="mt-4 flex justify-between items-start cursor-pointer px-2" onClick={() => setSelectedItem(item)}>
                  <div className="flex flex-col">
                    <p className="text-body font-medium text-midnight-ink leading-tight">
                      {item.name}
                    </p>
                    <span className="text-caption text-dusty-ash mt-1">
                      {item.category}
                    </span>
                  </div>
                  <MoveRight size={18} className="text-dusty-ash opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Placeholders for visual rhythm */}
          {[...Array(Math.max(0, 3 - filteredItems.length))].map((_, i) => (
            <div key={`empty-${i}`} className="relative flex flex-col opacity-40 hover:opacity-60 transition-opacity">
              <div className="aspect-square rounded-2xl border border-dashed border-pewter flex items-center justify-center group">
                <span className="text-caption text-dusty-ash uppercase tracking-wide">Slot Empty</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Status Bar */}
      <footer className="fixed bottom-0 right-0 left-0 lg:left-80 bg-paper-white border-t border-fossil h-12 px-4 lg:px-12 flex items-center justify-between text-caption text-dusty-ash z-30 tracking-wide uppercase">
        <div className="flex gap-8">
          <span className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-harvest-gold animate-pulse' : 'bg-cardinal-red'}`} />
            {isSupabaseConfigured ? 'Saved securely' : 'Not saved to cloud'}
          </span>
        </div>
        <div className="flex gap-4">
          <span className="text-midnight-ink underline cursor-pointer">Smart Assistant: On</span>
        </div>
      </footer>

      {/* Capture Modal */}
      <AnimatePresence>
        {isCaptureOpen && (
          <CaptureModal 
            onCapture={handleCapture}
            onClose={() => setIsCaptureOpen(false)}
          />
        )}
        {selectedItem && (
          <DetailsModal 
            item={selectedItem}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CCFF00;
        }
      `}</style>
    </div>
  );
}

