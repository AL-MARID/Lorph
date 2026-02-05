import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowUp,
  PanelLeftOpen, 
  RotateCcw, 
  Copy, 
  Check, 
  Pencil, 
  ChevronUp, 
  User,
  X,
  Paperclip,
  Square,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Loader2,
  Repeat2,
  ArrowRight
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Logo } from './components/Logo';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { SearchWidget } from './components/SearchWidget';
import { GuestMenu, Theme } from './components/GuestMenu';
import { Spinner } from './components/Spinner';
import { streamChatResponse } from './services/api';
import { processFile } from './services/fileProcessor';
import { searchTheWeb } from './services/search';
import { Message, SearchResult } from './types';
import { AVAILABLE_MODELS, DEFAULT_MODEL, API_CONFIG } from './constants';

const App = () => {
  // App State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  
  // Attachments State
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  
  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');

  // Copy Feedback State
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Theme Logic
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Derived State
  const hasMessages = messages.length > 0;

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isProcessingFiles]);

  // Handle outside click for model menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
        return;
    }
    textareaRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    textareaRef.current?.focus();
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  // STRICT SEARCH INTENT
  const detectSearchIntent = (text: string): boolean => {
    const lowerText = text.toLowerCase().trim();
    const greetings = [
        'hi', 'hello', 'hey', 'yo', 
        'good morning', 'good evening', 'good afternoon', 
        'how are you', 'how r u', 'sup', 
        'سلام', 'السلام عليكم', 'مرحبا', 'أهلا', 'اهلين', 'هلا', 
        'صباح الخير', 'مساء الخير', 'كيف الحال', 'شلونك',
        'thanks', 'thank you', 'ok', 'okay', 'cool', 'شكرا', 'طيب', 'تمام', 'حلو', 'ماشي'
    ];
    if (greetings.includes(lowerText)) return false;
    if (lowerText.split(' ').length < 2 && lowerText.length < 4) return false;
    return true;
  };

  const handleSendMessage = async (textOverride?: string) => {
    if (isLoading || isProcessingFiles) {
      stopGeneration();
      return;
    }

    const textInput = textOverride || input;
    if ((!textInput.trim() && attachedFiles.length === 0)) return;

    let finalUserContent = textInput;
    let fileContentsForDisplay = "";

    // 1. Process Files
    if (attachedFiles.length > 0) {
        setIsProcessingFiles(true);
        try {
            const processedContents = await Promise.all(
                attachedFiles.map(async (file) => {
                    return await processFile(file);
                })
            );
            fileContentsForDisplay = processedContents.join('\n\n');
            finalUserContent = `${textInput}\n\n${fileContentsForDisplay}`.trim();
        } catch (error) {
            console.error("Error processing files", error);
            finalUserContent = `${textInput}\n\n[System: Error reading files]`.trim();
        } finally {
            setIsProcessingFiles(false);
        }
    }

    // 2. User Message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: finalUserContent,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setAttachedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // 3. Assistant Placeholder
    const aiMessageId = (Date.now() + 1).toString();
    const shouldSearch = detectSearchIntent(textInput) && attachedFiles.length === 0;

    const aiMessagePlaceholder: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: '', 
        timestamp: Date.now(),
        model: selectedModel,
        isSearching: shouldSearch,
        searchResults: []
    };
    
    setMessages(prev => [...prev, aiMessagePlaceholder]);
    setIsLoading(true);

    // 4. Logic & Context
    let prompt = finalUserContent;
    let searchResults: SearchResult[] = [];
    
    const isArabic = /[\u0600-\u06FF]/.test(textInput);
    const langInstruction = isArabic 
        ? "CRITICAL: The user is speaking Arabic. You MUST reply in Arabic (العربية)." 
        : "Reply in the same language as the user.";

    if (shouldSearch) {
        try {
            searchResults = await searchTheWeb(textInput);
            
            setMessages(prev => prev.map(m => {
                if (m.id === aiMessageId) {
                    return { 
                        ...m, 
                        isSearching: false, 
                        searchResults: searchResults 
                    };
                }
                return m;
            }));

            if (searchResults.length > 0) {
                const context = searchResults.map(r => 
                    `[Title: ${r.title}] [Link: ${r.link}] [Snippet: ${r.snippet}]`
                ).join('\n\n');
                
                prompt = `
SYSTEM INSTRUCTION: 
${langInstruction}
You are Lorph, a helpful and smart AI assistant.
I have performed a web search for the user's query.

WEB SEARCH RESULTS:
${context}

USER QUERY: 
"${textInput}"

INSTRUCTIONS:
1. Answer the user's query comprehensively using the information from the "WEB SEARCH RESULTS".
2. If the search results contain the answer, cite the sources implicitly (e.g., "According to Wikipedia..." or "Various sources suggest...").
3. If the search results are irrelevant, use your own knowledge but mention that search results were limited.
4. Keep the tone professional, helpful, and direct.
`;
            } else {
                 setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, isSearching: false } : m));
                 prompt = `SYSTEM INSTRUCTION: ${langInstruction}\nUSER QUERY: "${textInput}"\nGUIDANCE: Use internal knowledge. ${langInstruction}`;
            }
        } catch (e) {
            console.error("Search failed", e);
            setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, isSearching: false } : m));
        }
    } else {
        setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, isSearching: false } : m));
        prompt = `${langInstruction}\n\n${finalUserContent}`;
    }
    
    // 5. Stream
    abortControllerRef.current = new AbortController();
    const systemInstruction = "\n\n[System: Add 3 related questions at the end in this format: <<Q1>> <<Q2>> <<Q3>>]";
    
    const apiMessages = updatedMessages.map(m => ({
        role: m.role,
        content: m.content
    }));

    apiMessages.pop(); 
    apiMessages.push({
        role: 'user',
        content: prompt + systemInstruction
    });

    await processAIResponse(apiMessages, selectedModel, aiMessageId, abortControllerRef.current.signal);
  };

  const processAIResponse = async (apiHistory: any[], modelId: string, messageId: string, signal: AbortSignal) => {
    let fullContent = '';

    await streamChatResponse(
      apiHistory as Message[], 
      modelId,
      API_CONFIG.endpoint,
      API_CONFIG.apiKey,
      (chunk) => {
        fullContent += chunk;
        const parts = fullContent.split(/<<|>>/);
        let visibleContent = parts[0]; 
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: visibleContent }
            : msg
        ));
      },
      () => {
        setIsLoading(false);
        abortControllerRef.current = null;
        const matches = fullContent.match(/<<([^>>]+)>>/g);
        if (matches) {
            const questions = matches.map(m => m.replace(/<<|>>/g, '').trim()).slice(0, 3);
            setMessages(prev => prev.map(msg => 
                msg.id === messageId 
                  ? { ...msg, relatedQuestions: questions } 
                  : msg
              ));
        }
      },
      (error) => {
        console.error(error);
        setIsLoading(false);
        abortControllerRef.current = null;
        if (error.message !== 'Aborted by user') {
            setMessages(prev => prev.map(msg => 
            msg.id === messageId 
                ? { 
                    ...msg, 
                    content: msg.content + `\n\n> ⚠️ **Connection Error**\n> ${error.message}`
                }
                : msg
            ));
        }
      },
      signal
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Edit Logic
  const startEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditInput(message.content);
    setIsEditModalOpen(true);
  };
  
  const submitEdit = async () => {
    if (!editInput.trim() || !editingMessageId) return;
    const editIndex = messages.findIndex(m => m.id === editingMessageId);
    if (editIndex === -1) return;
    const previousMessages = messages.slice(0, editIndex);
    setIsEditModalOpen(false);
    setEditingMessageId(null);
    setEditInput('');
    setMessages(previousMessages); 
    setTimeout(() => handleSendMessage(editInput), 10);
  };

  const cancelEdit = () => {
      setIsEditModalOpen(false);
      setEditingMessageId(null);
      setEditInput('');
  };

  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const getModelName = (id: string) => AVAILABLE_MODELS.find(m => m.id === id)?.name || id;

  const renderFileIcon = (file: File) => {
      if (file.type.startsWith('image/')) return <ImageIcon size={14} className="text-purple-400" />;
      if (file.type.includes('pdf')) return <FileText size={14} className="text-red-400" />;
      if (file.type.includes('word') || file.type.includes('document')) return <FileText size={14} className="text-blue-400" />;
      if (file.type.includes('sheet') || file.type.includes('excel')) return <FileText size={14} className="text-green-400" />;
      return <FileIcon size={14} className="text-zinc-400" />;
  };

  const getQueryForMessage = (msg: Message, idx: number) => {
      if (msg.role === 'assistant' && idx > 0) return messages[idx-1].content;
      return "";
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden transition-colors duration-300">
      
      {/* File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        multiple 
        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xlsx,.txt,.csv,.js,.ts,.py,.json,.md"
      />

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-lg">Edit Message</h3>
              <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <textarea
                value={editInput}
                onChange={(e) => setEditInput(e.target.value)}
                className="w-full h-48 bg-muted/50 border border-input rounded-xl p-4 placeholder-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring resize-none transition-all"
                placeholder="Edit your message..."
              />
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-muted/20 border-t border-border">
              <button onClick={cancelEdit} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button onClick={submitEdit} disabled={!editInput.trim()} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors">Save & Submit</button>
            </div>
          </div>
        </div>
      )}

      <Sidebar 
        isOpen={isSidebarOpen} 
        onNewChat={() => { setMessages([]); setInput(''); setAttachedFiles([]); }} 
        toggleSidebar={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col relative h-full w-full max-w-full">
        {/* Top Navigation */}
        <div className="h-16 flex items-center justify-between px-4 md:px-6 absolute top-0 w-full z-10">
          <div className="flex items-center">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent mr-2">
                <PanelLeftOpen size={20} />
              </button>
            )}
            {!isSidebarOpen && <span className="font-semibold ml-2">Lorph</span>}
          </div>
          <div className="flex items-center">
            <GuestMenu currentTheme={theme} setTheme={setTheme} />
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto w-full pb-40" id="chat-container">
          {hasMessages ? (
            <div className="max-w-3xl mx-auto pt-24 px-4 md:px-0">
              {messages.map((msg, idx) => (
                <div key={msg.id} className="group mb-8 animate-fade-in flex flex-col gap-2">
                   
                   {/* Message Body */}
                   <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                            {msg.role === 'user' ? (
                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground"><User size={16} /></div>
                            ) : (
                                <div className="w-8 h-8 flex items-center justify-center"></div> 
                            )}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="font-medium text-sm text-muted-foreground mb-1 flex items-center gap-2">
                                {msg.role === 'user' ? 'You' : null}
                                {msg.model && <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{getModelName(msg.model)}</span>}
                            </div>
                            
                            {/* SEARCH WIDGET */}
                            {msg.role === 'assistant' && (msg.isSearching || (msg.searchResults && msg.searchResults.length > 0)) && (
                                <SearchWidget 
                                    results={msg.searchResults} 
                                    isLoading={msg.isSearching} 
                                    query={getQueryForMessage(msg, idx)} 
                                />
                            )}

                            <div className="text-base leading-relaxed text-foreground"><MarkdownRenderer content={msg.content} /></div>
                            
                            <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => copyToClipboard(msg.content, msg.id)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                                {copiedMessageId === msg.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                </button>
                                {msg.role === 'user' ? (
                                <button onClick={() => startEdit(msg)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"><Pencil size={14} /></button>
                                ) : (
                                <button onClick={() => { 
                                    const history = messages.slice(0, idx); 
                                    setMessages(history); 
                                    const lastUserMsg = messages[idx-1];
                                    if(lastUserMsg) handleSendMessage(lastUserMsg.content);
                                }} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"><RotateCcw size={14} /></button>
                                )}
                            </div>
                        </div>
                   </div>

                   {/* RELATED QUESTIONS */}
                   {msg.role === 'assistant' && msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                       <div className="pl-12 mt-4 animate-fade-in border-t border-border pt-3">
                           <div className="flex items-center gap-2 text-muted-foreground mb-2 text-sm font-medium select-none">
                               <Repeat2 size={14} /> <span>Related</span>
                           </div>
                           <div className="flex flex-col gap-0.5">
                               {msg.relatedQuestions.map((q, qIdx) => (
                                   <button 
                                    key={qIdx}
                                    onClick={() => handleSendMessage(q)}
                                    className="text-left flex items-start gap-3 px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent group"
                                   >
                                       <ArrowRight size={16} className="mt-1 flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                                       <span className="text-sm leading-relaxed">{q}</span>
                                   </button>
                               ))}
                           </div>
                       </div>
                   )}
                </div>
              ))}
              
              {/* Loading Indicators */}
              {(isLoading || isProcessingFiles) && !messages[messages.length-1]?.isSearching && (
                 <div className="flex gap-4 mb-8 animate-fade-in">
                    <div className="w-8 h-8 flex items-center justify-center"></div>
                    <div className="flex items-center">
                        {isProcessingFiles ? (
                            <span className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin" />
                                Reading files...
                            </span>
                        ) : messages[messages.length-1]?.content === '' && (
                            <Spinner className="h-5 w-5 text-zinc-400" />
                        )}
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
             <div className="h-full"></div>
          )}
        </div>
        
        {/* Gradient Blur */}
        {hasMessages && (
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none z-10" />
        )}

        {/* Input Area */}
        <div className={`absolute left-0 right-0 w-full z-50 px-4 md:px-0 transition-all duration-500 ease-in-out ${hasMessages ? 'bottom-0 pb-6' : 'top-1/2 -translate-y-1/2'}`}>
            <div className="max-w-3xl mx-auto relative">
                
                {/* Hero */}
                {!hasMessages && (
                  <div className="flex flex-col items-center justify-center mb-10 animate-fade-in">
                    <div className="mb-8 transform scale-125 text-foreground"><Logo className="h-10 md:h-12 text-foreground" /></div>
                    <h1 className="text-2xl md:text-3xl font-semibold text-center text-foreground">How can I help you today?</h1>
                  </div>
                )}

                {/* File Previews */}
                {attachedFiles.length > 0 && (
                  <div className="flex gap-2 mb-2 overflow-x-auto px-2 py-1 scrollbar-hide">
                    {attachedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-secondary border border-border rounded-full px-3 py-1.5 text-xs text-secondary-foreground animate-fade-in-up flex-shrink-0">
                        {renderFileIcon(file)}
                        <span className="max-w-[120px] truncate">{file.name}</span>
                        <button onClick={() => removeFile(idx)} className="hover:bg-muted rounded-full p-0.5 transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input Container */}
                <div ref={inputContainerRef} onClick={handleContainerClick} className="relative bg-secondary rounded-[32px] p-4 transition-colors duration-200 cursor-text group shadow-lg border border-border flex flex-col gap-3">
                    
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything..."
                        className="w-full bg-transparent text-foreground text-lg placeholder-muted-foreground px-2 outline-none resize-none max-h-[200px] overflow-y-auto min-h-[24px] leading-relaxed"
                        rows={1}
                    />
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                disabled={isLoading || isProcessingFiles}
                                className={`w-10 h-10 rounded-full bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors ${isLoading || isProcessingFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Attach file"
                            >
                                <Paperclip size={20} />
                            </button>

                            <div className="relative" ref={modelMenuRef}>
                                <button onClick={(e) => { e.stopPropagation(); setIsModelMenuOpen(!isModelMenuOpen); }} className="h-10 px-4 rounded-full bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-sm font-medium transition-colors flex items-center gap-2">
                                    {getModelName(selectedModel)}
                                    <ChevronUp size={14} className={`transition-transform duration-200 ${isModelMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isModelMenuOpen && (
                                    <div className={`absolute left-0 w-72 max-h-80 overflow-y-auto bg-popover border border-border rounded-xl shadow-xl z-[60] p-1 flex flex-col gap-0.5 animate-fade-in-up bottom-full mb-2`}>
                                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground sticky top-0 bg-popover z-10">Select Model</div>
                                        {AVAILABLE_MODELS.map(model => (
                                            <button key={model.id} onClick={() => { setSelectedModel(model.id); setIsModelMenuOpen(false); }} className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between group ${selectedModel === model.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}>
                                                {model.name}
                                                {selectedModel === model.id && <Check size={14} className="text-primary" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={() => handleSendMessage()} 
                            disabled={!input.trim() && attachedFiles.length === 0 && !isLoading && !isProcessingFiles} 
                            className={`w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center ${
                                (isLoading || isProcessingFiles) 
                                ? 'bg-muted text-muted-foreground' 
                                : (input.trim() || attachedFiles.length > 0) ? 'bg-primary text-primary-foreground hover:opacity-90' : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }`}
                        >
                            {isLoading || isProcessingFiles ? (
                                <Square size={16} fill="currentColor" />
                            ) : (
                                <ArrowUp size={20} />
                            )}
                        </button>
                    </div>
                </div>
                
                <div className="text-center mt-4">
                  <p className="text-xs text-muted-foreground">Lorph can make mistakes. Check important info.</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default App;