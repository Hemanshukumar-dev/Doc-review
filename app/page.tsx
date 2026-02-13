'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { type UIMessage } from 'ai';
import ReactMarkdown from 'react-markdown';



function messageText(m: UIMessage): string {
  return m.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((p) => p.text)
    .join('');
}

export default function Home() {
  const { messages, sendMessage, status } = useChat();
  const [pdfText, setPdfText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const isLoading = status === 'submitted' || status === 'streaming';

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    
    // Simple text extraction for prototype (as per requirements)
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text();
      setPdfText(text);
    } else {
        // Fallback for demo: treat any file check as text if possible or warn
        // In a real app we'd use server-side parsing. 
        // For this prototype, we'll try to read as text.
        try {
            const text = await file.text();
            setPdfText(text);
        } catch (e) {
            alert("Could not read file text. Please upload a .txt file for this demo.");
        }
    }
  };

  const handleAction = async (action: 'summarize' | 'extractTags') => {
    if (!pdfText) {
      alert('Please upload a document first.');
      return;
    }

    const actionLabels = {
      summarize: 'Summarize Document',
      extractTags: 'Extract Tags',
    };

    await sendMessage(
      { text: `Run action: ${actionLabels[action]}` },
      { body: { pdfText, action } }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-gray-900">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-100 p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-800">PDF Analysis AI</h1>
          <p className="text-gray-500 text-sm mt-1">Upload a document to analyze with Gemini 2.5 Flash</p>
        </div>

        {/* Chat / Result Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
              <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Results will appear here</p>
            </div>
          )}
          
          {messages.map((m: UIMessage) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm relative group ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-100 text-gray-700'
                }`}
              >
                {m.role !== 'user' && (
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(messageText(m));
                            // Optional: Show feedback (toast or icon change)
                            // For simplicity, we can use a temporary state or just rely on user knowing it works.
                            // Better: Add a state for "copied" logic if we want to change icon.
                            // Since we are inside a map, we can't easily use a simple state for all.
                            // We can use a small self-contained component or just a simple alert/console log for now?
                            // No, requirements asked for a clippy button. 
                            // Let's make it a simple button.
                        }}
                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 bg-white/50 hover:bg-white rounded-md opacity-0 group-hover:opacity-100 transition-all"
                        title="Copy to clipboard"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    </button>
                )}
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-xl font-bold text-gray-900 mb-3 mt-4" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-gray-800 mb-2 mt-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-md font-medium text-gray-800 mb-2 mt-2" {...props} />,
                    p: ({node, ...props}) => <p className="mb-2 text-gray-700 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 mb-2 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 mb-2 space-y-1" {...props} />,
                    li: ({node, ...props}) => <li className="text-gray-700 pl-1" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-200 pl-4 italic text-gray-600 my-2" {...props} />,
                  }}
                >
                  {messageText(m)}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-white border border-gray-100 px-5 py-3.5 rounded-2xl shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 bg-white border-t border-gray-100">
            <div className="flex flex-col gap-4">
                
                {/* File Upload */}
                <div className="relative">
                    <input
                        type="file"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isLoading}
                    />
                    <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${fileName ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        {fileName ? (
                             <div className="flex items-center justify-center gap-2 text-blue-700 font-medium">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {fileName}
                             </div>
                        ) : (
                            <div className="text-gray-500 flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                <span>Upload Document (or .txt)</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => handleAction('summarize')}
                        disabled={!pdfText || isLoading}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all active:scale-[0.98]"
                    >
                        <span>Summarize</span>
                    </button>
                    <button
                        onClick={() => handleAction('extractTags')}
                        disabled={!pdfText || isLoading}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed text-gray-700 text-sm font-medium rounded-lg transition-all active:scale-[0.98]"
                    >
                        <span>Extract Tags</span>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
