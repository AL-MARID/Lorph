import React, { useState } from 'react';
import { Loader2, CheckCircle2, Circle, Search, Globe, FileText, BrainCircuit, ChevronDown, ChevronRight } from 'lucide-react';
import { ProgressEvent } from '../types';

interface ProgressWidgetProps {
  events: ProgressEvent[];
}

export const ProgressWidget: React.FC<ProgressWidgetProps> = ({ events }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!events || events.length === 0) return null;

  // Group events by step, keeping only the latest event for each step
  const latestEventsByStep = events.reduce((acc, event) => {
    acc[event.step] = event;
    return acc;
  }, {} as Record<string, ProgressEvent>);

  const displayEvents = Object.values(latestEventsByStep);
  const isAllDone = displayEvents.every(e => e.status === 'done') && displayEvents.length >= 4; // assuming 4 steps

  if (isAllDone && !isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 my-4 p-3 bg-muted/30 border border-border rounded-xl text-foreground text-sm font-medium hover:bg-muted/50 transition-colors w-full text-left animate-fade-in"
      >
        <CheckCircle2 size={18} className="text-emerald-500" />
        <span>Deep Research Completed</span>
        <ChevronRight size={16} className="ml-auto text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 my-4 p-4 bg-secondary/30 border border-border rounded-xl animate-fade-in">
      {isAllDone ? (
        <button 
          onClick={() => setIsExpanded(false)}
          className="flex items-center gap-2 mb-1 pb-3 border-b border-border w-full text-left font-medium hover:opacity-80 transition-opacity text-sm"
        >
          <CheckCircle2 size={18} className="text-emerald-500" />
          <span>Deep Research Completed</span>
          <ChevronDown size={16} className="ml-auto text-muted-foreground" />
        </button>
      ) : (
        <div className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <Loader2 size={16} className="animate-spin text-primary" />
          Deep Research in progress...
        </div>
      )}
      <div className="flex flex-col gap-3">
        {displayEvents.map((event, idx) => (
          <div key={idx} className="flex items-start gap-3 text-sm">
            <div className="mt-0.5 flex-shrink-0">
              {event.status === 'done' ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : event.status === 'active' ? (
                <Loader2 size={16} className="animate-spin text-blue-500" />
              ) : (
                <Circle size={16} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col">
              <span className={`font-medium ${event.status === 'active' ? 'text-foreground' : 'text-muted-foreground'}`}>
                {event.message}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
