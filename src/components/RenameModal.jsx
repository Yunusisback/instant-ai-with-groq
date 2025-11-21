import { useState, useEffect, useRef } from 'react';

export default function RenameModal({ isOpen, onClose, onRename, initialValue, t, darkMode }) {
  const [value, setValue] = useState(initialValue || '');
  const inputRef = useRef(null);

  //  Gereksiz renderı önlemek için kontrol ekledik
  useEffect(() => {
    if (isOpen) {
      // Sadece değer gerçekten farklıysa güncelle
      if (value !== initialValue) {
        setValue(initialValue);
      }
      
      // Odaklanma işlemi
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
    // Dependency array e value eklemeyerek döngüyü kırdık sadece açıldığında veya initial değiştiğinde baksın
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onRename(value.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center p-4 animate-fadeIn">
      {/* Arkaplan Karartma */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Kutusu */}
      <div className={`
        relative w-full max-w-md rounded-2xl shadow-2xl transform transition-all scale-100 p-6
        ${darkMode ? 'bg-[#1e1e1e] text-white border border-white/10' : 'bg-white text-gray-900 border border-gray-200'}
      `}>
        <h3 className="text-lg font-medium mb-6">
          {t.renameTitle || 'Bu sohbeti yeniden adlandırın'}
        </h3>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`
              w-full bg-transparent border-b-2 p-2 outline-none text-base transition-colors mb-8
              ${darkMode 
                ? 'border-zinc-600 focus:border-blue-400 text-white placeholder-zinc-600' 
                : 'border-zinc-300 focus:border-blue-600 text-black placeholder-zinc-400'
              }
            `}
            placeholder={t.newChat}
          />

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                darkMode 
                  ? 'text-blue-400 hover:bg-blue-500/10' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              {t.cancel || 'İptal'}
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                darkMode 
                  ? 'text-blue-400 hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed' 
                  : 'text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {t.rename || 'Yeniden adlandır'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}