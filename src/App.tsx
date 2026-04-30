import React from 'react';
import { LayoutGrid, Camera, PenTool, Folder, Search, Sparkles, MoveRight, Trash2, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

  // Load items on mount
  React.useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured) {
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

  const handleCapture = async (data: { type: 'photo' | 'sketch', data: string }) => {
    setIsCaptureOpen(false);
    setIsAnalyzing(true);
    
    let analysis = { name: 'Untitled Item', category: 'General', room: 'Other', description: '' };
    
    if (data.type === 'photo') {
      const result = await analyzeImage(data.data);
      if (result) analysis = result;
    }

    const newItem: SpaceItem = {
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      name: analysis.name,
      category: analysis.category,
      room: analysis.room,
      description: analysis.description,
      image_url: data.type === 'photo' ? data.data : undefined,
      sketch_data: data.type === 'sketch' ? data.data : undefined,
      type: data.type
    };

    setItems([newItem, ...items]);
    setIsAnalyzing(false);

    if (isSupabaseConfigured) {
      await supabase.from('items').insert([newItem]);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setItems(items.filter(item => item.id !== id));
    setSelectedItem(null);
    if (isSupabaseConfigured) {
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
    <div className="min-h-screen flex bg-canvas text-zinc-100 font-sans selection:bg-accent selection:text-black">
      {/* Sidebar Navigation */}
      <aside className="w-80 border-r border-zinc-800 flex flex-col p-8 bg-sidebar sticky top-0 h-screen shrink-0">
        <div className="mb-16">
          <h1 className="text-4xl font-black tracking-tighter leading-none mb-2 italic">CRAVE<span className="text-accent">.</span></h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono">Visual Archive v1.0</p>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {ROOMS.map(room => (
            <div 
              key={room}
              onClick={() => setActiveRoom(room)}
              className={`group cursor-pointer py-2 border-b flex justify-between items-end transition-colors ${activeRoom === room ? 'border-accent text-accent' : 'border-zinc-800 hover:border-accent'}`}
            >
              <span className={`text-2xl font-bold tracking-tight uppercase group-hover:italic ${activeRoom === room ? 'italic' : ''}`}>{room}</span>
              <span className={`text-xs font-mono mb-1 transition-opacity ${activeRoom === room ? 'opacity-100' : 'opacity-40'}`}>
                {items.filter(i => room === 'All' || i.room === room).length.toString().padStart(2, '0')}
              </span>
            </div>
          ))}
        </nav>

        <div className="mt-8 pt-8 border-t border-zinc-800">
          <button 
            onClick={() => setIsCaptureOpen(true)}
            className="w-full bg-white text-black py-4 font-black text-sm uppercase tracking-widest hover:bg-accent transition-colors flex items-center justify-center gap-2 group active:scale-95"
          >
            <Camera size={18} className="group-hover:rotate-12 transition-transform" />
            SNAP NEW +
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-12 min-w-0">
        <header className="flex justify-between items-start mb-16">
          <div>
            <h2 className="text-7xl font-black tracking-tighter leading-[0.8] mb-6 uppercase">
              {activeRoom}<br/><span className="opacity-20">SPACES</span>
            </h2>
            <div className="flex gap-4 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
              <span>Sorted by: Recency</span>
              <span>/</span>
              <span>Viewing: Archive Grid</span>
            </div>
          </div>
          
          <div className="hidden lg:flex flex-col items-end">
            <div className="w-24 h-24 border-2 border-accent rounded-full flex items-center justify-center mb-4 group cursor-pointer hover:bg-accent transition-all">
              <span className="text-[10px] font-black leading-none text-center group-hover:text-black">SYS<br/>READY</span>
            </div>
          </div>
        </header>

        {/* Status indicator for analysis */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="mb-8 p-6 border-l-4 border-accent bg-zinc-900 flex items-center gap-4"
            >
              <Sparkles size={24} className="text-accent animate-pulse" />
              <div className="font-mono text-xs uppercase tracking-widest text-zinc-300">
                AI Analysis in progress... Extracting metadata
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
                  className="aspect-square bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden relative cursor-pointer"
                >
                   {item.type === 'photo' ? (
                     <>
                       <img 
                        src={item.image_url} 
                        className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700" 
                        alt={item.name} 
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                     </>
                   ) : (
                     <div className="w-full h-full bg-zinc-100 flex items-center justify-center p-12 relative overflow-hidden">
                        <PenTool size={64} className="text-black opacity-10 absolute rotate-12 -right-4 -bottom-4" />
                        <div className="z-10 w-full h-full border border-black/10 border-dashed flex items-center justify-center">
                          <span className="text-[10px] font-mono text-black uppercase tracking-widest font-bold">Concept Sketch Item</span>
                        </div>
                     </div>
                   )}
                   
                   <div className="absolute bottom-6 left-6 right-6 z-20">
                      <span className="text-[10px] font-mono text-zinc-400 mb-1 block uppercase tracking-tighter">
                        {item.category} / {item.room}
                      </span>
                      <div className={`w-full h-px mb-2 transition-all ${item.type === 'photo' ? 'bg-accent w-1/4 group-hover:w-full font-mono' : 'bg-black w-full'}`}></div>
                      <p className={`text-2xl font-black leading-tight uppercase tracking-tighter ${item.type === 'sketch' ? 'text-black' : 'text-white'}`}>
                        {item.name}
                      </p>
                   </div>

                   {/* Quick Actions Overlay */}
                   <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                        className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-accent hover:text-black transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                        className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>
                </div>
                <div className="mt-4 flex justify-between items-end cursor-pointer" onClick={() => setSelectedItem(item)}>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                      ID: {item.id}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      SAVED: {new Date(item.created_at).toLocaleDateString('en-GB').replace(/\//g, '.')}
                    </span>
                  </div>
                  <MoveRight size={18} className="text-accent opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Placeholders for visual rhythm */}
          {[...Array(Math.max(0, 3 - filteredItems.length))].map((_, i) => (
            <div key={`empty-${i}`} className="relative flex flex-col opacity-20 hover:opacity-40 transition-opacity">
              <div className="aspect-square border border-dashed border-zinc-800 flex items-center justify-center group">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Slot Empty</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Status Bar */}
      <footer className="fixed bottom-0 right-0 left-80 bg-sidebar border-t border-zinc-800 h-10 px-12 flex items-center justify-between text-[8px] font-mono tracking-widest text-zinc-500 uppercase z-30">
        <div className="flex gap-8">
          <span>STORAGE: NATIVE / SUPABASE</span>
          <span className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-accent animate-pulse' : 'bg-red-500'}`} />
            {isSupabaseConfigured ? 'CONNECTED TO SUPABASE CLOUD' : 'LOCAL CACHE ONLY'}
          </span>
        </div>
        <div className="flex gap-4">
          <span className="text-accent underline">AI ASSIST: ACTIVE</span>
          <span>EST. 2024</span>
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

