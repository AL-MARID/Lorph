import React, { useState } from 'react';
import { SearchResult } from '../types';
import { PlayCircle, FileText, Check, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface SearchWidgetProps {
  results?: SearchResult[];
  isLoading?: boolean;
  query?: string;
}

export const SearchWidget: React.FC<SearchWidgetProps> = ({ results, isLoading, query }) => {
  const [expanded, setExpanded] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(true);

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="w-full max-w-3xl my-6 animate-pulse">
         <div className="h-14 w-full bg-white/5 rounded-2xl mb-4 border border-white/5" />
         <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="aspect-video bg-white/5 rounded-lg border border-white/5" />
            <div className="aspect-video bg-white/5 rounded-lg border border-white/5" />
         </div>
      </div>
    );
  }

  if (!results || results.length === 0) return null;

  const visuals = results.filter(r => r.type === 'video' || r.type === 'image' || r.imageUrl);
  const visualGrid = visuals.slice(0, 4);
  const textResults = results.filter(r => !visualGrid.includes(r));
  
  // Show 3 items initially so the 4th spot is taken by "View More" in a 2x2 grid
  const initialCount = 3;
  
  const visibleTextCount = expanded ? textResults.length : initialCount;
  const displayText = textResults.slice(0, visibleTextCount);
  const hiddenCount = textResults.length - initialCount;

  // Get unique sources for the header icons (Top 3)
  const uniqueSources = Array.from(new Set(results.map(r => r.source))).slice(0, 3);

  return (
    <div className="my-6 w-full max-w-3xl font-sans select-none">
      
      {/* 1. Header Bar - Transparent, No button background by default */}
      <div 
        className="w-full flex items-center justify-between p-2 pl-1 border border-white/10 rounded-2xl mb-3 bg-transparent hover:bg-white/5 transition-colors cursor-pointer group"
        onClick={() => setIsWidgetOpen(!isWidgetOpen)}
      >
        
        {/* Left: Icon + Text */}
        <div className="flex items-center gap-3 overflow-hidden flex-1 pl-2">
          <Search size={18} className="text-zinc-500 flex-shrink-0" />
          <span className="text-[15px] text-zinc-200 font-normal truncate">{query}</span>
        </div>
        
        {/* Right: Stats + Icons + Toggle */}
        <div className="flex items-center gap-3 flex-shrink-0 pr-1">
             
             {/* Results Count */}
             <div className="flex items-center gap-1.5 text-xs font-medium shrink-0">
                <Check size={14} className="text-[#4ade80]" strokeWidth={3} />
                <span className="text-zinc-400 whitespace-nowrap">{results.length} results</span>
             </div>

             {/* Favicon Stack */}
             <div className="flex items-center -space-x-2 mr-1 shrink-0">
                {uniqueSources.map((source, idx) => (
                    <div key={idx} className="w-6 h-6 rounded-full bg-[#18181b] border border-[#27272a] flex items-center justify-center overflow-hidden relative z-[10] shadow-sm">
                        <img 
                            src={`https://www.google.com/s2/favicons?domain=${source}&sz=32`}
                            alt=""
                            className="w-3.5 h-3.5 opacity-90"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    </div>
                ))}
             </div>

             {/* Toggle Chevron - Transparent by default, Box on Hover */}
             <div className="h-8 w-8 flex items-center justify-center text-zinc-500 group-hover:text-zinc-300 transition-colors rounded-lg group-hover:bg-white/5">
                 {isWidgetOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
             </div>
        </div>
      </div>

      {isWidgetOpen && (
        <div className="animate-fade-in space-y-4 px-0.5">
          
          {/* 2. Visuals Grid (2x2) */}
          {visualGrid.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {visualGrid.map((item, idx) => (
                <a
                  key={`vis-${idx}`}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-video bg-[#18181b] rounded-xl overflow-hidden border border-[#27272a] hover:border-zinc-600 transition-all"
                >
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#18181b]">
                       <PlayCircle size={32} className="text-zinc-600 group-hover:text-zinc-400 transition-colors mb-2" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                     <p className="text-[11px] font-medium text-zinc-200 line-clamp-1 group-hover:text-white">
                        {item.title}
                     </p>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* 3. Sources Header Pill */}
          <div className="flex items-center mt-3 mb-2">
             <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#27272a] rounded-full text-zinc-300">
                 <FileText size={14} className="text-zinc-400" />
                 <span className="text-xs font-medium">Sources</span>
             </div>
          </div>

          {/* 4. Sources Grid */}
          <div className="grid grid-cols-2 gap-2">
            {displayText.map((item, i) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col justify-between p-3 rounded-xl bg-[#09090b] border border-[#27272a] hover:bg-[#18181b] hover:border-zinc-600 transition-all group min-h-[90px]"
              >
                <h4 className="text-[13px] font-medium text-zinc-300 leading-snug line-clamp-2 mb-2 group-hover:text-white">
                  {item.title}
                </h4>

                <div className="flex items-center gap-2 mt-auto">
                   <div className="w-4 h-4 rounded-full bg-[#27272a] flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img 
                        src={`https://www.google.com/s2/favicons?domain=${item.source}&sz=32`} 
                        alt=""
                        className="w-3 h-3 opacity-70 group-hover:opacity-100"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                   </div>
                   <span className="text-[11px] font-medium text-zinc-500 group-hover:text-zinc-400 truncate">
                     {item.source}
                   </span>
                </div>
              </a>
            ))}
            
            {!expanded && hiddenCount > 0 && (
                <button
                    onClick={() => setExpanded(true)}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#09090b] border border-[#27272a] hover:bg-[#18181b] hover:border-zinc-600 transition-all group min-h-[90px]"
                >
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-semibold text-zinc-300 group-hover:text-white">View {hiddenCount} more</span>
                        <ChevronDown size={16} className="text-zinc-500 group-hover:text-zinc-400" />
                    </div>
                </button>
            )}
            
            {expanded && (
                <button
                    onClick={() => setExpanded(false)}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#09090b] border border-[#27272a] hover:bg-[#18181b] hover:border-zinc-600 transition-all group min-h-[90px]"
                >
                    <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-200">
                        <ChevronUp size={16} />
                        <span className="text-xs font-medium">Show Less</span>
                    </div>
                </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
