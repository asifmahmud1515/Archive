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

const GlassOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[100]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.05),transparent_70%)]" />
    <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
  </div>
);

const TopBar = ({ title, onBack, onMenu, onSearch }: { title: string; onBack?: () => void; onMenu?: () => void; onSearch?: () => void }) => (
  <header className="fixed top-0 w-full flex justify-between items-center px-6 h-20 glass z-50 border-b border-white/5">
    <div className="flex items-center gap-4">
      {onBack ? (
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={20} />
        </button>
      ) : (
        <button onClick={onMenu} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <Menu size={20} />
        </button>
      )}
      <h1 className="font-headline text-xl font-bold tracking-tight neon-text">
        {title}
      </h1>
    </div>
    <div className="flex items-center gap-2">
      <button onClick={onSearch} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
        <Search size={20} />
      </button>
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent p-[1px]">
        <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
          <img src="https://picsum.photos/seed/user123/100/100" alt="Profile" className="w-full h-full object-cover" />
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
    { id: 'IDENTITY', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
      <nav className="glass rounded-3xl flex justify-around items-center h-16 px-2 shadow-2xl border border-white/10">
        {navItems.map((item) => {
          const isActive = activeView === item.id || (activeView === 'DETAIL' && item.id === 'DOSSIER');
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className="relative flex flex-col items-center justify-center w-full h-full transition-all duration-300"
            >
              <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              {isActive && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary neon-glow"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 pb-32 px-4 max-w-lg mx-auto space-y-8"
    >
      {/* Stories/Highlights */}
      <section className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {['UFOs', 'Noir', 'Space', 'Secrets', 'History'].map((story, i) => (
          <div key={story} className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-primary via-accent to-primary animate-spin-slow">
              <div className="w-full h-full rounded-full bg-background p-1">
                <img 
                  src={`https://picsum.photos/seed/${story}/100/100`} 
                  alt={story} 
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <span className="text-[10px] font-medium tracking-wide uppercase opacity-70">{story}</span>
          </div>
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
          className="glass-card rounded-3xl overflow-hidden cursor-pointer group"
        >
          <div className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-high overflow-hidden">
              <img src={`https://archive.org/services/img/${item.identifier}`} className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-tight">{item.creator || 'ARCHIVE_CORE'}</h4>
              <p className="text-[9px] opacity-50 uppercase tracking-widest">{item.year} // {item.type}</p>
            </div>
            <button className="ml-auto text-on-surface-variant">
              <MoreVertical size={16} />
            </button>
          </div>

          {item.image && (
            <div className="relative aspect-square overflow-hidden">
              <img 
                src={item.image} 
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}

          <div className="p-5 space-y-3">
            <div className="flex gap-4">
              <button className="hover:text-primary transition-colors"><FolderHeart size={22} /></button>
              <button className="hover:text-primary transition-colors"><MessageSquare size={22} /></button>
              <button className="hover:text-primary transition-colors"><Share2 size={22} /></button>
              <button className="ml-auto hover:text-primary transition-colors"><Bookmark size={22} /></button>
            </div>
            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <p className="text-sm opacity-70 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {item.tags?.slice(0, 3).map(tag => (
                <span key={tag} className="text-[9px] font-mono text-primary/60 uppercase tracking-widest">
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
      className="pt-24 pb-32 px-6 max-w-lg mx-auto"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold neon-text">Explore</h2>
        <button 
          onClick={onRandom}
          className="flex items-center gap-2 text-[10px] font-mono text-primary hover:text-white transition-colors uppercase"
        >
          <Shuffle size={14} />
          Randomized Sync
        </button>
      </div>

      <form onSubmit={onSearch} className="relative mb-8">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-primary">
          <Search size={20} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the digital void..."
          className="w-full h-14 pl-12 pr-4 glass rounded-2xl border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none text-sm"
        />
        <button 
          type="submit"
          className="absolute right-2 top-2 bottom-2 px-4 bg-primary text-background rounded-xl font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
        >
          Scan
        </button>
      </form>

      <section className="mb-8">
        <h3 className="text-[10px] font-mono text-primary/60 uppercase tracking-[0.3em] mb-4">Trending Inquiries</h3>
        <div className="flex flex-wrap gap-2">
          {trending.map(item => (
            <button 
              key={item.label}
              onClick={() => {
                setQuery(item.query);
                const mockEvent = { preventDefault: () => {} } as React.FormEvent;
                onSearch(mockEvent);
              }}
              className="glass px-3 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase hover:bg-primary hover:text-background transition-all"
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] animate-pulse">Decrypting data streams...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {results.map((item) => (
            <motion.div
              key={item.id}
              layoutId={item.id}
              onClick={() => onSelect(item)}
              className="glass-card rounded-2xl overflow-hidden cursor-pointer group aspect-[3/4] relative"
            >
              {item.image ? (
                <img src={item.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-surface-high flex items-center justify-center">
                  <FileText size={32} className="opacity-20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
                <h4 className="text-[10px] font-bold leading-tight line-clamp-2">{item.title}</h4>
                <p className="text-[8px] opacity-50 uppercase mt-1">{item.year}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const IdentityView = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="pt-24 pb-32 px-6 max-w-lg mx-auto space-y-8"
  >
    <div className="glass-card rounded-[2.5rem] p-8 text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
      <div className="relative z-10">
        <div className="w-24 h-24 rounded-full mx-auto p-1 bg-gradient-to-tr from-primary to-accent mb-4">
          <div className="w-full h-full rounded-full bg-background p-1">
            <img src="https://picsum.photos/seed/user123/200/200" className="w-full h-full rounded-full object-cover" />
          </div>
        </div>
        <h2 className="text-xl font-bold tracking-tight">Agent_1515</h2>
        <p className="text-[10px] font-mono text-primary uppercase tracking-[0.3em] mt-1">Level 4 Investigator</p>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-4">
      {[
        { label: 'Files', value: '124', icon: FileText },
        { label: 'Rank', value: '#12', icon: ShieldCheck },
        { label: 'XP', value: '8.2k', icon: Zap },
      ].map(stat => (
        <div key={stat.label} className="glass-card rounded-2xl p-4 text-center space-y-1">
          <stat.icon size={16} className="mx-auto text-primary mb-1" />
          <div className="text-lg font-bold">{stat.value}</div>
          <div className="text-[9px] opacity-50 uppercase tracking-widest">{stat.label}</div>
        </div>
      ))}
    </div>

    <div className="glass-card rounded-3xl overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-white/5">
        <h3 className="text-xs font-bold uppercase tracking-widest">System Settings</h3>
      </div>
      <div className="divide-y divide-white/5">
        {[
          { label: 'Neural Interface', icon: Cpu, value: 'Active' },
          { label: 'Dark Mode', icon: Moon, value: 'Enabled' },
          { label: 'Data Encryption', icon: Lock, value: 'AES-256' },
          { label: 'Logout', icon: LogOut, value: '', danger: true },
        ].map(item => (
          <button key={item.label} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
            <div className="flex items-center gap-3">
              <item.icon size={18} className={item.danger ? 'text-red-500' : 'text-primary'} />
              <span className={`text-sm ${item.danger ? 'text-red-500' : 'opacity-80'}`}>{item.label}</span>
            </div>
            <span className="text-[10px] font-mono opacity-40 group-hover:opacity-100 transition-opacity">{item.value}</span>
          </button>
        ))}
      </div>
    </div>
  </motion.div>
);

const VaultView = ({ vault, onSelect }: { vault: ArchiveItem[], onSelect: (item: ArchiveItem) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 pb-32 px-6 max-w-lg mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold neon-text">Your Vault</h2>
        <span className="text-[10px] font-mono bg-primary/20 text-primary px-2 py-1 rounded-full">{vault.length} ITEMS</span>
      </div>

      {vault.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
            <FolderHeart size={32} className="opacity-20" />
          </div>
          <p className="text-sm opacity-50 leading-relaxed">Your vault is empty. Secure files from the feed to access them offline.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {vault.map(item => (
            <div key={item.id} onClick={() => onSelect(item)} className="glass-card rounded-2xl p-4 flex gap-4 items-center group cursor-pointer hover:border-primary/30 transition-colors">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-high">
                <img src={item.image || `https://archive.org/services/img/${item.identifier}`} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate">{item.title}</h4>
                <p className="text-[10px] opacity-50 uppercase tracking-widest mt-1">{item.type} // {item.year}</p>
              </div>
              <ChevronRight size={20} className="opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all" />
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
      className="fixed inset-0 bg-background z-[60] overflow-y-auto pb-32"
    >
      <div className="relative h-[60vh]">
        <img 
          src={item.image || `https://archive.org/services/img/${item.identifier}`} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        <button 
          onClick={onBack}
          className="absolute top-12 left-6 w-12 h-12 glass rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="absolute bottom-8 left-8 right-8 space-y-4">
          <div className="flex gap-2">
            <span className="bg-primary text-background text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
              {item.type}
            </span>
            <span className="glass text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
              {item.year}
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight leading-tight neon-text">
            {item.title}
          </h2>
        </div>
      </div>

      <div className="px-8 py-8 space-y-8 max-w-2xl mx-auto">
        <div className="flex justify-around glass p-4 rounded-2xl border border-white/10">
          <button onClick={() => onToggleVault(item)} className={`flex flex-col items-center gap-1 ${isInVault ? 'text-primary' : 'opacity-50'}`}>
            <FolderHeart size={24} />
            <span className="text-[9px] font-bold uppercase">Vault</span>
          </button>
          <button className="flex flex-col items-center gap-1 opacity-50">
            <Share2 size={24} />
            <span className="text-[9px] font-bold uppercase">Share</span>
          </button>
          <button className="flex flex-col items-center gap-1 opacity-50">
            <Download size={24} />
            <span className="text-[9px] font-bold uppercase">Export</span>
          </button>
          <button className="flex flex-col items-center gap-1 opacity-50">
            <Info size={24} />
            <span className="text-[9px] font-bold uppercase">Info</span>
          </button>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Intelligence Report</h4>
          <p className="text-base opacity-80 leading-relaxed font-light">
            {item.description}
          </p>
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Metadata Tags</h4>
            <div className="flex flex-wrap gap-2">
              {item.tags.map(tag => (
                <span key={tag} className="glass px-3 py-1 rounded-full text-[10px] font-mono opacity-60">
                  #{tag.replace('#', '')}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-high overflow-hidden">
              <img src={`https://archive.org/services/img/${item.identifier}`} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[10px] opacity-50 uppercase tracking-widest">Source Entity</p>
              <p className="text-sm font-bold">{item.creator || 'Unknown Archive'}</p>
            </div>
          </div>
          <a 
            href={`https://archive.org/details/${item.identifier}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-center text-xs font-bold uppercase tracking-widest transition-all border border-white/5"
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
          
          <h1 className="font-headline text-5xl md:text-7xl tracking-tighter font-bold neon-text mb-2">
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
    <div className="min-h-screen bg-background text-on-surface selection:bg-primary selection:text-background antialiased">
      <AnimatePresence mode="wait">
        {showIntro && (
          <Intro onComplete={() => setShowIntro(false)} />
        )}
      </AnimatePresence>

      <div className={`transition-opacity duration-1000 ${showIntro ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
                className="fixed top-0 left-0 h-full w-80 glass z-[70] border-r border-white/10 p-8 flex flex-col"
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
                    { id: 'IDENTITY', label: 'Profile', icon: User },
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
