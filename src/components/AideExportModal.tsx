import React, { useState } from 'react';
import { getAideProjectFiles, AideProjectFile } from '../utils/aideProjectGenerator';
import { SimpleZipBuilder, downloadZip } from '../utils/zipExporter';
import { Smartphone, Copy, Check, Download, BookOpen, X, Code2, FolderArchive, ArrowRight } from 'lucide-react';

interface AideExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AideExportModal: React.FC<AideExportModalProps> = ({ isOpen, onClose }) => {
  const files = getAideProjectFiles();
  const [selectedFile, setSelectedFile] = useState<AideProjectFile>(files[0]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'guide'>('code');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = () => {
    const zip = new SimpleZipBuilder();

    // Add all project files into the zip
    files.forEach((f) => {
      zip.addFile(f.path, f.content);
    });

    // Add a README with quick APK instructions
    zip.addFile(
      'README.txt',
      `AURA WAVE - MOBILE ANDROID STUDIO / AIDE PROJECT
===================================================

HOW TO RUN & COMPILE APK ON YOUR PHONE:
1. Open AIDE (Android IDE) on your Android device.
2. Unzip this folder into /sdcard/AppProjects/AuraWave/
3. In AIDE, tap "Open Project" and select the "AuraWave" folder.
4. Tap the "Run" (Play) button in AIDE.
   AIDE will automatically compile the project into an APK and offer to install it immediately!

HOW TO RENAME OR EXTRACT:
- You can extract this .zip anywhere on your phone.
- The project is configured with android:hardwareAccelerated="true" and Web Audio support for zero-lag mobile audio synthesis!
`
    );

    const blob = zip.generateZipBlob();
    downloadZip(blob, 'aurawave-android-project.zip');
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-mono-950 border border-mono-800 rounded-2xl p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-mono-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-mono-900 border border-mono-700 text-white flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                AIDE ANDROID PROJECT STUDIO
              </h2>
              <p className="text-[11px] text-mono-400 font-mono tracking-tight">
                COMPATIBLE WITH AIDE (ANDROID IDE ON PHONES) &amp; APK COMPILATION
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-mono-400 hover:text-white hover:bg-mono-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Banner for 1-Click ZIP Download */}
        <div className="my-3 p-3.5 bg-mono-900 border border-mono-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FolderArchive className="w-4 h-4 text-mono-300" />
              1-CLICK AIDE PROJECT .ZIP DOWNLOAD
            </span>
            <p className="text-[10px] font-mono text-mono-400 mt-0.5">
              Ready to unzip into /sdcard/AppProjects/ or compile directly into an .apk
            </p>
          </div>
          <button
            onClick={handleDownloadZip}
            className="w-full sm:w-auto px-4 py-2 bg-white text-black hover:bg-mono-200 font-mono font-bold text-xs rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-2 shadow"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-black" />
                <span>DOWNLOADED .ZIP!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD PROJECT .ZIP</span>
              </>
            )}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between pb-2 border-b border-mono-800">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'code'
                  ? 'bg-white text-black'
                  : 'bg-mono-900 text-mono-400 hover:text-white border border-mono-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> SOURCE CODE
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'guide'
                  ? 'bg-white text-black'
                  : 'bg-mono-900 text-mono-400 hover:text-white border border-mono-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> AIDE GUIDE
            </button>
          </div>

          <span className="text-[10px] font-mono text-mono-500 uppercase tracking-widest hidden sm:inline">
            PACKAGE: com.aurawave.musicstudio
          </span>
        </div>

        {/* Tab Content */}
        {activeTab === 'code' ? (
          <div className="flex-1 flex flex-col md:flex-row gap-4 py-3 min-h-0 overflow-hidden">
            {/* File List */}
            <div className="w-full md:w-64 flex flex-col gap-1.5 overflow-y-auto pr-1">
              <span className="text-[9px] font-mono text-mono-500 uppercase tracking-widest mb-1">
                FILES TREE
              </span>
              {files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedFile.path === file.path
                      ? 'bg-mono-900 border-white text-white shadow-sm'
                      : 'bg-mono-950 border-mono-800 text-mono-400 hover:text-white hover:border-mono-700'
                  }`}
                >
                  <div className="text-xs font-mono font-bold truncate uppercase">{file.name}</div>
                  <div className="text-[10px] text-mono-500 truncate mt-0.5 font-mono">{file.path}</div>
                </button>
              ))}
            </div>

            {/* Code Viewer */}
            <div className="flex-1 flex flex-col min-h-0 bg-mono-900 border border-mono-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-mono-800 bg-mono-950">
                <span className="text-xs font-mono text-mono-300 truncate">
                  {selectedFile.path}
                </span>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 bg-mono-900 hover:bg-mono-800 text-mono-200 hover:text-white border border-mono-700 rounded text-[11px] font-mono flex items-center gap-1.5 uppercase transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-white" /> COPIED
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> COPY
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-auto p-3 text-xs font-mono text-mono-300 leading-relaxed bg-black/60 selection:bg-white selection:text-black">
                <pre>{selectedFile.content}</pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-4 space-y-4 font-mono text-xs text-mono-300 pr-2">
            <div className="p-4 bg-mono-900 border border-mono-800 rounded-xl space-y-2">
              <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-white" /> HOW TO BUILD &amp; INSTALL ON AIDE (ANDROID)
              </h3>
              <p className="text-mono-400 text-xs">
                AIDE (Android IDE) is a mobile compiler that compiles native APKs directly on your phone without a PC.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 bg-mono-900 border border-mono-800 rounded-xl space-y-1.5">
                <span className="text-[10px] text-mono-500 uppercase tracking-wider block">STEP 01</span>
                <h4 className="font-bold text-white text-xs uppercase">DOWNLOAD .ZIP PROJECT</h4>
                <p className="text-mono-400 text-[11px]">
                  Click "DOWNLOAD PROJECT .ZIP" above to get <code className="text-white">aurawave-android-project.zip</code>.
                </p>
              </div>

              <div className="p-3.5 bg-mono-900 border border-mono-800 rounded-xl space-y-1.5">
                <span className="text-[10px] text-mono-500 uppercase tracking-wider block">STEP 02</span>
                <h4 className="font-bold text-white text-xs uppercase">EXTRACT TO AppProjects</h4>
                <p className="text-mono-400 text-[11px]">
                  Unzip the archive to <code className="text-white">/sdcard/AppProjects/AuraWave/</code> on your device.
                </p>
              </div>

              <div className="p-3.5 bg-mono-900 border border-mono-800 rounded-xl space-y-1.5">
                <span className="text-[10px] text-mono-500 uppercase tracking-wider block">STEP 03</span>
                <h4 className="font-bold text-white text-xs uppercase">OPEN IN AIDE</h4>
                <p className="text-mono-400 text-[11px]">
                  Launch AIDE on your phone, tap "Open Project", and select the AuraWave folder.
                </p>
              </div>

              <div className="p-3.5 bg-mono-900 border border-mono-800 rounded-xl space-y-1.5">
                <span className="text-[10px] text-mono-500 uppercase tracking-wider block">STEP 04</span>
                <h4 className="font-bold text-white text-xs uppercase">COMPILE &amp; INSTALL APK</h4>
                <p className="text-mono-400 text-[11px]">
                  Tap the Run button (Play icon). AIDE will build the APK and prompt you to install it immediately!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
