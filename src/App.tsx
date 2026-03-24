import { 
  Search, 
  Menu, 
  Grid, 
  FolderHeart, 
  User, 
  ArrowLeft, 
  MoreVertical, 
  ArrowUpRight,
  Bookmark,
  Share2,
  ExternalLink,
  Lock,
  Shuffle,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  FileText,
  ImageIcon,
  Loader2,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useCallback } from 'react';
import { searchInternetArchive, getArchiveImageUrl, getArchiveItemUrl, getArchiveItemMetadata } from './services/archiveService';

// --- Types ---

type View = 'DOSSIER' | 'INVESTIGATE' | 'VAULT' | 'IDENTITY' | 'DETAIL';

interface ArchiveItem {
  id: string;
  title: string;
  type: string;
  year: string;
  size?: string;
  description: string;
  image?: string;
  featured?: boolean;
  fileNo?: string;
  status?: 'CLASSIFIED' | 'RESTRICTED' | 'DECLASSFIED';
  tags?: string[];
  narrative?: string;
  director?: string;
  releaseDate?: string;
  runtime?: string;
  identifier?: string;
  creator?: string;
  directUrl?: string;
}

// --- Mock Data ---

const ARCHIVES: ArchiveItem[] = [
  {
    id: '1',
    title: 'THE NOIR UNDERGROUND: 1948',
    type: 'FILM',
    year: '1948',
    size: '422.5 MB',
    description: 'Recovered film reels documenting the shadow economy of post-war San Francisco.',
    image: 'https://picsum.photos/seed/noir1/800/600?grayscale',
    featured: true,
    fileNo: '1948-NOIR',
    status: 'CLASSIFIED',
    director: 'Howard Hawks',
    releaseDate: 'Aug 31, 1946',
    runtime: '114 Minutes',
    narrative: 'Private investigator Philip Marlowe is hired by General Sternwood to help resolve the gambling debts of his wild young daughter, Carmen. Marlowe soon finds himself entangled in a web of blackmail, murder, and high-society deceit.',
    tags: ['#CRIME-FICTION', '#HARD-BOILED', '#SHADOW-PLAY', '#RAYMOND-CHANDLER', '#CYNICISM']
  },
  {
    id: '2',
    title: 'Project Blue Book: Unfiltered',
    type: 'DOCUMENT',
    year: '1952',
    size: '12.8 MB',
    description: 'Direct transcriptions of celestial anomalies recorded over the Mojave.',
    fileNo: '992-B',
    status: 'RESTRICTED',
    image: 'https://picsum.photos/seed/ufo/400/400?grayscale'
  },
  {
    id: '3',
    title: 'The Lost Typography',
    type: 'DOCUMENT',
    year: '1920',
    description: '14 Rare Specimens of structural decay in the inner-rim urban zones.',
    image: 'https://picsum.photos/seed/type/400/400?grayscale'
  },
  {
    id: '4',
    title: 'Manifesto of the Surrealist Collective',
    type: 'DOCUMENT',
    year: '1924',
    size: '8.4 MB',
    description: 'The original André Breton transcriptions. Scanned and translated for the first time.'
  },
  {
    id: '5',
    title: 'Symphony for a Forgotten City',
    type: 'AUDIO',
    year: '1931',
    size: '42.1 MB',
    description: 'Lost wax cylinder recordings from the ruins of the Central District.'
  },
  {
    id: '6',
    title: 'Telephony Patent Log: Central District',
    type: 'BLUEPRINT',
    year: '1919',
    size: '15.0 MB',
    description: 'Original blueprints for the first automated exchange.'
  }
];

// --- Components ---

const GrainOverlay = () => <div className="film-grain" />;

const TopBar = ({ title, onBack, onMenu, onSearch }: { title: string; onBack?: () => void; onMenu?: () => void; onSearch?: () => void }) => (
  <header className="fixed top-0 w-full flex justify-between items-center px-6 h-16 bg-[#131313]/70 backdrop-blur-xl z-50 border-b border-outline-variant/30">
    <div className="flex items-center gap-4">
      {onBack ? (
        <button onClick={onBack} className="text-white active:scale-90 transition-transform">
          <ArrowLeft size={24} />
        </button>
      ) : (
        <button onClick={onMenu} className="text-white active:scale-90 transition-transform">
          <Menu size={24} />
        </button>
      )}
      <h1 className="font-headline uppercase tracking-tighter text-2xl text-white font-black">
        {title}
      </h1>
    </div>
    <div className="flex items-center gap-4">
      <button onClick={onSearch} className="text-white active:scale-90 transition-transform">
        <Search size={24} />
      </button>
      {onBack && (
        <button className="text-white active:scale-90 transition-transform">
          <MoreVertical size={24} />
        </button>
      )}
    </div>
  </header>
);

const BottomNav = ({ activeView, setView }: { activeView: View; setView: (v: View) => void }) => {
  const navItems: { id: View; label: string; icon: any }[] = [
    { id: 'DOSSIER', label: 'DOSSIER', icon: Grid },
    { id: 'INVESTIGATE', label: 'INVESTIGATE', icon: Search },
    { id: 'VAULT', label: 'VAULT', icon: FolderHeart },
    { id: 'IDENTITY', label: 'IDENTITY', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-stretch h-20 bg-[#131313] z-50 shadow-[0px_-12px_24px_rgba(0,0,0,0.4)] border-t border-outline-variant/10">
      {navItems.map((item) => {
        const isActive = activeView === item.id || (activeView === 'DETAIL' && item.id === 'DOSSIER');
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center justify-center p-3 w-full transition-all duration-200 active:scale-90 ${
              isActive ? 'text-white bg-primary-fixed shadow-[0_0_15px_rgba(169,54,49,0.3)]' : 'text-outline hover:bg-surface-high'
            }`}
          >
            <item.icon size={20} className="mb-1" />
            <span className="font-sans uppercase tracking-[0.2em] text-[10px] font-bold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

// --- Views ---

const DossierFeedView = ({ onSelect, archives, onLoadMore, loading }: { 
  onSelect: (item: ArchiveItem) => void, 
  archives: ArchiveItem[],
  onLoadMore: () => void,
  loading: boolean
}) => {
  const observer = React.useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        onLoadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, onLoadMore]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pt-24 pb-32 px-4 md:px-0 max-w-2xl mx-auto space-y-16"
    >
      <section className="mb-12">
        <h2 className="font-headline text-6xl md:text-8xl font-extralight tracking-tighter leading-none border-l-4 border-primary-fixed pl-6">
          LATEST REVEALS
        </h2>
        <div className="mt-4 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {['FILE: NOIR_CLASSICS', 'COLLECTION: PRE_CODE', 'FORMAT: 35MM'].map(tag => (
            <span key={tag} className="bg-surface-container-highest text-[10px] tracking-[0.2em] uppercase font-bold px-3 py-1 flex-shrink-0">
              {tag}
            </span>
          ))}
        </div>
      </section>

      {archives.map((item, index) => (
        <article 
          key={`${item.id}-${index}`} 
          ref={index === archives.length - 1 ? lastElementRef : null}
          onClick={() => onSelect(item)}
          className="group relative bg-surface-container-low transition-all duration-500 noir-shadow cursor-pointer"
        >
          {item.image && (
            <div className="relative overflow-hidden aspect-video">
              <img 
                src={item.image} 
                alt={item.title}
                className="w-full h-full object-cover grayscale brightness-75 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
              {item.featured && (
                <div className="absolute top-4 left-4 bg-primary-fixed px-3 py-1">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-white">RECOVERED_FILE</span>
                </div>
              )}
            </div>
          )}
          <div className="p-8">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-outline">ARCHIVE NO. {item.fileNo || item.id.substring(0, 6)} // {item.type}</p>
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-outline">{item.year}</span>
            </div>
            <h3 className="font-headline text-4xl mb-4 leading-tight group-hover:text-primary-fixed transition-colors line-clamp-2">
              {item.title}
            </h3>
            <p className="font-body text-on-surface-variant text-sm leading-relaxed max-w-prose mb-8 line-clamp-3">
              {item.description}
            </p>
            <div className="flex justify-between items-center pt-6 border-t border-outline-variant/20">
              <button className="bg-primary-fixed text-white px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-primary-fixed-dim transition-colors">
                OPEN DOSSIER
              </button>
              <div className="flex gap-4 text-outline">
                <Bookmark size={20} className="cursor-pointer hover:text-white" />
                <Share2 size={20} className="cursor-pointer hover:text-white" />
              </div>
            </div>
          </div>
        </article>
      ))}

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary-fixed" size={32} />
        </div>
      )}
    </motion.div>
  );
};

const InvestigateView = ({ onSearch, query, setQuery, results, loading, onSelect, onRandom }: { 
  onSearch: (e: React.FormEvent) => void, 
  query: string, 
  setQuery: (q: string) => void,
  results: ArchiveItem[],
  loading: boolean,
  onSelect: (item: ArchiveItem) => void,
  onRandom: () => void
}) => {
  const [activeTab, setActiveTab] = useState('ARCHIVES');

  const trending = [
    { label: 'UFO SIGHTINGS', query: 'ufo' },
    { label: 'NOIR CINEMA', query: 'noir film' },
    { label: 'LOST CITIES', query: 'ruins' },
    { label: 'CYPHERPUNK', query: 'cryptography' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-24 pb-32 px-6 md:px-24 max-w-7xl mx-auto"
    >
      <section className="mb-6">
        <div className="flex justify-between items-end mb-8">
          <h2 className="font-headline text-5xl md:text-7xl tracking-tighter uppercase">INVESTIGATE</h2>
          <button 
            onClick={onRandom}
            className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-primary-fixed hover:text-white transition-colors uppercase mb-2"
          >
            <Shuffle size={14} />
            Random Inquiry
          </button>
        </div>
        <form onSubmit={onSearch} className="relative group">
          <input 
            className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline focus:border-primary-fixed focus:ring-0 text-xl py-4 font-label uppercase tracking-widest transition-colors duration-300 placeholder:text-outline-variant" 
            placeholder="ENTER SUBJECT OR FILE NO." 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary-fixed">
            <Search size={24} />
          </button>
        </form>
      </section>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary-fixed" size={48} />
        </div>
      ) : (
        <>
          <section className="mb-12 overflow-x-auto whitespace-nowrap -mx-6 px-6 scrollbar-hide border-b border-outline-variant/20">
            <div className="flex gap-8 pb-2">
              {['ARCHIVES', 'DOSSIERS', 'AGENTS', 'VAULTS', '1920S', '1930S', '1940S'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`font-label text-xs tracking-widest uppercase pb-2 transition-all duration-300 ${
                    activeTab === tab ? 'border-b-2 border-primary-fixed text-white' : 'text-outline hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h3 className="font-label text-[10px] tracking-[0.4em] text-outline uppercase mb-6">Trending Inquiries</h3>
            <div className="flex flex-wrap gap-3">
              {trending.map(item => (
                <button 
                  key={item.label}
                  onClick={() => {
                    setQuery(item.query);
                    // Trigger search manually or wait for user to hit enter? 
                    // Let's trigger it.
                    const mockEvent = { preventDefault: () => {} } as React.FormEvent;
                    onSearch(mockEvent);
                  }}
                  className="bg-surface-container-highest hover:bg-primary-fixed hover:text-white transition-all px-4 py-2 text-[10px] font-bold tracking-widest uppercase"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {results.map((item) => (
                <div key={item.id} className="group cursor-pointer" onClick={() => onSelect(item)}>
                  <div className="aspect-[3/4] overflow-hidden bg-surface-container mb-4 relative">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover grayscale brightness-75 group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 text-[8px] font-label tracking-widest uppercase text-white">
                      {item.type}
                    </div>
                  </div>
                  <h4 className="font-headline text-lg group-hover:text-primary-fixed transition-colors line-clamp-1">{item.title}</h4>
                  <p className="font-label text-[9px] tracking-widest text-outline uppercase">{item.year} • {item.creator || 'Unknown'}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="mt-20">
        <h3 className="font-label text-[10px] tracking-[0.4em] text-outline uppercase mb-8 border-b border-outline-variant pb-2">Recent Archives Accessed</h3>
        <div className="divide-y-0 space-y-1">
          {[
            { id: '01', title: 'Manifesto of the Surrealist Collective', meta: 'Document • 1924 • 8.4 MB' },
            { id: '02', title: 'Symphony for a Forgotten City', meta: 'Audio • 1931 • 42.1 MB' },
            { id: '03', title: 'Telephony Patent Log: Central District', meta: 'Blueprint • 1919 • 15.0 MB' }
          ].map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-surface hover:bg-surface-container transition-colors group cursor-pointer">
              <div className="flex items-center gap-6">
                <span className="font-label text-xs text-outline w-8 text-center">{item.id}</span>
                <div>
                  <p className="font-headline text-xl group-hover:text-primary-fixed transition-colors">{item.title}</p>
                  <p className="font-label text-[9px] tracking-widest text-outline-variant uppercase">{item.meta}</p>
                </div>
              </div>
              <ArrowUpRight size={20} className="text-outline-variant group-hover:text-white transition-colors" />
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

const IdentityView = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="pt-24 pb-32 px-6 md:px-24 max-w-7xl mx-auto"
    >
      <section className="flex flex-col md:flex-row items-start md:items-end gap-8 mb-20">
        <div className="relative">
          <div className="w-32 h-32 bg-surface-high overflow-hidden">
            <img src="https://picsum.photos/seed/agent/200/200?grayscale" alt="Agent" className="w-full h-full object-cover grayscale contrast-125" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-primary-fixed text-white p-1 text-[10px] font-bold uppercase tracking-tighter px-2">
            Verified Agent
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <span className="font-label uppercase tracking-[0.3em] text-[10px] text-primary-fixed font-bold">Identity Clearance: Level 4</span>
          <h2 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter uppercase leading-none">Elias Thorne</h2>
          <div className="flex gap-12 pt-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Inquiry Count</span>
              <span className="font-headline text-2xl">1,402</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Active Cases</span>
              <span className="font-headline text-2xl">07</span>
            </div>
          </div>
        </div>
      </section>

      <nav className="flex border-b border-outline-variant/15 mb-12">
        <button className="px-8 py-4 bg-surface-container border-l-2 border-primary-fixed relative">
          <span className="font-label text-xs uppercase tracking-[0.2em] font-bold text-on-surface">The Vault</span>
          <span className="absolute top-2 right-2 text-[8px] text-primary-fixed">64 Items</span>
        </button>
        <button className="px-8 py-4 hover:bg-surface-container transition-colors duration-200">
          <span className="font-label text-xs uppercase tracking-[0.2em] font-bold text-outline">Investigations</span>
        </button>
        <button className="px-8 py-4 hover:bg-surface-container transition-colors duration-200">
          <span className="font-label text-xs uppercase tracking-[0.2em] font-bold text-outline">Signals</span>
        </button>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-outline-variant/15">
        <article className="md:col-span-8 group relative bg-surface-container p-8 min-h-[500px] flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none">
            <img src="https://picsum.photos/seed/glitch/800/600?grayscale" alt="Synthetica" className="w-full h-full object-cover grayscale" />
          </div>
          <div className="relative z-10 flex justify-between items-start">
            <div className="bg-primary-fixed px-3 py-1 text-[10px] font-bold text-white uppercase tracking-widest">Restricted</div>
            <Bookmark size={20} className="text-white fill-current" />
          </div>
          <div className="relative z-10 space-y-4 max-w-md">
            <span className="font-label text-[10px] text-primary-fixed uppercase tracking-widest font-bold">Case #88-B: Neural Network Leak</span>
            <h3 className="font-headline text-4xl font-bold tracking-tight">The 2024 Synthetica Archives</h3>
            <p className="text-on-surface-variant text-sm font-light leading-relaxed">A comprehensive collection of leaked neural pathways and early silicon consciousness frameworks recovered from the decommissioned server farms in Sector 7.</p>
            <div className="pt-4 flex gap-2">
              <span className="bg-surface-container-highest px-3 py-1 text-[9px] uppercase tracking-widest text-on-surface">Data Dump</span>
              <span className="bg-surface-container-highest px-3 py-1 text-[9px] uppercase tracking-widest text-on-surface">Encrypted</span>
            </div>
          </div>
        </article>
        <article className="md:col-span-4 bg-surface-container p-6 flex flex-col justify-between group hover:bg-surface-high transition-colors">
          <div className="h-40 bg-surface-high overflow-hidden mb-6">
            <img src="https://picsum.photos/seed/brutalist/400/300?grayscale" alt="Brutalist" className="w-full h-full object-cover grayscale brightness-50 group-hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="space-y-3">
            <span className="font-label text-[9px] text-outline uppercase tracking-[0.2em] font-bold">File: Arch_901</span>
            <h4 className="font-headline text-xl font-bold leading-tight">Project: Brutalist Echoes</h4>
            <p className="text-xs text-on-surface-variant line-clamp-2">Visual documentation of structural decay in the inner-rim urban zones.</p>
          </div>
          <div className="mt-6 flex justify-between items-center border-t border-outline-variant/10 pt-4">
            <span className="text-[10px] text-outline italic">Updated 2h ago</span>
            <ArrowUpRight size={16} className="text-primary-fixed" />
          </div>
        </article>
      </div>

      <section className="mt-24">
        <h3 className="font-headline text-3xl font-bold mb-8">Mobile Deployment</h3>
        <div className="bg-surface-container p-8 border border-primary-fixed/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Download size={120} />
          </div>
          <div className="relative z-10 space-y-6 max-w-2xl">
            <div className="flex items-center gap-4 text-primary-fixed">
              <Download size={24} />
              <span className="font-label text-xs uppercase tracking-[0.3em] font-bold">APK Build Guide</span>
            </div>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              To transform this digital dossier into a standalone mobile application (APK), follow these operational procedures:
            </p>
            <ol className="space-y-4 text-xs text-outline list-decimal pl-4">
              <li>
                <span className="text-white font-bold">Export Source:</span> Open the <span className="text-primary-fixed">Settings</span> menu in AI Studio and select <span className="text-white">Export to ZIP</span>.
              </li>
              <li>
                <span className="text-white font-bold">Initialize Capacitor:</span> Unzip the files and run <code className="bg-black px-2 py-1 text-primary-fixed">npm install @capacitor/core @capacitor/cli</code> in your terminal.
              </li>
              <li>
                <span className="text-white font-bold">Add Android Platform:</span> Execute <code className="bg-black px-2 py-1 text-primary-fixed">npx cap add android</code> to generate the native project.
              </li>
              <li>
                <span className="text-white font-bold">Build & Sync:</span> Run <code className="bg-black px-2 py-1 text-primary-fixed">npm run build</code> followed by <code className="bg-black px-2 py-1 text-primary-fixed">npx cap sync</code>.
              </li>
              <li>
                <span className="text-white font-bold">Generate APK:</span> Open the <code className="bg-black px-2 py-1 text-primary-fixed">android</code> folder in Android Studio and select <span className="text-white">Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</span>.
              </li>
            </ol>
            <div className="pt-4">
              <button 
                onClick={() => window.open('https://capacitorjs.com/docs/getting-started', '_blank')}
                className="bg-primary-fixed text-white px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-primary-fixed-dim transition-colors"
              >
                View Full Build Guide
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-24">
        <h3 className="font-headline text-3xl font-bold mb-8">Recent Investigations</h3>
        <div className="w-full space-y-px bg-outline-variant/15">
          {[
            { icon: FileText, title: 'Manifesto_Final.txt', type: 'Document', date: '12.04.2024', size: '42.8 KB', status: 'Modified' },
            { icon: ImageIcon, title: 'IMG_0029_REDACTED.png', type: 'Image', date: '11.04.2024', size: '2.4 MB', status: 'Archived' }
          ].map((item, idx) => (
            <div key={idx} className={`grid grid-cols-4 md:grid-cols-6 gap-4 p-6 items-center hover:bg-surface-container transition-colors ${idx % 2 === 0 ? 'bg-surface' : 'bg-surface-container-low'}`}>
              <div className="col-span-2 flex items-center gap-4">
                <item.icon size={20} className="text-outline" />
                <span className="text-sm font-bold uppercase tracking-tight">{item.title}</span>
              </div>
              <div className="hidden md:block col-span-1">
                <span className="bg-surface-container-highest px-2 py-1 text-[8px] uppercase tracking-widest font-bold">{item.type}</span>
              </div>
              <div className="col-span-1 text-right md:text-left">
                <span className="text-xs text-outline tabular-nums">{item.date}</span>
              </div>
              <div className="hidden md:block col-span-1">
                <span className="text-xs text-on-surface-variant">{item.size}</span>
              </div>
              <div className="col-span-1 text-right">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${item.status === 'Modified' ? 'text-primary-fixed' : 'text-outline'}`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

const VaultView = ({ vault, onSelect }: { vault: ArchiveItem[], onSelect: (item: ArchiveItem) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-24 pb-32 px-6 md:px-24 max-w-7xl mx-auto"
    >
      <h2 className="font-headline text-5xl md:text-7xl mb-12 tracking-tighter uppercase">THE VAULT</h2>
      
      {vault.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-outline-variant/30">
          <FolderHeart size={48} className="text-outline-variant mb-4" />
          <p className="font-label text-xs tracking-widest uppercase text-outline">Your vault is empty</p>
          <p className="text-[10px] text-outline-variant mt-2">Save dossiers to access them offline</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vault.map((item) => (
            <div 
              key={item.id} 
              onClick={() => onSelect(item)}
              className="bg-surface-container p-4 border border-outline-variant/10 hover:border-primary-fixed transition-colors cursor-pointer group"
            >
              <div className="aspect-video overflow-hidden mb-4 grayscale group-hover:grayscale-0 transition-all">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <h3 className="font-headline text-xl mb-1 line-clamp-1">{item.title}</h3>
              <p className="font-label text-[9px] tracking-widest text-outline uppercase">{item.year} • {item.type}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const DossierDetailView = ({ item, onBack, onToggleVault, isInVault }: { 
  item: ArchiveItem; 
  onBack: () => void;
  onToggleVault: (item: ArchiveItem) => void;
  isInVault: boolean;
}) => {
  const embedUrl = `https://archive.org/embed/${item.identifier || item.id}`;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-24"
    >
      <section className={`relative w-full ${item.type === 'AUDIO' ? 'aspect-[21/9]' : 'aspect-video'} bg-black overflow-hidden`}>
        {item.type === 'AUDIO' && (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-64 h-64 border-4 border-primary-fixed rounded-full animate-pulse flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-primary-fixed rounded-full animate-ping" />
            </div>
          </div>
        )}
        {item.directUrl ? (
          <div className="w-full h-full flex items-center justify-center bg-black">
            {item.type === 'AUDIO' ? (
              <audio 
                src={item.directUrl} 
                controls 
                className="w-full max-w-md"
              />
            ) : (
              <video 
                src={item.directUrl} 
                controls 
                className="w-full h-full object-contain"
              />
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        )}
      </section>

      <article className="px-6 md:px-24 mt-8 relative z-10">
        <header className="mb-12">
          <h1 className="font-headline italic text-5xl md:text-7xl font-extrabold text-white tracking-tighter leading-none mb-4">
            {item.title}
          </h1>
          <div className="flex flex-wrap gap-4 items-center">
            <span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 text-[10px] font-bold tracking-widest">DOSSIER ACTIVATED</span>
            <span className="text-outline text-xs uppercase tracking-widest">/ Directed by {item.director || 'Howard Hawks'}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 mb-16 border-l border-outline-variant/30">
          <div className="p-6 bg-surface-container-low">
            <p className="text-[10px] font-bold text-outline tracking-widest uppercase mb-2">Release</p>
            <p className="text-white font-medium">{item.releaseDate || 'Aug 31, 1946'}</p>
          </div>
          <div className="p-6 bg-surface-container">
            <p className="text-[10px] font-bold text-outline tracking-widest uppercase mb-2">Runtime</p>
            <p className="text-white font-medium">{item.runtime || '114 Minutes'}</p>
          </div>
          <div className="p-6 bg-surface-container-low">
            <p className="text-[10px] font-bold text-outline tracking-widest uppercase mb-2">Subject</p>
            <p className="text-white font-medium">Philip Marlowe</p>
          </div>
          <div className="p-6 bg-surface-container">
            <p className="text-[10px] font-bold text-outline tracking-widest uppercase mb-2">Status</p>
            <p className="text-primary-fixed font-bold">{item.status || 'CLASSIFIED'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-8">
            <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-outline mb-6">Subject Narrative</h2>
            <div className="space-y-6 text-on-surface/90 leading-relaxed font-body text-lg">
              <p>{item.narrative || item.description}</p>
              <p>As the investigation deepens, Marlowe realizes that the case is far more complex than simple extortion. Every lead disappears into the fog of the Los Angeles underworld, leaving him to navigate a labyrinth of double-crosses where the only thing he can trust is his own survival instinct.</p>
            </div>
          </div>
          <div className="md:col-span-4 space-y-4">
            <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-outline mb-6">Operations</h2>
            <button 
              onClick={() => onToggleVault(item)}
              className={`w-full flex items-center justify-between px-6 py-4 transition-transform active:scale-95 shadow-[0_0_25px_rgba(169,54,49,0.2)] ${
                isInVault ? 'bg-surface-high text-primary-fixed' : 'bg-gradient-to-r from-primary-fixed to-primary-fixed-dim text-white'
              }`}
            >
              <span className="font-bold tracking-widest text-sm uppercase">
                {isInVault ? 'Remove from Vault' : 'Save to Vault'}
              </span>
              <FolderHeart size={20} fill={isInVault ? 'currentColor' : 'none'} />
            </button>
            <button className="w-full bg-surface-high text-white flex items-center justify-between px-6 py-4 hover:bg-surface-container transition-colors">
              <span className="font-bold tracking-widest text-sm uppercase">Share Inquiry</span>
              <Share2 size={20} />
            </button>
            <button 
              onClick={() => window.open(getArchiveItemUrl(item.identifier || item.id), '_blank')}
              className="w-full border-b border-outline-variant/30 text-outline flex items-center justify-between px-6 py-4 hover:text-white transition-colors"
            >
              <span className="font-bold tracking-widest text-sm uppercase">External Link</span>
              <ExternalLink size={16} />
            </button>
          </div>
        </div>

        <div className="mt-20 pt-12 border-t border-outline-variant/20">
          <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-outline mb-8 text-center">Reference Tags</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {Array.from(new Set(item.tags || [])).map(tag => (
              <span key={tag} className="bg-surface-container-highest px-4 py-2 text-[11px] font-bold tracking-tighter text-outline-variant">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </article>
    </motion.div>
  );
};

// --- Intro Component ---

const Intro = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center text-center p-6 overflow-hidden"
    >
      {/* Background grain effect */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="relative z-10 space-y-12"
      >
        <div className="relative px-12 py-8">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute top-0 left-0 h-[1px] bg-primary-fixed"
          />
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-0 right-0 w-[1px] bg-primary-fixed"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-0 right-0 h-[1px] bg-primary-fixed"
          />
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 1.5 }}
            className="absolute bottom-0 left-0 w-[1px] bg-primary-fixed"
          />

          <h1 className="font-headline text-4xl md:text-7xl tracking-[0.25em] uppercase font-extralight leading-tight">
            Welcome to <br />
            <span className="text-primary-fixed">The Archive</span>
          </h1>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2 }}
          className="space-y-2"
        >
          <p className="text-[10px] font-bold tracking-[0.6em] uppercase text-outline">
            A project by
          </p>
          <p className="font-headline text-2xl tracking-[0.1em] uppercase text-white">
            Dean Keaton
          </p>
        </motion.div>
      </motion.div>

      {/* Decorative scanning line */}
      <motion.div
        initial={{ top: "-10%" }}
        animate={{ top: "110%" }}
        transition={{ duration: 3, ease: "linear", repeat: Infinity }}
        className="absolute left-0 right-0 h-[1px] bg-primary-fixed/20 blur-[1px] pointer-events-none z-20"
      />
      
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]" />
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [view, setView] = useState<View>('DOSSIER');
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);
  const [archives, setArchives] = useState<ArchiveItem[]>(ARCHIVES);
  const [vault, setVault] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const toggleVault = (item: ArchiveItem) => {
    setVault(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const fetchArchiveData = useCallback(async (query: string = 'noir film', isSearch: boolean = false, pageNum: number = 1) => {
    if (loading && pageNum > 1) return;
    setLoading(true);
    const results = await searchInternetArchive(query, 12, pageNum);
    
    if (results.length === 0) {
      setHasMore(false);
      setLoading(false);
      return;
    }

    // Deduplicate results within the fetch itself
    const seenIds = new Set();
    const mappedResults: ArchiveItem[] = [];
    
    for (const doc of results) {
      if (!seenIds.has(doc.identifier)) {
        seenIds.add(doc.identifier);
        mappedResults.push({
          id: doc.identifier,
          identifier: doc.identifier,
          title: doc.title || 'Untitled',
          type: (doc.mediatype || 'document').toUpperCase(),
          year: doc.date ? doc.date.substring(0, 4) : 'Unknown',
          description: doc.description || 'No description available.',
          image: getArchiveImageUrl(doc.identifier),
          status: 'DECLASSFIED',
          creator: doc.creator,
          tags: Array.from(new Set(doc.subject || []))
        });
      }
    }
    
    if (isSearch) {
      setArchives(mappedResults);
      setPage(1);
      setHasMore(true);
    } else {
      setArchives(prev => {
        const existingIds = new Set(prev.map(item => item.id));
        const uniqueNewItems = mappedResults.filter(item => !existingIds.has(item.id));
        return [...prev, ...uniqueNewItems];
      });
    }
    setLoading(false);
  }, [loading]);

  useEffect(() => {
    fetchArchiveData();
  }, []); // Initial load only

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchArchiveData(searchQuery || 'noir film', false, nextPage);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchArchiveData(searchQuery, true);
      setView('INVESTIGATE');
    }
  };

  const handleSelectItem = async (item: ArchiveItem) => {
    setSelectedItem(item);
    setView('DETAIL');
    
    // Fetch full metadata to find direct media links if possible
    try {
      const metadata = await getArchiveItemMetadata(item.identifier || item.id);
      if (metadata && metadata.files) {
        // Find the best media file (e.g., mp4 for video, mp3 for audio)
        const files = metadata.files;
        let bestFile = null;
        
        if (item.type === 'MOVIE' || item.type === 'VIDEO') {
          bestFile = files.find((f: any) => f.name.endsWith('.mp4') || f.name.endsWith('.mov'));
        } else if (item.type === 'AUDIO') {
          bestFile = files.find((f: any) => f.name.endsWith('.mp3') || f.name.endsWith('.wav'));
        }
        
        if (bestFile) {
          const directUrl = `https://archive.org/download/${item.identifier || item.id}/${bestFile.name}`;
          setSelectedItem(prev => prev ? { ...prev, directUrl } : null);
        }
      }
    } catch (error) {
      console.error('Error fetching item metadata:', error);
    }
  };

  const handleBack = () => {
    if (view === 'DETAIL') {
      setView('DOSSIER');
      setSelectedItem(null);
    }
  };

  const renderView = () => {
    switch (view) {
      case 'DOSSIER':
        return <DossierFeedView onSelect={handleSelectItem} archives={archives} onLoadMore={loadMore} loading={loading} />;
      case 'INVESTIGATE':
        return (
          <InvestigateView 
            onSearch={handleSearch}
            query={searchQuery}
            setQuery={setSearchQuery}
            results={archives}
            loading={loading}
            onSelect={handleSelectItem}
            onRandom={() => {
              const terms = ['mystery', 'classified', 'secret', 'noir', 'vintage', 'conspiracy', 'ufo', 'lost'];
              const randomTerm = terms[Math.floor(Math.random() * terms.length)];
              setSearchQuery(randomTerm);
              fetchArchiveData(randomTerm, true);
            }}
          />
        );
      case 'VAULT':
        return <VaultView vault={vault} onSelect={handleSelectItem} />;
      case 'IDENTITY':
        return <IdentityView />;
      case 'DETAIL':
        return selectedItem ? (
          <DossierDetailView 
            item={selectedItem} 
            onBack={handleBack} 
            onToggleVault={toggleVault}
            isInVault={!!vault.find(i => i.id === selectedItem.id)}
          />
        ) : null;
      default:
        return <DossierFeedView onSelect={handleSelectItem} archives={archives} onLoadMore={loadMore} loading={loading} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface selection:bg-primary-fixed selection:text-white">
      <AnimatePresence mode="wait">
        {showIntro && (
          <Intro onComplete={() => setShowIntro(false)} />
        )}
      </AnimatePresence>

      <div className={`transition-opacity duration-1000 ${showIntro ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <GrainOverlay />
        <TopBar 
          title={view === 'DETAIL' ? 'THE ARCHIVE' : view} 
          onBack={view === 'DETAIL' ? handleBack : undefined}
          onMenu={() => setIsMenuOpen(true)}
          onSearch={() => setView('INVESTIGATE')}
        />

        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 h-full w-80 bg-[#131313] z-[70] border-r border-outline-variant/20 p-8 flex flex-col"
              >
                <div className="flex justify-between items-center mb-12">
                  <h2 className="font-headline text-2xl font-black tracking-tighter">THE ARCHIVE</h2>
                  <button onClick={() => setIsMenuOpen(false)} className="text-outline hover:text-white">
                    <ArrowLeft size={24} />
                  </button>
                </div>
                <nav className="space-y-6 flex-1">
                  {[
                    { id: 'DOSSIER', label: 'Dossier Feed', icon: Grid },
                    { id: 'INVESTIGATE', label: 'Investigate', icon: Search },
                    { id: 'VAULT', label: 'The Vault', icon: FolderHeart },
                    { id: 'IDENTITY', label: 'Identity', icon: User },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setView(item.id as View);
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center gap-4 w-full p-4 transition-colors ${
                        view === item.id ? 'bg-primary-fixed text-white' : 'text-outline hover:bg-surface-high'
                      }`}
                    >
                      <item.icon size={20} />
                      <span className="font-label text-xs uppercase tracking-widest font-bold">{item.label}</span>
                    </button>
                  ))}
                </nav>
                <div className="pt-8 border-t border-outline-variant/10">
                  <p className="text-[10px] text-outline uppercase tracking-[0.3em] font-bold mb-2">Clearance Level 4</p>
                  <p className="text-[10px] text-outline-variant uppercase tracking-[0.2em]">Agent: Elias Thorne</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        <main>
          <AnimatePresence mode="wait">
            {renderView()}
          </AnimatePresence>
        </main>

        <BottomNav activeView={view} setView={setView} />
        
        {/* Environment Debug Tag */}
        <div className="fixed bottom-24 right-4 z-[100] pointer-events-none">
          <span className="text-[8px] font-mono text-outline-variant uppercase tracking-widest bg-black/40 px-2 py-1">
            Build: 2026.03.24.01 // {window.location.protocol === 'file:' ? 'LOCAL_APK' : 'WEB_ENV'}
          </span>
        </div>
      </div>
    </div>
  );
}
