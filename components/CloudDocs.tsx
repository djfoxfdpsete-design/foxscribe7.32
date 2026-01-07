import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { StoredDocument } from '../types';

// Icons
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
const DownloadCloudIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>;

interface CloudDocsProps {
  isOffline: boolean;
}

export const CloudDocs: React.FC<CloudDocsProps> = ({ isOffline }) => {
  const [docs, setDocs] = useState<StoredDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch Documents
  useEffect(() => {
    if (isOffline) {
      setDocs([
        {
          id: '1',
          name: 'Ata_Assembleia_Exemplo_001.pdf',
          url: 'demo-path',
          user_id: 'demo',
          created_at: new Date().toISOString(),
          type: 'application/pdf',
          size: 1024 * 500
        }
      ]);
      return;
    }

    const fetchDocs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching docs:', error);
      } else if (data) {
        setDocs(data as StoredDocument[]);
      }
    };

    fetchDocs();
    
    const channel = supabase
      .channel('table-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
          fetchDocs();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); }
  }, [isOffline]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isOffline) {
        alert("O upload está desativado no Modo Demonstração.");
        return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Upload to Storage
      // Sanitizing filename
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${Date.now()}_${sanitizedName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user_docs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Insert into Database (Store only the path, not a public URL)
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          name: file.name,
          url: filePath, // Storing path for security
          type: file.type,
          size: file.size
        });

      if (dbError) throw dbError;

    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Erro no upload: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSecureDownload = async (path: string, fileName: string, docId: string) => {
    if (isOffline) {
        alert("Download indisponível no modo demo.");
        return;
    }
    
    setDownloadingId(docId);
    try {
        // Create a temporary signed URL valid for 60 seconds
        const { data, error } = await supabase.storage
            .from('user_docs')
            .createSignedUrl(path, 60);

        if (error) throw error;
        if (data?.signedUrl) {
            const a = document.createElement('a');
            a.href = data.signedUrl;
            a.download = fileName;
            a.target = "_blank";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    } catch (err: any) {
        console.error("Error downloading:", err);
        alert("Erro ao baixar arquivo seguro.");
    } finally {
        setDownloadingId(null);
    }
  };

  return (
    <div className="mt-12 p-6 rounded-2xl bg-neon-surface border border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-neon-orange">☁️</span> Arquivos Seguros
            </h3>
            {isOffline && (
                <span className="text-xs text-yellow-500 font-mono mt-1 block">● Modo Demonstração</span>
            )}
        </div>
        
        <div className="relative">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <label 
            htmlFor="file-upload"
            className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isUploading ? 'bg-slate-800 text-slate-500' : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-600 hover:border-neon-cyan'}`}
          >
            <UploadIcon />
            {isUploading ? 'Enviando...' : 'Enviar Documento'}
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.length === 0 ? (
          <div className="col-span-full text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-lg">
            Nenhum documento encontrado. Envie seu primeiro arquivo!
          </div>
        ) : (
          docs.map((doc) => (
            <div key={doc.id} className="group relative p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-neon-orange/50 transition-all hover:shadow-lg hover:shadow-neon-orange/10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                    <FileIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate" title={doc.name}>{doc.name}</p>
                    <p className="text-xs text-slate-500">
                      {(doc.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => handleSecureDownload(doc.url, doc.name, doc.id)}
                disabled={downloadingId === doc.id}
                className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-slate-800 rounded-lg text-xs font-bold text-slate-300 group-hover:bg-neon-orange group-hover:text-black transition-colors cursor-pointer"
              >
                {downloadingId === doc.id ? (
                    <span className="animate-pulse">Gerando Link...</span>
                ) : (
                    <>
                        <DownloadCloudIcon /> Baixar Seguro
                    </>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};