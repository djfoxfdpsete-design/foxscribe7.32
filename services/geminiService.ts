import { GoogleGenAI } from "@google/genai";

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:audio/webm;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const transcribeAndSummarize = async (
  audioBlob: Blob, 
  userNotes: string,
  assemblyType: string = 'ORDINÁRIA',
  assemblyNumber: string = '001/2026'
): Promise<{ transcript: string; summary: string; minutes: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Audio = await blobToBase64(audioBlob);

    // Using gemini-2.0-flash-exp as it currently supports multimodal inputs (audio) reliably
    const model = 'gemini-2.0-flash-exp';

    const prompt = `
      Você é o FoxScribe 7.3, um secretário de reuniões especialista e altamente eficiente desenvolvido pela WFox Soluções.
      
      Eu forneci uma gravação de áudio de uma reunião/assembleia.
      Notas geradas pelo usuário durante a reunião: "${userNotes || 'Nenhuma nota fornecida.'}"

      TAREFA 1: TRANSCRIÇÃO
      Forneça uma transcrição literal e altamente precisa do áudio em PORTUGUÊS DO BRASIL. Identifique os oradores se possível.

      TAREFA 2: RESUMO EXECUTIVO
      Com base na transcrição e nas notas, crie um resumo estruturado em PORTUGUÊS DO BRASIL contendo:
      - Recapitulação Rápida
      - Principais Decisões Tomadas
      - Ações Definidas (quem fará o quê)
      - Principais Tópicos Discutidos

      TAREFA 3: ATA OFICIAL (DOCUMENTO FORMAL)
      Gere uma "Ata de Assembleia" formal.
      
      INSTRUÇÕES CRÍTICAS PARA A ATA:
      1. Você DEVE usar o modelo exato abaixo.
      2. O Tipo de Assembleia é: ${assemblyType}
      3. O Número da Assembleia é: ${assemblyNumber}
      4. Preencha as [informações entre colchetes] com base no conteúdo do áudio (incluindo o Nome da Organização/Associação).
      5. Se detalhes específicos (como nomes ou horários exatos) não estiverem no áudio, use o contexto para inferir ou deixe marcadores genéricos se for absolutamente necessário.
      6. Mantenha a linguagem jurídica e formal padrão para atas no Brasil.
      
      INÍCIO DO MODELO:
      [NOME DA ORGANIZAÇÃO/ASSOCIAÇÃO IDENTIFICADA NO ÁUDIO]
      CNPJ: [CNPJ se mencionado ou deixar em branco] | Data: [Data Atual]

      ATA DE ASSEMBLEIA GERAL ${assemblyType} Nº ${assemblyNumber}
      1. DATA E HORA: Aos [dia] dias do mês de [mês] de [ano], com início às [hora_inicio] horas e término às [hora_fim] horas.

      2. LOCAL: [Local mencionado no áudio].

      3. MESA DIRETORA:
      Presidente: [Nome Completo]
      Secretário(a): [Nome Completo]

      4. QUÓRUM: Presentes [Número estimado] participantes, conforme lista de presença anexa.

      5. ORDEM DO DIA (PAUTA):
      [Listar os tópicos realmente discutidos na reunião com base no áudio];
      Assuntos Gerais.
      
      [Descrição sucinta, formal e jurídica do que foi deliberado sobre cada pauta. Exemplo: "Sobre o item X, foi decidido por unanimidade que..."].

      Nada mais havendo a tratar, encerrou-se a sessão, da qual lavrei a presente ata que, lida e aprovada, segue assinada por mim e pelo Presidente.
      FIM DO MODELO

      FORMATO DE SAÍDA:
      Você deve fornecer o conteúdo em três seções distintas separadas pelo delimitador exato "---SECTION_DIVIDER---".
      
      Estrutura:
      [CONTEÚDO DO RESUMO AQUI]
      ---SECTION_DIVIDER---
      [CONTEÚDO DA ATA AQUI]
      ---SECTION_DIVIDER---
      [CONTEÚDO DA TRANSCRIÇÃO AQUI]
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: audioBlob.type, 
              data: base64Audio
            }
          },
          { text: prompt }
        ]
      },
      config: {
        temperature: 0.2, 
      }
    });

    const fullText = response.text || "";
    const parts = fullText.split('---SECTION_DIVIDER