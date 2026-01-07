import React, { useState, useRef, useEffect } from 'react';
import { AppState, MeetingData, MeetingRecord } from './types';
import { NeonButton } from './components/NeonButton';
import { Visualizer } from './components/Visualizer';
import { transcribeAndSummarize } from './services/geminiService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from './supabaseClient';
import { Auth } from './components/Auth';
import { CloudDocs } from './components/CloudDocs';
import { MeetingHistory } from './components/MeetingHistory';
import { User } from '@supabase/supabase-js';

// Icons
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>;
const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const NoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>;
const SparkleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/></svg>;
const FileTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const ScrollIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M10 2v4h4"/></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const CloudUploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 13v8"/><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="m8 17 4-4 4 4"/></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

// New Fox Tech Logo
const FoxTechLogo = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="foxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#d946ef" />
      </linearGradient>
    </defs>
    {/* Geometric Fox Head */}
    <path d="M20 30 L50 70 L80 30 L90 10 L50 20 L10 10 Z" fill="url(#foxGradient)" opacity="0.2" />
    <path d="M20 30 L50 70 L80 30" stroke="url(#foxGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 30 L10 10 L35 25" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M80 30 L90 10 L65 25" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M35 25 L50 50 L65 25" stroke="#d946ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    
    {/* Tech Nodes */}
    <circle cx="20" cy="30" r="3" fill="#06b6d4" />
    <circle cx="80" cy="30" r="3" fill="#06b6d4" />
    <circle cx="50" cy="70" r="3" fill="#06b6d4" />
    <circle cx="50" cy="20" r="2" fill="#06b6d4" />
  </svg>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [meetingTitle, setMeetingTitle] = useState('');
  
  const [assemblyType, setAssemblyType] = useState<'ORDINÁRIA' | 'EXTRAORDINÁRIA'>('ORDINÁRIA');
  const [assemblyNumber, setAssemblyNumber] = useState('');

  const [timer, setTimer] = useState(0);
  const [userNotes, setUserNotes] = useState('');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [finalData, setFinalData] = useState<MeetingData | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'minutes' | 'export'>('summary');
  const [mimeType, setMimeType] = useState<string>('');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAlreadySaved, setIsAlreadySaved] = useState(false);
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const ataDocumentRef = useRef<HTMLDivElement>(null);

  // Supabase Auth Listener
  useEffect(() => {
    if (isOfflineMode) {
        setAuthLoading(false);
        return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isOfflineMode]);

  // Auto-number logic on mount
  useEffect(() => {
    const year = new Date().getFullYear();
    setAssemblyNumber(`001/${year}`);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSupportedMimeType = () => {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startMeeting = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      
      const supportedType = getSupportedMimeType();
      setMimeType(supportedType);
      
      const options = supportedType ? { mimeType: supportedType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const finalMimeType = supportedType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalMimeType });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        processMeetingData(blob);
      };

      mediaRecorder.start();
      setAppState(AppState.RECORDING);
      setIsAlreadySaved(false);
      
      timerRef.current = window.setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Acesso ao microfone é necessário.");
    }
  };

  const stopMeeting = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setAppState(AppState.PROCESSING);
  };

  const resetApp = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    
    setMeetingTitle('');
    setTimer(0);
    setUserNotes('');
    setMediaStream(null);
    setAudioURL(null);
    setFinalData(null);
    setMimeType('');
    setActiveTab('summary');
    setIsAlreadySaved(false);
    
    const year = new Date().getFullYear();
    setAssemblyNumber((prev) => {
      const num = parseInt(prev.split('/')[0]);
      if (!isNaN(num)) {
         return `${(num + 1).toString().padStart(3, '0')}/${year}`;
      }
      return prev;
    });

    setAppState(AppState.IDLE);
    setRefreshHistoryTrigger(prev => prev + 1); // Refresh history list
  };

  const processMeetingData = async (audioBlob: Blob) => {
    const { transcript, summary, minutes } = await transcribeAndSummarize(
      audioBlob, 
      userNotes, 
      assemblyType, 
      assemblyNumber
    );
    
    setFinalData({
      id: Date.now().toString(),
      title: meetingTitle || `${assemblyType} Assembleia ${assemblyNumber}`,
      date: new Date(),
      duration: timer,
      audioBlob: audioBlob,
      transcript,
      summary,
      minutes,
      userNotes,
      assemblyType,
      assemblyNumber
    });
    
    setAppState(AppState.REVIEW);
  };

  const saveMeetingToSupabase = async () => {
    if (!finalData || isOfflineMode || !user) {
        if(isOfflineMode) alert("Funcionalidade indisponível no modo offline.");
        return;
    }

    if (isAlreadySaved) return;

    setIsSaving(true);
    try {
        let audioPath = null;

        // 1. Upload Audio if it exists and hasn't been uploaded (Blob present)
        if (finalData.audioBlob) {
            const fileName = `audio_${Date.now()}.webm`;
            const filePath = `${user.id}/${fileName}`;
            const { error: uploadError } = await supabase.storage
                .from('user_docs')
                .upload(filePath, finalData.audioBlob);
            
            if (uploadError) throw uploadError;
            audioPath = filePath;
        } else if (finalData.audioUrl) {
            // Already uploaded/loaded from history
            audioPath = finalData.audioUrl;
        }

        // 2. Insert Data
        const { error } = await supabase.from('meetings').insert({
            user_id: user.id,
            title: finalData.title,
            date: finalData.date.toISOString(),
            duration: finalData.duration,
            assembly_type: finalData.assemblyType,
            assembly_number: finalData.assemblyNumber,
            summary: finalData.summary,
            transcript: finalData.transcript,
            minutes: finalData.minutes,
            audio_url: audioPath
        });

        if (error) throw error;
        
        setIsAlreadySaved(true);
        // Update local state to reflect it's saved (and has a path now if it was new)
        setFinalData(prev => prev ? ({ ...prev, audioUrl: audioPath || prev.audioUrl }) : null);

        alert("Ata, resumo e áudio salvos na nuvem com sucesso!");
    } catch (error: any) {
        console.error("Save error:", error);
        alert("Erro ao salvar: " + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  const loadPastMeeting = (record: MeetingRecord) => {
    setFinalData({
        id: record.id,
        title: record.title,
        date: new Date(record.date),
        duration: record.duration,
        audioBlob: null, // Audio is in storage, not blob. We use audioUrl.
        transcript: record.transcript,
        summary: record.summary,
        minutes: record.minutes,
        userNotes: "Registro Histórico (Carregado)",
        assemblyType: record.assembly_type as any,
        assemblyNumber: record.assembly_number,
        audioUrl: record.audio_url
    });
    setIsAlreadySaved(true); // Disable save button for historical records
    setAppState(AppState.REVIEW);
  };

  const downloadSecureAudio = async () => {
    if (!finalData?.audioUrl) return;
    
    try {
        const { data, error } = await supabase.storage
            .from('user_docs')
            .createSignedUrl(finalData.audioUrl, 60); // 1 minute link

        if (error) throw error;
        if (data?.signedUrl) {
            const a = document.createElement('a');
            a.href = data.signedUrl;
            a.download = `Audio-${finalData.assemblyNumber?.replace('/','-')}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    } catch (e: any) {
        alert("Erro ao baixar áudio: " + e.message);
    }
  };

  const generatePDF = async () => {
    if (!ataDocumentRef.current || !finalData) return;
    
    setIsPdfGenerating(true);
    
    try {
      const element = ataDocumentRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2, 
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); 
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = pdfWidth / imgWidth;
      const imgHeightInPdf = imgHeight * ratio;
      
      let heightLeft = imgHeightInPdf;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeightInPdf;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`Ata-${finalData.assemblyNumber?.replace('/', '-')}.pdf`);
      
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Legacy local save (for immediate recording)
  const saveAudioFileLocal = async () => {
    if (!finalData?.audioBlob) return;
    
    const suggestedName = `Audio-Ata-${finalData.assemblyNumber?.replace('/', '-')}.webm`;

    try {
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: suggestedName,
          types: [{
            description: 'Audio File',
            accept: { 'audio/webm': ['.webm', '.mp3'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(finalData.audioBlob);
        await writable.close();
        alert("Áudio salvo com sucesso!");
        return;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn("File System Access API failed, falling back.");
    }

    const url = URL.createObjectURL(finalData.audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neon-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-neon-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show Auth if not logged in AND not in offline mode
  if (!user && !isOfflineMode) {
    return <Auth onEnterOffline={() => setIsOfflineMode(true)} />;
  }

  return (
    <div className="min-h-screen bg-neon-bg text-gray-200 selection:bg-neon-cyan selection:text-black font-sans flex flex-col">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-neon-bg/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setAppState(AppState.IDLE)}>
            <FoxTechLogo className="w-10 h-10" />
            <h1 className="text-2xl font-bold tracking-tighter text-white">
              Fox<span className="text-neon-orange">Scribe</span> <span className="text-neon-cyan">7.3</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-slate-400 hidden sm:block">
              {isOfflineMode ? "Modo Offline (Demo)" : user?.email}
            </div>
            
            {!isOfflineMode && (
                <button 
                onClick={() => supabase.auth.signOut()}
                className="text-slate-400 hover:text-red-400 transition-colors"
                title="Sair"
                >
                <LogoutIcon />
                </button>
            )}

            {isOfflineMode && (
                <button 
                onClick={() => setIsOfflineMode(false)}
                className="text-slate-400 hover:text-neon-cyan transition-colors text-xs border border-slate-700 rounded px-2 py-1"
                >
                Fazer Login
                </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 flex-grow w-full">
        
        {/* IDLE STATE: SCHEDULER / SETUP */}
        {appState === AppState.IDLE && (
          <div className="animate-in fade-in zoom-in duration-500 space-y-12">
            
            <div className="flex flex-col items-center justify-center">
              <div className="w-full max-w-lg p-8 rounded-2xl bg-neon-surface border border-slate-800 shadow-[0_0_50px_-12px_rgba(249,115,22,0.15)]">
                
                <div className="flex items-center justify-center gap-4 mb-8 pb-6 border-b border-slate-800">
                  <FoxTechLogo className="w-20 h-20 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]" />
                  <div>
                      <h3 className="text-xl font-bold text-white">Gestão Inteligente</h3>
                      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-orange to-neon-purple tracking-widest">FOX SCRIBE</h2>
                  </div>
                </div>

                <div className="space-y-6">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Assembleia</label>
                      <select 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-neon-orange focus:ring-1 focus:ring-neon-orange outline-none"
                        value={assemblyType}
                        onChange={(e) => setAssemblyType(e.target.value as 'ORDINÁRIA' | 'EXTRAORDINÁRIA')}
                      >
                        <option value="ORDINÁRIA">ORDINÁRIA</option>
                        <option value="EXTRAORDINÁRIA">EXTRAORDINÁRIA</option>
                      </select>
                    </div>
                    
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Nº da Ata
                        <span className="ml-2 text-[10px] text-neon-orange bg-neon-orange/10 px-1 rounded">Auto</span>
                      </label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-neon-orange focus:ring-1 focus:ring-neon-orange outline-none"
                        value={assemblyNumber}
                        onChange={(e) => setAssemblyNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Assunto / Tópico Principal</label>
                    <input 
                      type="text" 
                      placeholder="ex: Planejamento Anual" 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-neon-orange focus:ring-1 focus:ring-neon-orange outline-none transition-all"
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                    />
                  </div>

                  <div className="pt-2 flex justify-center">
                    <NeonButton 
                      onClick={startMeeting} 
                      icon={<MicIcon />}
                      className="w-full"
                    >
                      Iniciar Gravação
                    </NeonButton>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cloud Documents Section */}
                <CloudDocs isOffline={isOfflineMode} />
                
                {/* Meeting History Section */}
                <MeetingHistory 
                    isOffline={isOfflineMode} 
                    onSelectMeeting={loadPastMeeting} 
                    refreshTrigger={refreshHistoryTrigger}
                />
            </div>
          </div>
        )}

        {/* RECORDING STATE */}
        {appState === AppState.RECORDING && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-10 duration-500">
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-neon-surface border border-slate-800 shadow-[0_0_30px_-5px_rgba(249,115,22,0.1)]">
                <div className="flex justify-between items-center mb-4">
                  <div className="overflow-hidden">
                    <h3 className="text-xl font-semibold text-white truncate">{meetingTitle || "Assembleia Sem Título"}</h3>
                    <p className="text-xs text-neon-orange">{assemblyType} - Nº {assemblyNumber}</p>
                  </div>
                  <div className="flex items-center gap-2 text-neon-orange font-mono text-xl">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    {formatTime(timer)}
                  </div>
                </div>
                
                <Visualizer stream={mediaStream} isRecording={true} />
                
                <div className="mt-8 flex justify-center">
                   <NeonButton variant="danger" onClick={stopMeeting} icon={<StopIcon />}>
                     Encerrar e Gerar Ata
                   </NeonButton>
                </div>
              </div>
            </div>

            <div className="flex flex-col h-full min-h-[400px]">
              <div className="flex-1 p-6 rounded-2xl bg-neon-surface border border-slate-800 flex flex-col">
                 <div className="flex items-center gap-2 mb-4 text-slate-300">
                    <NoteIcon />
                    <span className="font-semibold">Notas do Secretário</span>
                 </div>
                 <textarea 
                    className="flex-1 w-full bg-transparent resize-none outline-none text-slate-300 placeholder-slate-600 font-mono text-sm leading-relaxed"
                    placeholder="- Anote pontos chave, nomes de quem falou, ou resultados de votações aqui...&#10;- A IA usará isso para garantir precisão na Ata."
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    autoFocus
                 />
              </div>
            </div>
          </div>
        )}

        {/* PROCESSING STATE */}
        {appState === AppState.PROCESSING && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
             <div className="relative">
                <div className="w-20 h-20 border-4 border-slate-800 border-t-neon-orange rounded-full animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                   <FoxTechLogo className="w-8 h-8 opacity-80" />
                </div>
             </div>
             <h2 className="text-2xl font-bold text-white mt-8 mb-2">Processando Ata</h2>
             <p className="text-slate-400">Gerando documento oficial nº {assemblyNumber}...</p>
          </div>
        )}

        {/* REVIEW STATE */}
        {appState === AppState.REVIEW && finalData && (
          <div className="animate-in fade-in duration-700">
            
            {/* Review Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                    <span className="bg-neon-orange/20 text-neon-orange text-xs font-bold px-2 py-0.5 rounded border border-neon-orange/50">
                      {finalData.assemblyType}
                    </span>
                    <span className="text-slate-500 text-xs font-mono">#{finalData.assemblyNumber}</span>
                 </div>
                 <h2 className="text-3xl font-bold text-white mb-1">{finalData.title}</h2>
                 <div className="flex items-center gap-4 text-slate-400 text-sm">
                   <span className="flex items-center gap-1"><ClockIcon /> {formatTime(finalData.duration)}</span>
                   <span>•</span>
                   <span>{finalData.date.toLocaleDateString()}</span>
                 </div>
               </div>
               <div className="flex gap-2">
                 <NeonButton 
                   onClick={saveMeetingToSupabase}
                   // Disabled if saving OR if in offline mode OR if already saved
                   disabled={isSaving || isOfflineMode || isAlreadySaved || (!finalData.audioBlob && !finalData.audioUrl)} 
                   className={isSaving || isAlreadySaved ? "opacity-50 cursor-not-allowed" : ""}
                   icon={isAlreadySaved ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : <CloudUploadIcon />}
                 >
                    {isSaving ? "Salvando..." : isAlreadySaved ? "Salvo" : "Salvar no Cloud"}
                 </NeonButton>
                 
                 <NeonButton 
                   variant="secondary" 
                   onClick={resetApp}
                 >
                   Voltar ao Início
                 </NeonButton>
               </div>
            </div>

            {/* Content Tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Tab Navigation */}
              <div className="lg:col-span-1 space-y-4">
                 <div className="p-1 rounded-lg bg-slate-900 border border-slate-800 flex flex-row lg:flex-col gap-1">
                    <button 
                      onClick={() => setActiveTab('minutes')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${activeTab === 'minutes' ? 'bg-neon-surface text-white shadow-lg border border-slate-700' : 'text-slate-400 hover:text-white'}`}
                    >
                      <ScrollIcon />
                      Ata Oficial
                    </button>
                    <button 
                      onClick={() => setActiveTab('summary')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${activeTab === 'summary' ? 'bg-neon-surface text-white shadow-lg border border-slate-700' : 'text-slate-400 hover:text-white'}`}
                    >
                      <SparkleIcon />
                      Resumo Executivo
                    </button>
                    <button 
                      onClick={() => setActiveTab('transcript')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${activeTab === 'transcript' ? 'bg-neon-surface text-white shadow-lg border border-slate-700' : 'text-slate-400 hover:text-white'}`}
                    >
                      <FileTextIcon />
                      Transcrição
                    </button>
                    <button 
                      onClick={() => setActiveTab('export')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${activeTab === 'export' ? 'bg-neon-surface text-white shadow-lg border border-slate-700' : 'text-slate-400 hover:text-white'}`}
                    >
                      <DownloadIcon />
                      Exportar
                    </button>
                 </div>

                 {finalData.userNotes && (
                   <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notas Originais</h4>
                     <p className="text-sm text-slate-400 whitespace-pre-wrap italic">{finalData.userNotes}</p>
                   </div>
                 )}
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-2 min-h-[500px]">
                 <div className="p-8 rounded-2xl bg-neon-surface border border-slate-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/5 blur-[100px] rounded-full pointer-events-none"></div>

                    {activeTab === 'summary' && (
                      <div className="prose prose-invert prose-headings:text-neon-cyan max-w-none animate-in fade-in duration-300">
                        <h3 className="flex items-center gap-2 text-2xl mb-6">
                           <SparkleIcon /> 
                           <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">Resumo Executivo</span>
                        </h3>
                        <div className="whitespace-pre-wrap text-slate-300 leading-7">
                           {finalData.summary}
                        </div>
                      </div>
                    )}
                    
                    {/* MINUTES / ATA VIEW (Hidden in export mode, but reused ref) */}
                    <div className={activeTab === 'minutes' || activeTab === 'export' ? 'block' : 'hidden'}>
                      <div className="animate-in fade-in duration-300">
                         {activeTab === 'minutes' && (
                            <div className="flex justify-between items-center mb-6">
                              <h3 className="text-2xl text-white flex items-center gap-2">
                                <ScrollIcon /> Documento Oficial
                              </h3>
                            </div>
                         )}
                         
                         {/* Document Preview Container */}
                         <div ref={ataDocumentRef} className="bg-white text-black p-12 rounded-lg shadow-2xl relative min-h-[1000px] max-w-full">
                           {/* Watermark Logo */}
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                              <FoxTechLogo className="w-96 h-96 grayscale" />
                           </div>
                           
                           {/* Letterhead - GENERIC / FOX SCRIBE BRANDED */}
                           <div className="flex items-center gap-6 border-b-4 border-orange-500 pb-6 mb-8">
                              <FoxTechLogo className="w-24 h-24 shrink-0" />
                              <div>
                                <h1 className="text-2xl font-bold text-gray-800 uppercase leading-tight tracking-wide">Registro de Ata Oficial</h1>
                                <p className="text-sm text-gray-600 font-semibold mt-1">Gerado via FoxScribe 7.3 AI Assistant</p>
                                <p className="text-xs text-gray-500 mt-1">Autenticação Digital • Conformidade Padrão</p>
                              </div>
                           </div>
                           
                           <div className="whitespace-pre-wrap font-serif text-base leading-relaxed text-justify text-gray-900">
                             {finalData.minutes}
                           </div>
                           
                           {/* Footer */}
                           <div className="mt-16 pt-6 border-t border-gray-300 text-center text-xs text-gray-500">
                             <p>Documento processado por FoxScribe 7.3 em {finalData.date.toLocaleDateString()}</p>
                             <p>Produzido por: WFox Soluções e Consultoria</p>
                           </div>
                         </div>
                      </div>
                    </div>

                    {/* EXPORT TAB OVERLAY CONTROLS */}
                    {activeTab === 'export' && (
                       <div className="absolute inset-0 bg-neon-surface/90 backdrop-blur-sm z-10 flex items-center justify-center p-8 animate-in fade-in duration-300">
                          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                             <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                               <DownloadIcon /> Central de Downloads
                             </h3>
                             <p className="text-slate-400 mb-6 text-sm">Baixe os registros da reunião nos formatos desejados.</p>
                             
                             <div className="space-y-3">
                                <button 
                                  onClick={generatePDF}
                                  disabled={isPdfGenerating}
                                  className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-neon-cyan rounded-lg group transition-all"
                                >
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                                       {isPdfGenerating ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div> : "PDF"}
                                     </div>
                                     <div className="text-left">
                                        <div className="text-white font-semibold">Ata em PDF</div>
                                        <div className="text-xs text-slate-500">Formato Oficial (Multipáginas)</div>
                                     </div>
                                  </div>
                                  <DownloadIcon />
                                </button>

                                <button 
                                  onClick={() => {
                                     const blob = new Blob([finalData.minutes], { type: 'text/plain' });
                                     const url = URL.createObjectURL(blob);
                                     const a = document.createElement('a');
                                     a.href = url;
                                     a.download = `Ata-${finalData.assemblyNumber?.replace('/', '-')}.txt`;
                                     a.click();
                                  }}
                                  className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-neon-purple rounded-lg group transition-all"
                                >
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">TXT</div>
                                     <div className="text-left">
                                        <div className="text-white font-semibold">Texto Puro</div>
                                        <div className="text-xs text-slate-500">Editável em Bloco de Notas</div>
                                     </div>
                                  </div>
                                  <DownloadIcon />
                                </button>

                                {finalData.audioBlob && (
                                  <button 
                                    onClick={saveAudioFileLocal}
                                    className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-green-500 rounded-lg group transition-all"
                                  >
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                         <SaveIcon />
                                       </div>
                                       <div className="text-left">
                                          <div className="text-white font-semibold">Salvar Áudio (Local)</div>
                                          <div className="text-xs text-slate-500">Arquivo WebM original</div>
                                       </div>
                                    </div>
                                    <DownloadIcon />
                                  </button>
                                )}
                                
                                {finalData.audioUrl && !finalData.audioBlob && (
                                  <button 
                                    onClick={downloadSecureAudio}
                                    className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-green-500 rounded-lg group transition-all"
                                  >
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                         <SaveIcon />
                                       </div>
                                       <div className="text-left">
                                          <div className="text-white font-semibold">Baixar Gravação da Nuvem</div>
                                          <div className="text-xs text-slate-500">Link Seguro Temporário</div>
                                       </div>
                                    </div>
                                    <DownloadIcon />
                                  </button>
                                )}
                             </div>
                          </div>
                       </div>
                    )}

                    {activeTab === 'transcript' && (
                      <div className="prose prose-invert prose-p:text-slate-300 max-w-none animate-in fade-in duration-300">
                         <h3 className="text-2xl text-white mb-6 flex items-center gap-2">
                           <FileTextIcon /> Transcrição Completa
                         </h3>
                         <div className="whitespace-pre-wrap font-mono text-sm leading-6 bg-slate-950/50 p-6 rounded-lg border border-slate-800/50">
                           {finalData.transcript}
                         </div>
                      </div>
                    )}
                 </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-neon-bg/80 backdrop-blur-md py-4 text-center">
         <div className="max-w-5xl mx-auto px-6">
            <p className="text-xs text-slate-500 font-mono tracking-wider">
               PRODUZIDO POR: <span className="text-neon-orange font-bold">WFOX SOLUÇÕES E CONSULTORIA</span>
            </p>
         </div>
      </footer>
    </div>
  );
}