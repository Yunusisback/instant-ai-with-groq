import { useState, useRef, useEffect, useMemo } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';
import Settings from './components/Settings';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import RenameModal from './components/RenameModal';
import { sendMessage } from './api/aiService';
import { translations } from './constants/translations';

// Dosya okuma  
const readFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file); // Resimler için Base64
    } else {
      reader.readAsText(file); 
    }
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

function App() {
  const [showSidebar, setShowSidebar] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'tr');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : true;
  });
  
  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem('chatHistory');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Sohbet geçmişi yüklenemedi, sıfırlanıyor.", e);
      return [];
    }
  });
  
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [username, setUsername] = useState(localStorage.getItem('username') || 'Misafir');
  const [selectedModel, setSelectedModel] = useState('llama-3.1-8b-instant');

  const [renameModalData, setRenameModalData] = useState({ isOpen: false, chat: null });

  const messagesEndRef = useRef(null);
  const tokenQueueRef = useRef([]);
  const typingIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isSubmittingRef = useRef(false);

  const t = translations[language] || translations['tr'];

  const messages = useMemo(() => {
    const chat = chats.find(c => c.id === activeChatId);
    return chat ? chat.messages : [];
  }, [chats, activeChatId]);

  function handleNewChat() {
    const newId = Date.now();
    const welcome = language === 'tr' ? 'Merhaba! Size nasıl yardımcı olabilirim?' : 'Hello! How can I help you?';
    const newChat = {
      id: newId,
      title: language === 'tr' ? 'Yeni Sohbet' : 'New Chat',
      date: new Date().toISOString(),
      pinned: false,
      messages: [{ role: 'assistant', content: welcome }]
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newId);
    if (window.innerWidth < 1024) setShowSidebar(false);
  }

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  useEffect(() => localStorage.setItem('chatHistory', JSON.stringify(chats)), [chats]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (chats.length === 0 && !activeChatId) {
        handleNewChat();
      } else if (chats.length > 0 && !activeChatId) {
        setActiveChatId(chats[0].id);
      }
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const toggleLanguage = () => {
    const newLang = language === 'tr' ? 'en' : 'tr';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
  };

  const handleUpdateUsername = (newName) => {
    setUsername(newName);
    localStorage.setItem('username', newName);
  };

  const handleDeleteChat = (id) => {
    const remaining = chats.filter(c => c.id !== id);
    setChats(remaining);
    if (activeChatId === id) {
      remaining.length > 0 ? setActiveChatId(remaining[0].id) : handleNewChat();
    }
  };


  const handleRenameStart = (chat) => {
    setRenameModalData({ isOpen: true, chat });
  };

  const handleRenameSave = (newTitle) => {
    if (renameModalData.chat) {
      setChats(prev => prev.map(c => 
        c.id === renameModalData.chat.id ? { ...c, title: newTitle } : c
      ));
    }
  };

  const handlePinChat = (id) => {
    setChats(prev => prev.map(chat => 
      chat.id === id ? { ...chat, pinned: !chat.pinned } : chat
    ));
  };

  const handleClearChat = () => {
    setChats(prev => prev.map(c =>
      c.id === activeChatId ? { ...c, messages: [{ role: 'assistant', content: t.welcomeTitle }] } : c
    ));
    setShowSettings(false);
  };

  const handleExportChat = () => {
    const text = messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fileName = chats.find(c => c.id === activeChatId)?.title || 'chat';
    a.href = url;
    a.download = `${fileName}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    clearInterval(typingIntervalRef.current);
    setLoading(false);
    isSubmittingRef.current = false;
  };


  const handleSend = async (file = null) => {

    // Eğer ne input ne de dosya varsa dur
    if ((!input.trim() && !file) || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setLoading(true);

    let currentChatId = activeChatId;
    if (!currentChatId) {
      handleNewChat();
      currentChatId = Date.now();
    }

    clearInterval(typingIntervalRef.current);
    tokenQueueRef.current = [];

    // Dosya İşleme ve İçerik Oluşturma
    let uiContent = input;
    try {
      if (file) {
        const fileData = await readFile(file);
        if (file.type.startsWith('image/')) {

          // Resim ise mmarkdown olarak ekle 
          uiContent = `${input}\n\n![Görsel](${fileData})`;
        } else {

          // Metin ise kod bloğu içinde ekle
          uiContent = `${input}\n\n--- ${file.name} ---\n\`\`\`\n${fileData}\n\`\`\``;
        }
      }
    } catch (error) {
      console.error("Dosya okuma hatası:", error);
      uiContent += "\n\n[Dosya yüklenirken hata oluştu]";
    }

    const userMessage = { role: 'user', content: uiContent };

    // UI Güncelleme
    setChats(prev => prev.map(c => {
      if (c.id === currentChatId) {
        const isFirst = c.messages.length === 1;

        // Başlık yoksa ve input boşsa dosya yazsın
        let titleText = input.slice(0, 30);
        if (!titleText && file) titleText = "Dosya Gönderimi";
        
        const title = isFirst ? titleText + (input.length > 30 ? '...' : '') : c.title;
        return {
          ...c,
          title,
          messages: [...c.messages, userMessage, { role: 'assistant', content: '' }]
        };
      }
      return c;
    }));

    setInput('');
    abortControllerRef.current = new AbortController();

    // Yazma efekti
    typingIntervalRef.current = setInterval(() => {
      if (tokenQueueRef.current.length > 0) {
        const char = tokenQueueRef.current.shift();
        setChats(prev => prev.map(chat => {
          if (chat.id === currentChatId) {
            const msgs = [...chat.messages];
            msgs[msgs.length - 1].content += char;
            return { ...chat, messages: msgs };
          }
          return chat;
        }));
      }
    }, 10);

    try {
      const chat = chats.find(c => c.id === currentChatId) || { messages: [] };
      
      // API için Mesajları Hazırla (Resim varsa Vision formatına çevir)
      const apiMessages = [...chat.messages, userMessage].map(m => {

        // Eğer mesajda base64 resim varsa API  için uygun JSON formatına çevir
        if (m.role === 'user' && m.content.includes('data:image')) {
           const imageRegex = /!\[.*?\]\((data:image\/.*?;base64,.*?)\)/;
           const match = m.content.match(imageRegex);
           if (match) {
             const imageUrl = match[1];
             const textContent = m.content.replace(match[0], '').trim();
             return {
               role: m.role,
               content: [
                 { type: "text", text: textContent || "Bu görsel hakkında ne düşünüyorsun?" },
                 { type: "image_url", image_url: { url: imageUrl } }
               ]
             };
           }
        }
        return { role: m.role, content: m.content };
      });

      await sendMessage(
        apiMessages,
        selectedModel,
        (token) => tokenQueueRef.current.push(...token.split('')),
        () => {
          const check = setInterval(() => {
            if (tokenQueueRef.current.length === 0) {
              clearInterval(check);
              clearInterval(typingIntervalRef.current);
              setLoading(false);
              isSubmittingRef.current = false; 
            }
          }, 100);
        },
        abortControllerRef.current.signal
      );
    } catch (err) {
      if (err.name !== 'AbortError') console.error('API Hatası:', err);
      clearInterval(typingIntervalRef.current);
      setLoading(false);
      isSubmittingRef.current = false; 
    }
  };

  return (
    <div className={`flex h-screen transition-colors duration-200 ${darkMode ? 'bg-[#09090b] text-white' : 'bg-white text-gray-900'}`}>
      <Sidebar
        showSidebar={showSidebar}
        toggleSidebar={() => setShowSidebar(!showSidebar)}
        darkMode={darkMode}
        t={t}
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={(id) => {
          setActiveChatId(id);
          if (window.innerWidth < 1024) setShowSidebar(false);
        }}
        onDeleteChat={handleDeleteChat}
        onRenameStart={handleRenameStart} 
        onPinChat={handlePinChat}
        onToggleSettings={() => setShowSettings(true)}
        username={username}
      />

  
      <div className={`
        flex-1 flex flex-col min-w-0 relative
        transition-all duration-300 ease-in-out
        ${showSidebar ? 'lg:ml-[280px]' : 'lg:ml-0'}
      `}>
        <Header
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          language={language}
          toggleLanguage={toggleLanguage}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          onExportChat={handleExportChat}
          onToggleSettings={() => setShowSettings(true)}
          chats={chats}
          activeChatId={activeChatId}
        />

        <Settings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          darkMode={darkMode}
          t={t}
          username={username}
          onUpdateUsername={handleUpdateUsername}
          onClearChat={handleClearChat}
        />

        <RenameModal 
          isOpen={renameModalData.isOpen}
          onClose={() => setRenameModalData({ ...renameModalData, isOpen: false })}
          onRename={handleRenameSave}
          initialValue={renameModalData.chat?.title}
          t={t}
          darkMode={darkMode}
        />

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            {messages.length <= 1 ? (
              <WelcomeScreen t={t} darkMode={darkMode} onPromptSelect={setInput} />
            ) : (
              <div className="space-y-10 sm:space-y-12">
                {messages.slice(1).map((msg, i) => (
                  <div key={i} className="animate-fadeIn" style={{ animationDelay: `${i * 0.05}s` }}>
                    <ChatMessage message={msg.content} role={msg.role} darkMode={darkMode} />
                  </div>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <ChatInput
          input={input}
          setInput={setInput}
          onSend={handleSend}  
          onStop={handleStop}
          loading={loading}
          darkMode={darkMode}
          selectedModel={selectedModel}
          placeholderText={t.inputPlaceholder}
        />
      </div>
    </div>
  );
}

export default App;