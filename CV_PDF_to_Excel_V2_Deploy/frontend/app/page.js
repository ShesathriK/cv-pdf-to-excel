'use me';
import { useState, useRef } from 'react';

export default function Home() {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedResults, setProcessedResults] = useState([]);
  const fileInputRef = useRef(null);

  // Append new files without replacing existing ones
  const handleFileAdd = (newFileList) => {
    const incoming = Array.from(newFileList).filter(
      (file) => file.type === 'application/pdf' || file.name.endsWith('.pdf')
    );

    setFiles((prev) => {
      // Avoid duplicate uploads by matching file name and size
      const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const filteredIncoming = incoming.filter(
        (f) => !existingKeys.has(`${f.name}-${f.size}`)
      );
      return [...prev, ...filteredIncoming];
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFileAdd(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setProcessedResults([]);
  };

  const processFiles = async () => {
    if (!files.length) return;
    setIsProcessing(true);

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/process-pdfs/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Processing failed');

      // Trigger standard file download for converted Excel output
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Extracted_CV_Data_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setProcessedResults(files.map(f => f.name));
    } catch (err) {
      alert(`Error processing files: ${err.message}`);
    } fontally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-cyan-400 font-sans p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Futuristic Background Glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl z-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
            NEXUS PDF EXTRACTOR
          </h1>
          <p className="text-slate-400 text-sm tracking-widest uppercase">
            CV-to-Excel Automated Parsing Neural Engine
          </p>
        </div>

        {/* Drop Zone Container */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-slate-900/60 backdrop-blur-md rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 shadow-[0_0_25px_rgba(6,182,212,0.1)] hover:shadow-[0_0_35px_rgba(6,182,212,0.25)] flex flex-col items-center justify-center group"
        >
          <input
            type="file"
            multiple
            accept=".pdf"
            ref={fileInputRef}
            onChange={(e) => handleFileAdd(e.target.files)}
            className="hidden"
          />
          <div className="w-16 h-16 mb-4 rounded-full bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-lg font-medium text-slate-200">
            Drag & Drop PDF CVs here, or <span className="text-cyan-400 underline">Browse</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">Supports single or multi-file sequential additions</p>
        </div>

        {/* Uploaded Queue Section */}
        {files.length > 0 && (
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-sm font-semibold tracking-wider text-cyan-300 uppercase">
                Queue ({files.length} {files.length === 1 ? 'File' : 'Files'})
              </h2>
              <button
                onClick={clearAll}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
              >
                Clear Queue
              </button>
            </div>

            <ul className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {files.map((file, idx) => (
                <li
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-cyan-500/30 transition-all text-sm"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span className="text-xs font-mono text-cyan-500">[{idx + 1}]</span>
                    <span className="truncate text-slate-200 font-medium">{file.name}</span>
                    <span className="text-xs text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                    title="Remove file"
                  >
                    &#x2715;
                  </button>
                </li>
              ))}
            </ul>

            {/* Actions */}
            <div className="pt-2">
              <button
                onClick={processFiles}
                disabled={isProcessing}
                className="w-full py-3.5 px-6 rounded-xl font-bold tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 disabled:opacity-50 transition-all duration-300 shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)] cursor-pointer"
              >
                {isProcessing ? 'PROCESSING NEURAL CONVERSION...' : 'PROCESS ALL PDFS TO EXCEL'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
