import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Globe, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp, Lightbulb, Telescope, FileText } from 'lucide-react';
import { ResearchStep, SearchResult } from '../types';

interface ResearchTimelineProps {
  steps: ResearchStep[];
  sources: SearchResult[];
  isSearching: boolean;
}

export const ResearchTimeline: React.FC<ResearchTimelineProps> = ({ steps, sources, isSearching }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'process' | 'sources'>('process');
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  // Auto-expand the currently active step and collapse others
  useEffect(() => {
    const activeStep = steps.find(s => s.status === 'active');
    if (activeStep) {
      setExpandedSteps(prev => {
        const newState = { ...prev };
        // Collapse all thinking/searching/reading steps that are done
        steps.forEach(s => {
            if (s.id !== activeStep.id && s.status === 'done') {
                newState[s.id] = false;
            }
        });
        newState[activeStep.id] = true;
        return newState;
      });
    }
  }, [steps]);

  const toggleStep = (id: string) => {
    setExpandedSteps(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getFaviconUrl = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

  if (steps.length === 0) return null;

  return (
    <div className="my-4 border border-border/50 rounded-2xl bg-[#0a0a0a] overflow-hidden shadow-lg text-gray-300 font-sans">
      {/* Header */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Telescope size={18} className={isSearching ? "text-[#e8c39e] animate-pulse" : "text-gray-400"} />
          <span className="font-semibold text-white">
            {isSearching ? 'Researching...' : 'Research Complete'}
          </span>
          <div className="flex items-center gap-2 ml-2">
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-gray-400">
              {steps.length} steps
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-gray-400">
              {sources.length} sources
            </span>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-border/50"
          >
            {/* Tabs */}
            <div className="flex items-center p-2 gap-2 bg-[#111]">
              <button 
                onClick={() => setActiveTab('process')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'process' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Telescope size={16} />
                Research Process <span className="text-xs opacity-50">{steps.length}</span>
              </button>
              <button 
                onClick={() => setActiveTab('sources')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'sources' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Globe size={16} />
                Sources <span className="text-xs opacity-50">{sources.length}</span>
              </button>
            </div>

            <div className="p-4 max-h-[500px] overflow-y-auto custom-scrollbar bg-[#0a0a0a]">
              {activeTab === 'process' && (
                <div className="relative pl-2">
                  {/* Vertical Line */}
                  <div className="absolute left-[27px] top-6 bottom-6 w-[2px] bg-white/10 rounded-full" />
                  
                  <div className="flex flex-col gap-1">
                    {steps.map((step, idx) => {
                      const isStepExpanded = expandedSteps[step.id];
                      
                      let Icon = Lightbulb;
                      if (step.type === 'searching') Icon = Search;
                      if (step.type === 'reading') Icon = Globe;
                      if (step.type === 'done') Icon = CheckCircle2;

                      return (
                        <div key={step.id} className="relative z-10">
                          <button 
                            onClick={() => toggleStep(step.id)}
                            className="w-full flex items-center gap-4 py-2.5 hover:bg-white/5 rounded-lg px-2 transition-colors group"
                          >
                            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-[#0a0a0a] relative z-10">
                              {step.status === 'active' ? (
                                <Loader2 size={18} className="animate-spin text-[#e8c39e]" />
                              ) : step.status === 'done' ? (
                                <CheckCircle2 size={18} className="text-green-500 bg-[#0a0a0a] rounded-full" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-gray-600" />
                              )}
                            </div>
                            <Icon size={16} className={step.status === 'active' ? 'text-[#e8c39e]' : 'text-gray-400'} />
                            <span className={`flex-1 text-left text-sm ${step.status === 'active' ? 'text-white font-medium' : 'text-gray-300'}`}>
                              {step.title}
                            </span>
                            
                            {/* Meta info on the right */}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {step.type === 'searching' && step.queries && (
                                <span className="bg-white/5 px-2 py-1 rounded-md">{step.queries.length} queries</span>
                              )}
                              {step.type === 'reading' && step.results && (
                                <span className="bg-white/5 px-2 py-1 rounded-md">{step.results.length} pages</span>
                              )}
                              {isStepExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                          </button>

                          <AnimatePresence>
                            {isStepExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden ml-10 mr-2 mb-2"
                              >
                                {/* Thinking Content */}
                                {step.type === 'thinking' && step.content && (
                                  <div className="p-3 bg-transparent rounded-xl text-sm text-gray-500 leading-relaxed border-l-2 border-gray-800 pl-4 italic">
                                    {step.content}
                                  </div>
                                )}

                                {/* Searching Content */}
                                {step.type === 'searching' && (
                                  <div className="flex flex-col gap-3 mt-2 border-l-2 border-gray-800 pl-4">
                                    {/* Queries */}
                                    {step.queries && step.queries.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {step.queries.map((q, i) => (
                                          <div key={i} className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full text-xs text-gray-400 border border-white/5">
                                            <Search size={12} className="text-gray-500" />
                                            {q}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Reading Content */}
                                {step.type === 'reading' && step.results && (
                                  <div className="flex flex-col gap-1 bg-transparent rounded-xl p-2 border-l-2 border-gray-800 mt-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                    {step.results.map((r, i) => (
                                      <a key={i} href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group/link">
                                        <img src={getFaviconUrl(r.domain)} alt="" className="w-4 h-4 rounded-sm" />
                                        <span className="flex-1 text-sm text-gray-400 truncate group-hover/link:text-blue-400 transition-colors">{r.title}</span>
                                        <span className="text-xs text-gray-600 truncate max-w-[120px]">{r.domain}</span>
                                      </a>
                                    ))}
                                  </div>
                                )}

                                {/* Done Content */}
                                {step.type === 'done' && step.content && (
                                  <div className="p-3 bg-transparent rounded-xl text-sm text-gray-500 leading-relaxed border-l-2 border-gray-800 pl-4 mt-2">
                                    {step.content}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'sources' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...sources].sort((a, b) => {
                    const order = { image: 0, video: 1, web: 2 };
                    return (order[a.type || 'web'] || 2) - (order[b.type || 'web'] || 2);
                  }).map((source, idx) => (
                    <a key={idx} href={source.link} target="_blank" rel="noreferrer" className="flex flex-col gap-2 p-3 bg-[#111111] hover:bg-[#1a1a1a] rounded-2xl border border-white/5 transition-colors group">
                      {source.imageUrl ? (
                        <div className="relative w-full h-32 rounded-xl overflow-hidden bg-black/50">
                          <img src={source.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          {source.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                                <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent ml-1" />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-32 rounded-xl bg-black/20 flex items-center justify-center border border-white/5">
                           <img src={getFaviconUrl(source.source)} alt="" className="w-12 h-12 rounded-md opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0 mt-1">
                        <div className="flex items-center gap-2 mb-1.5">
                            <img src={getFaviconUrl(source.source)} alt="" className="w-4 h-4 rounded-sm" />
                            <span className="text-xs text-gray-400 truncate">{source.source}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-200 line-clamp-2 group-hover:text-blue-400 transition-colors leading-snug">{source.title}</span>
                        {source.snippet && (
                            <span className="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">{source.snippet}</span>
                        )}
                      </div>
                    </a>
                  ))}
                  {sources.length === 0 && (
                    <div className="col-span-full text-center text-sm text-gray-500 py-8">No sources found yet.</div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
