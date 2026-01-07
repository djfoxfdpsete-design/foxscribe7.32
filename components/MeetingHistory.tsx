import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { MeetingRecord } from '../types';

// Icons
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;

interface MeetingHistoryProps {
  onSelectMeeting: (meeting: MeetingRecord) => void;
  isOffline: boolean;
  refreshTrigger: number; // Prop to force refresh when a new meeting is saved
}

export const MeetingHistory: React.FC<MeetingHistoryProps> = ({ onSelectMeeting, isOffline, refreshTrigger }) => {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOffline) {
        setMeetings([]); 
        return;
    }
    fetchMeetings();
  }, [isOffline, refreshTrigger]);

  const fetchMeetings = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching meetings:', error);
    } else {
      setMeetings(data as MeetingRecord[]);
    }
    setLoading(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Tem certeza que deseja apagar este registro e a gravação associada?")) return;

    // 1. Find the meeting to get audio_url
    const meetingToDelete = meetings.find(m => m.id === id);

    // 2. Delete file from storage if exists
    if (meetingToDelete?.audio_url) {
        const { error: storageError } = await supabase.storage
            .from('user_docs')
            .remove([meetingToDelete.audio_url]);
        
        if (storageError) {
            console.warn("Could not delete audio file from storage:", storageError);
            // Continue to delete record anyway
        }
    }

    // 3. Delete record from DB
    const { error } = await supabase.from('meetings').delete().eq('id', id);
    if (!error) {
        setMeetings(prev => prev.filter(m => m.id !== id));
    } else {
        alert("Erro ao apagar registro: " + error.message);
    }
  };

  return (
    <div className="mt-8 p-6 rounded-2xl bg-neon-surface border border-slate-800">
      <div className="flex items-center gap-2 mb-6 text-white">
        <HistoryIcon />
        <h3 className="text-xl font-bold">Histórico de Atas</h3>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Carregando histórico...</div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-lg">
          Nenhuma ata salva anteriormente.
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <div 
              key={meeting.id}
              className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-neon-cyan/50 transition-all cursor-pointer group"
              onClick={() => onSelectMeeting(meeting)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-neon-cyan border border-neon-cyan/30 px-1.5 rounded">
                        {meeting.assembly_type?.substring(0, 3)}
                    </span>
                    <h4 className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                        {meeting.title}
                    </h4>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(meeting.date).toLocaleDateString()} • Nº {meeting.assembly_number}
                </p>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-neon-cyan"
                  title="Visualizar"
                >
                    <EyeIcon />
                </button>
                <button 
                  onClick={(e) => handleDelete(e, meeting.id)}
                  className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500"
                  title="Apagar"
                >
                    <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};