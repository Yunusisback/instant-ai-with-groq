import { ArrowUp, Paperclip, Mic, Square, X, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function ChatInput({ input, setInput, onSend, onStop, loading, darkMode, selectedModel, placeholderText }) {
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleSendClick();
    }
  };

  // Dosya Seçme İşlemi
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Eğer resimse önizleme oluştur
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  // Dosyayı Kaldırma İşlemi
  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Gönderme İşlemi
  const handleSendClick = () => {
    if ((!input.trim() && !selectedFile) || loading) return;
    onSend(selectedFile); 
    
    // Gönderim sonrası temizlik
    clearFile();
  };
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 128);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognition.start();
    } else {
      alert('Tarayıcınız ses tanıma özelliğini desteklemiyor.');
    }
  };
 
  return (
    <div
      className={`border-t transition-colors ${
        darkMode ? 'border-white/5 bg-black/50 backdrop-blur-md' : 'border-black/5 bg-white/50 backdrop-blur-md'
      }`}
    >
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div
          className={`relative flex flex-col rounded-3xl px-3 py-3
            transition-all duration-300 ease-out
            ${
            darkMode 
              ? isFocused 
                ? 'bg-black border border-white/20 shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)]' 
                : 'bg-[#1a1a1a] border border-white/5 shadow-none hover:border-white/10' 
              : isFocused
                ? 'bg-white border border-gray-300 shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)]'
                : 'bg-white border border-gray-200 shadow-sm hover:border-gray-300'
          }`}
        >
          {/* Dosya Önizleme Alanı */}
          {selectedFile && (
            <div className={`flex items-center gap-3 p-2 mb-2 mx-1 rounded-xl animate-fadeIn ${
              darkMode ? 'bg-white/10' : 'bg-gray-100'
            }`}>
              {/* Resim Önizlemesi veya Dosya İkonu */}
              <div className={`relative w-12 h-12 shrink-0 rounded-lg overflow-hidden flex items-center justify-center ${
                darkMode ? 'bg-black/40' : 'bg-white'
              }`}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <FileText className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                )}
              </div>

              {/* Dosya Bilgisi */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${darkMode ? 'text-white' : 'text-black'}`}>
                  {selectedFile.name}
                </p>
                <p className={`text-[10px] ${darkMode ? 'text-white/50' : 'text-black/50'}`}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              {/* Kapat Butonu */}
              <button 
                onClick={clearFile}
                className={`p-1.5 rounded-full transition-colors ${
                  darkMode ? 'hover:bg-white/20 text-white/70' : 'hover:bg-black/10 text-black/70'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Alanı Alt Satır */}
          <div className="flex items-end gap-2 w-full">

            {/* Gizli Dosya Inputu */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
              accept="image/*,.pdf,.doc,.docx,.txt"
            />

            <button
              type="button"
              className={`p-2 rounded-xl transition-colors shrink-0 mb-1 ${
                darkMode ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-black/10 text-black/50 hover:text-black'
              }`}
              onClick={() => fileInputRef.current?.click()}
              title="Dosya Yükle"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholderText || "Mesajınızı yazın..."} 
              disabled={loading}
              className={`flex-1 bg-transparent outline-none border-none text-sm resize-none py-3 px-1 max-h-32 no-scrollbar leading-relaxed ${
                darkMode ? 'text-white placeholder-white/30' : 'text-black placeholder-black/30'
              } disabled:opacity-50 focus:outline-none focus:ring-0`}
              style={{ boxShadow: 'none' }}
            />

            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={loading}
              className={`p-2 rounded-xl transition-colors shrink-0 mb-1 ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : darkMode 
                    ? 'hover:bg-white/10 text-white/50 hover:text-white' 
                    : 'hover:bg-black/10 text-black/50 hover:text-black'
              } disabled:opacity-50`}
            >
              <Mic className="w-5 h-5" />
            </button>

            {loading ? (
              <button
                  type="button"
                  onClick={onStop}
                  className={`p-2 rounded-xl transition-all duration-300 flex items-center justify-center shrink-0 mb-1 ${
                    darkMode ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'
                  }`}
              >
                <div className="animate-pulse">
                  <Square className="w-5 h-5 fill-current" />
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendClick}
                disabled={!input.trim() && !selectedFile}
                className={`p-2 rounded-xl transition-all duration-300 flex items-center justify-center shrink-0 mb-1 ${
                  !input.trim() && !selectedFile
                    ? 'opacity-30 cursor-default'
                    : darkMode 
                      ? 'bg-white text-black hover:bg-white/90 hover:scale-105' 
                      : 'bg-black text-white hover:bg-black/90 hover:scale-105'
                }`}
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        <p className={`text-xs text-center mt-3 transition-colors duration-500 ${
          darkMode ? 'text-white/20' : 'text-black/20'
        }`}>
          Groq {selectedModel ? selectedModel.replace('llama-', 'Llama ').replace('mixtral-', 'Mixtral ') : 'Llama 3.1'}  
        </p>
      </div>
    </div>
  );
}