import { App as CapacitorApp } from '@capacitor/app';
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
  Download,
  ShieldCheck,
  Zap,
  Cpu,
  Moon,
  LogOut,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useCallback } from 'react';
import { searchInternetArchive, getArchiveImageUrl, getArchiveItemUrl, getArchiveItemMetadata } from './services/archiveService';

// --- Types ---

type View = 'DOSSIER' | 'INVESTIGATE' | 'VAULT' | 'DETAIL';

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

const GlassOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[100]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.05),transparent_70%)]" />
    <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
  </div>
);

const TopBar = ({ title, onBack, onMenu, onSearch }: { title: string; onBack?: () => void; onMenu?: () => void; onSearch?: () => void }) => (
  <header className="fixed top-0 w-full flex justify-between items-center px-8 md:px-12 pt-[env(safe-area-inset-top)] min-h-[5rem] md:min-h-[7rem] glass z-50 border-b border-white/5">
    <div className="flex items-center gap-4 md:gap-12">
      {onBack ? (
        <button onClick={onBack} className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} className="md:w-7 md:h-7" />
        </button>
      ) : (
        <button onClick={onMenu} className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <Menu size={24} className="md:w-7 md:h-7" />
        </button>
      )}
      <h1 className="font-headline text-xl md:text-3xl font-bold tracking-tight neon-text truncate max-w-[50vw]">
        {title}
      </h1>
    </div>
    <div className="flex items-center gap-3 md:gap-6">
      <button onClick={onSearch} className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
        <Search size={24} className="md:w-7 md:h-7" />
      </button>
      <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-gradient-to-tr from-primary to-accent p-[1px]">
        <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
          <img src="https://picsum.photos/seed/user123/100/100" alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      </div>
    </div>
  </header>
);

const BottomNav = ({ activeView, setView }: { activeView: View; setView: (v: View) => void }) => {
  const navItems: { id: View; label: string; icon: any }[] = [
    { id: 'DOSSIER', label: 'Feed', icon: Grid },
    { id: 'INVESTIGATE', label: 'Explore', icon: Search },
    { id: 'VAULT', label: 'Vault', icon: FolderHeart },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom)] z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-md px-8 md:px-12 pb-8 md:pb-16 pointer-events-auto">
        <nav className="glass rounded-2xl md:rounded-[2.5rem] flex justify-around items-center h-16 md:h-24 px-4 md:px-10 shadow-2xl border border-white/10">
          {navItems.map((item) => {
            const isActive = activeView === item.id || (activeView === 'DETAIL' && item.id === 'DOSSIER');
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className="relative flex flex-col items-center justify-center w-full h-full transition-all duration-300"
              >
                <div className={`p-2 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                  <item.icon size={24} className="md:w-8 md:h-8" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute -bottom-1 md:-bottom-3 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary neon-glow"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

// --- Views ---

const DossierFeedView = ({ onSelect, archives, onLoadMore, loading, onStoryClick }: { 
  onSelect: (item: ArchiveItem) => void, 
  archives: ArchiveItem[],
  onLoadMore: () => void,
  loading: boolean,
  onStoryClick: (topic: string) => void
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 md:pt-40 pb-32 md:pb-56 px-4 md:px-8 max-w-full md:max-w-2xl mx-auto space-y-24 md:space-y-56"
    >
      {/* Stories/Highlights */}
      <section className="flex gap-6 md:gap-12 overflow-x-auto pb-6 md:pb-12 scrollbar-hide -mx-4 md:-mx-8 px-4 md:px-8">
        {['UFOs', 'Noir', 'Space', 'Secrets', 'History'].map((story, i) => (
          <button 
            key={story} 
            onClick={() => onStoryClick(story)}
            className="flex flex-col items-center gap-3 md:gap-6 flex-shrink-0 group w-20 md:w-28"
          >
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full p-[2px] md:p-[4px] bg-gradient-to-tr from-primary via-accent to-primary animate-spin-slow group-hover:scale-110 transition-transform">
              <div className="w-full h-full rounded-full bg-background p-1 md:p-2">
                <img 
                  src={`https://picsum.photos/seed/${story}/150/150`} 
                  alt={story} 
                  className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>
            </div>
            <span className="text-[9px] md:text-[11px] font-bold tracking-[0.2em] md:tracking-[0.25em] uppercase opacity-40 group-hover:opacity-100 transition-opacity truncate w-full text-center">{story}</span>
          </button>
        ))}
      </section>

      {archives.map((item, index) => (
        <motion.article 
          key={`${item.id}-${index}`} 
          ref={index === archives.length - 1 ? lastElementRef : null}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onClick={() => onSelect(item)}
          className="glass-card rounded-2xl md:rounded-[2.5rem] overflow-hidden cursor-pointer group w-full"
        >
          <div className="h-1 md:h-1.5 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent" />
          <div className="p-6 md:p-12 flex items-center gap-6 md:gap-12">
            <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-surface-high overflow-hidden border border-white/10 shadow-2xl flex-shrink-0">
              <img src={`https://archive.org/services/img/${item.identifier}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 md:gap-6 mb-1 md:mb-3">
                <h4 className="text-sm md:text-base font-bold tracking-tight text-primary/80 truncate">{item.creator || 'ARCHIVE_CORE'}</h4>
                <span className="classified-tag scale-75 md:scale-100 origin-left">DECLASSFIED</span>
              </div>
              <p className="text-[9px] md:text-[11px] opacity-30 uppercase tracking-[0.2em] md:tracking-[0.35em] font-mono truncate">{item.year} // {item.type}</p>
            </div>
            <button className="text-on-surface-variant/30 hover:text-primary transition-colors p-2 md:p-3">
              <MoreVertical size={20} className="md:w-6 md:h-6" />
            </button>
          </div>

          {item.image && (
            <div className="relative aspect-[4/3] overflow-hidden bg-surface-container w-full">
              <img 
                src={item.image} 
                alt={item.title}
                className="w-full h-auto min-h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>
          )}

          <div className="p-8 md:p-16 space-y-12 md:space-y-24">
            <div className="flex gap-12 md:gap-24">
              <button className="hover:text-primary transition-colors transform hover:scale-110 active:scale-90"><FolderHeart size={24} className="md:w-7 md:h-7" /></button>
              <button className="hover:text-primary transition-colors transform hover:scale-110 active:scale-90"><MessageSquare size={24} className="md:w-7 md:h-7" /></button>
              <button className="hover:text-primary transition-colors transform hover:scale-110 active:scale-90"><Share2 size={24} className="md:w-7 md:h-7" /></button>
              <button className="ml-auto hover:text-primary transition-colors transform hover:scale-110 active:scale-90"><Bookmark size={24} className="md:w-7 md:h-7" /></button>
            </div>
            <div className="space-y-6 md:space-y-12">
              <h3 className="font-bold text-xl md:text-3xl leading-tight group-hover:text-primary transition-colors tracking-tight">
                {item.title}
              </h3>
              <p className="text-sm md:text-lg opacity-60 line-clamp-3 leading-relaxed font-light italic">
                {item.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:gap-6 pt-2 md:pt-6">
              {item.tags?.slice(0, 4).map(tag => (
                <span key={tag} className="text-[9px] md:text-[11px] font-mono text-primary/50 uppercase tracking-[0.15em] md:tracking-[0.25em] bg-primary/5 px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-primary/10">
                  #{tag.replace('#', '')}
                </span>
              ))}
            </div>
          </div>
        </motion.article>
      ))}

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary" size={24} />
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
      exit={{ opacity: 0 }}
      className="pt-24 md:pt-40 pb-32 md:pb-56 px-6 md:px-10 max-w-full md:max-w-lg mx-auto"
    >
      <div className="flex justify-between items-center mb-12 md:mb-24">
        <h2 className="text-2xl md:text-4xl font-bold neon-text tracking-tighter">Explore</h2>
        <button 
          onClick={onRandom}
          className="flex items-center gap-2 md:gap-4 text-[10px] md:text-[12px] font-mono text-primary hover:text-white transition-colors uppercase tracking-[0.2em] md:tracking-[0.25em]"
        >
          <Shuffle size={14} className="md:w-[18px] md:h-[18px]" />
          Randomized Sync
        </button>
      </div>

      <form onSubmit={onSearch} className="relative mb-12 md:mb-20">
        <div className="absolute inset-y-0 left-4 md:left-6 flex items-center pointer-events-none text-primary">
          <Search size={20} className="md:w-7 md:h-7" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the digital void..."
          className="w-full h-14 md:h-20 pl-12 md:pl-16 pr-6 md:pr-8 glass rounded-xl md:rounded-[1.5rem] border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none text-sm md:text-lg"
        />
        <button 
          type="submit"
          className="absolute right-2 top-2 bottom-2 px-4 md:px-8 bg-primary text-background rounded-lg md:rounded-2xl font-bold text-[10px] md:text-sm uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
        >
          Scan
        </button>
      </form>

      <section className="mb-12 md:mb-20">
        <h3 className="text-[10px] md:text-[12px] font-mono text-primary/60 uppercase tracking-[0.3em] md:tracking-[0.5em] mb-4 md:mb-8">Trending Inquiries</h3>
        <div className="flex flex-wrap gap-3 md:gap-6">
          {trending.map(item => (
            <button 
              key={item.label}
              onClick={() => {
                setQuery(item.query);
                const mockEvent = { preventDefault: () => {} } as React.FormEvent;
                onSearch(mockEvent);
              }}
              className="glass px-4 py-2 md:px-6 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-bold tracking-widest uppercase hover:bg-primary hover:text-background transition-all"
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 md:py-40 gap-8 md:gap-12">
          <div className="relative">
            <Loader2 className="animate-spin text-primary md:w-14 md:h-14" size={40} />
            <div className="absolute inset-0 blur-xl md:blur-2xl bg-primary/20 animate-pulse" />
          </div>
          <div className="space-y-4 md:space-y-6 text-center">
            <p className="text-[10px] md:text-[12px] font-mono uppercase tracking-[0.4em] md:tracking-[0.6em] text-primary animate-pulse">Decrypting data streams...</p>
            <p className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] md:tracking-[0.4em] opacity-30">Establishing secure neural handshake</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 md:gap-16">
          {results.map((item) => (
            <motion.div
              key={item.id}
              layoutId={item.id}
              onClick={() => onSelect(item)}
              className="glass-card rounded-xl md:rounded-[2rem] overflow-hidden cursor-pointer group aspect-[3/4] relative bg-surface-container"
            >
              {item.image ? (
                <img 
                  src={item.image} 
                  className="w-full h-auto min-h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700" 
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-surface-high flex items-center justify-center">
                  <FileText size={32} className="md:w-12 md:h-12 opacity-20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-4 md:p-8 flex flex-col justify-end gap-1 md:gap-3">
                <h4 className="text-[10px] md:text-[12px] font-bold leading-tight line-clamp-2 uppercase tracking-wide">{item.title}</h4>
                <p className="text-[8px] md:text-[10px] opacity-50 uppercase tracking-widest">{item.year}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const VaultView = ({ vault, onSelect }: { vault: ArchiveItem[], onSelect: (item: ArchiveItem) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 md:pt-40 pb-32 md:pb-56 px-6 md:px-10 max-w-full md:max-w-lg mx-auto"
    >
      <div className="flex items-center justify-between mb-12 md:mb-20">
        <h2 className="text-2xl md:text-4xl font-bold neon-text tracking-tighter">Your Vault</h2>
        <span className="text-[10px] md:text-[12px] font-mono bg-primary/20 text-primary px-3 md:px-4 py-1 md:py-2 rounded-full tracking-[0.15em] md:tracking-[0.2em]">{vault.length} ITEMS</span>
      </div>

      {vault.length === 0 ? (
        <div className="glass-card rounded-2xl md:rounded-[3rem] p-16 md:p-32 text-center space-y-8 md:space-y-16">
          <div className="w-20 h-20 md:w-32 md:h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto shadow-2xl">
            <FolderHeart size={40} className="md:w-16 md:h-16 opacity-20" />
          </div>
          <p className="text-sm md:text-lg opacity-50 leading-relaxed max-w-xs mx-auto">Your vault is empty. Secure files from the feed to access them offline.</p>
        </div>
      ) : (
        <div className="space-y-8 md:space-y-16">
          {vault.map(item => (
            <div key={item.id} onClick={() => onSelect(item)} className="glass-card rounded-xl md:rounded-[2rem] p-6 md:p-10 flex gap-6 md:gap-12 items-center group cursor-pointer hover:border-primary/30 transition-all transform hover:scale-[1.02]">
              <div className="w-16 h-16 md:w-28 md:h-28 rounded-xl md:rounded-2xl overflow-hidden flex-shrink-0 bg-surface-high shadow-xl">
                <img src={item.image || `https://archive.org/services/img/${item.identifier}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 min-w-0 space-y-1 md:space-y-3">
                <h4 className="font-bold text-base md:text-xl truncate group-hover:text-primary transition-colors">{item.title}</h4>
                <p className="text-[10px] md:text-[12px] opacity-40 uppercase tracking-[0.3em] md:tracking-[0.4em] font-mono truncate">{item.type} // {item.year}</p>
              </div>
              <ChevronRight size={24} className="md:w-8 md:h-8 opacity-20 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-3 transition-all" />
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
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-background z-[60] overflow-y-auto overflow-x-hidden pb-32 md:pb-48"
    >
      <div className="relative aspect-[4/5] md:aspect-video min-h-[300px] md:min-h-[500px] w-full">
        <img 
          src={item.image || `https://archive.org/services/img/${item.identifier}`} 
          className="w-full h-auto min-h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        <button 
          onClick={onBack}
          className="absolute top-[calc(1rem+env(safe-area-inset-top))] left-4 md:left-8 w-10 h-10 md:w-14 md:h-14 glass rounded-full flex items-center justify-center hover:bg-white/20 transition-all z-10"
        >
          <ArrowLeft size={24} className="md:w-7 md:h-7" />
        </button>

        <div className="absolute bottom-6 md:bottom-12 left-6 md:left-10 right-6 md:right-10 space-y-5 md:space-y-10">
          <div className="flex flex-wrap gap-2 md:gap-4">
            <span className="classified-tag !text-background !bg-primary border-none !px-2 md:!px-3 !py-0.5 md:!py-1 scale-90 md:scale-100 origin-left">
              {item.type}
            </span>
            <span className="classified-tag !px-2 md:!px-3 !py-0.5 md:!py-1 scale-90 md:scale-100 origin-left">
              {item.year}
            </span>
            <span className="classified-tag !text-accent !border-accent/30 !px-2 md:!px-3 !py-0.5 md:!py-1 scale-90 md:scale-100 origin-left">
              SECURE_LINK
            </span>
            <span className="classified-tag !text-on-surface-variant/50 !border-white/5 !px-2 md:!px-3 !py-0.5 md:!py-1 scale-90 md:scale-100 origin-left">
              REF: {item.identifier?.substring(0, 8).toUpperCase()}
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight neon-text">
            {item.title}
          </h2>
        </div>
      </div>

      <div className="px-6 md:px-12 py-12 md:py-32 space-y-16 md:space-y-32 max-w-full md:max-w-2xl mx-auto">
        <div className="flex justify-around glass p-6 md:p-12 rounded-2xl md:rounded-[2.5rem] border border-white/10 shadow-2xl">
          <button onClick={() => onToggleVault(item)} className={`flex flex-col items-center gap-5 md:gap-10 ${isInVault ? 'text-primary' : 'opacity-50'} hover:scale-110 active:scale-90 transition-all`}>
            <FolderHeart size={24} className="md:w-9 md:h-9" />
            <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest">Vault</span>
          </button>
          <button className="flex flex-col items-center gap-5 md:gap-10 opacity-50 hover:scale-110 active:scale-90 transition-all">
            <Share2 size={24} className="md:w-9 md:h-9" />
            <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest">Share</span>
          </button>
          <button className="flex flex-col items-center gap-5 md:gap-10 opacity-50 hover:scale-110 active:scale-90 transition-all">
            <Download size={24} className="md:w-9 md:h-9" />
            <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest">Export</span>
          </button>
          <button className="flex flex-col items-center gap-5 md:gap-10 opacity-50 hover:scale-110 active:scale-90 transition-all">
            <Info size={24} className="md:w-9 md:h-9" />
            <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest">Info</span>
          </button>
        </div>

        <div className="space-y-10 md:space-y-20">
          <h4 className="text-[10px] md:text-sm font-bold uppercase tracking-[0.4em] md:tracking-[0.6em] text-primary/60">Intelligence Report</h4>
          <p className="text-base md:text-xl opacity-80 leading-relaxed font-light italic">
            {item.description}
          </p>
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="space-y-10 md:space-y-20">
            <h4 className="text-[10px] md:text-sm font-bold uppercase tracking-[0.4em] md:tracking-[0.6em] text-primary/60">Metadata Tags</h4>
            <div className="flex flex-wrap gap-3 md:gap-6">
              {item.tags.map(tag => (
                <span key={tag} className="glass px-4 md:px-8 py-2 md:py-3 rounded-full text-[10px] md:text-[12px] font-mono opacity-60 border border-white/5">
                  #{tag.replace('#', '')}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card rounded-2xl md:rounded-[3rem] p-8 md:p-16 space-y-12 md:space-y-20">
          <div className="flex items-center gap-10 md:gap-20">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-surface-high overflow-hidden border border-white/10 shadow-2xl flex-shrink-0">
              <img src={`https://archive.org/services/img/${item.identifier}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="space-y-1 md:space-y-3 min-w-0">
              <p className="text-[9px] md:text-[11px] opacity-50 uppercase tracking-widest truncate">Source Entity</p>
              <p className="text-lg md:text-2xl font-bold tracking-tight truncate">{item.creator || 'Unknown Archive'}</p>
            </div>
          </div>
          <a 
            href={`https://archive.org/details/${item.identifier}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-4 md:py-8 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-[1.5rem] text-center text-[10px] md:text-sm font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] transition-all border border-white/5"
          >
            Access Original Records
          </a>
        </div>
      </div>
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
      <GlassOverlay />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="relative z-10 space-y-8"
      >
        <div className="relative p-12">
          <div className="absolute inset-0 border border-primary/20 rounded-3xl" />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute top-0 left-0 h-[2px] bg-primary neon-glow"
          />
          
          <h1 className="font-headline text-5xl md:text-7xl tracking-tighter font-bold neon-text mb-2 animate-pulse">
            ARCHIVE
          </h1>
          <p className="text-[10px] font-mono text-primary uppercase tracking-[0.5em] opacity-50">
            Neural Interface v2.5
          </p>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="flex items-center justify-center gap-4"
        >
          <div className="h-[1px] w-12 bg-white/10" />
          <p className="text-[10px] font-mono uppercase tracking-widest opacity-30">
            Establishing Secure Link
          </p>
          <div className="h-[1px] w-12 bg-white/10" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ top: "-10%" }}
        animate={{ top: "110%" }}
        transition={{ duration: 3, ease: "linear", repeat: Infinity }}
        className="absolute left-0 right-0 h-[1px] bg-primary/10 blur-[2px] pointer-events-none z-20"
      />
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [view, setView] = useState<View>('DOSSIER');
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);
  const [archives, setArchives] = useState<ArchiveItem[]>(ARCHIVES);
  const [vault, setVault] = useState<ArchiveItem[]>(() => {
    const saved = localStorage.getItem('archive_vault');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const setupBackButton = async () => {
      await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (view === 'DETAIL') {
          handleBack();
        } else if (view === 'INVESTIGATE' || view === 'VAULT') {
          setView('DOSSIER');
        } else {
          CapacitorApp.exitApp();
        }
      });
    };
    setupBackButton();
    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, [view]);

  useEffect(() => {
    localStorage.setItem('archive_vault', JSON.stringify(vault));
  }, [vault]);

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
        return <DossierFeedView 
          onSelect={handleSelectItem} 
          archives={archives} 
          onLoadMore={loadMore} 
          loading={loading} 
          onStoryClick={(topic) => {
            setSearchQuery(topic);
            fetchArchiveData(topic, true);
            setView('INVESTIGATE');
          }}
        />;
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
        return <DossierFeedView 
          onSelect={handleSelectItem} 
          archives={archives} 
          onLoadMore={loadMore} 
          loading={loading} 
          onStoryClick={(topic) => {
            setSearchQuery(topic);
            fetchArchiveData(topic, true);
            setView('INVESTIGATE');
          }}
        />;
    }
  };

  return (
    <div className="min-h-full bg-background text-on-surface selection:bg-primary selection:text-background antialiased overflow-x-hidden">
      <AnimatePresence mode="wait">
        {showIntro && (
          <Intro onComplete={() => setShowIntro(false)} />
        )}
      </AnimatePresence>

      <div className={`transition-opacity duration-1000 ${showIntro ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
        <GlassOverlay />
        <TopBar 
          title={view === 'DETAIL' ? 'Archive' : view === 'DOSSIER' ? 'Feed' : view === 'INVESTIGATE' ? 'Explore' : view} 
          onBack={view === 'DETAIL' ? handleBack : undefined}
          onMenu={() => setIsMenuOpen(true)}
          onSearch={() => setView('INVESTIGATE')}
        />

        <main className="relative z-10">
          <AnimatePresence mode="wait">
            {renderView()}
          </AnimatePresence>
        </main>

        <BottomNav activeView={view} setView={setView} />

        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 h-full w-[280px] max-w-[85vw] glass z-[70] border-r border-white/10 p-8 flex flex-col"
              >
                <div className="flex justify-between items-center mb-12">
                  <h2 className="font-headline text-2xl font-bold neon-text">ARCHIVE</h2>
                  <button onClick={() => setIsMenuOpen(false)} className="text-on-surface-variant hover:text-white">
                    <ArrowLeft size={24} />
                  </button>
                </div>
                <nav className="space-y-6 flex-1">
                  {[
                    { id: 'DOSSIER', label: 'Feed', icon: Grid },
                    { id: 'INVESTIGATE', label: 'Explore', icon: Search },
                    { id: 'VAULT', label: 'Vault', icon: FolderHeart },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setView(item.id as View);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                        view === item.id ? 'bg-primary text-background' : 'hover:bg-white/5'
                      }`}
                    >
                      <item.icon size={20} />
                      <span className="font-bold text-sm tracking-tight">{item.label}</span>
                    </button>
                  ))}
                </nav>
                <div className="pt-8 border-t border-white/5">
                  <p className="text-[10px] font-mono opacity-30 uppercase tracking-widest">System Version 2.5.0</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
