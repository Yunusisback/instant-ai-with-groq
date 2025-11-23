import { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, MessageSquare, Trash2, PanelLeft, Grid, Code, MoreHorizontal, Pin, Edit2, Check, X, Eye } from 'lucide-react';

const getRelativeDateLabel = (dateString, language) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24));
  const isTr = language === 'tr';

  if (diffDays <= 1) return isTr ? 'Bugün' : 'Today';
  if (diffDays === 2) return isTr ? 'Dün' : 'Yesterday';
  if (diffDays <= 7) return isTr ? 'Önceki 7 Gün' : 'Previous 7 Days';
  if (diffDays <= 30) return isTr ? 'Önceki 30 Gün' : 'Previous 30 Days';
  
  return date.toLocaleString(isTr ? 'tr-TR' : 'en-US', { month: 'long' });
};

// Menü Butonu Bileşeni
const MenuButton = ({ onClick, icon, label, darkMode, danger }) => {
  const IconComponent = icon;
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-all duration-300 rounded-xl ${
        danger 
          ? 'text-red-400 hover:bg-red-500/5 hover:text-red-300' 
          : darkMode ? 'text-zinc-300 hover:bg-white/5 hover:text-white' : 'text-zinc-700 hover:bg-zinc-50'
      }`}
    >
      <IconComponent className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
};

// Navigasyon Öğesi Bileşeni
const NavItem = ({ icon, text, active, darkMode }) => {
  const IconComponent = icon;
  return (
    <button className={`
      w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap
      ${active 
        ? darkMode ? 'bg-white/10 text-white' : 'bg-zinc-100 text-black'
        : darkMode ? 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200' : 'text-zinc-600 hover:bg-zinc-50'
      }
    `}>
      <IconComponent className="w-4 h-4" />
      <span>{text}</span>
    </button>
  );
};

// Yan Çubuk Öğesi Bileşeni
const SidebarItem = ({ chat, active, onSelect, onDelete, onRenameStart, onPin, textMap, darkMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
        setShowDeleteConfirm(false); 
      }
    };
    if (isMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleMenuAction = (action, e) => {
    e.stopPropagation();
    if (action === 'delete_click') setShowDeleteConfirm(true);
    if (action === 'confirm_delete') onDelete(chat.id);
    if (action === 'rename') { onRenameStart(chat); setIsMenuOpen(false); }
    if (action === 'pin') { onPin(chat.id); setIsMenuOpen(false); }
    if (action === 'cancel_delete') setShowDeleteConfirm(false);
    if (action === 'toggle_menu') { setIsMenuOpen(!isMenuOpen); setShowDeleteConfirm(false); }
  };

  return (
    <div className="relative group">
      <button
        onClick={() => onSelect(chat.id)}
        className={`
          w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-300 whitespace-nowrap
          ${active 
            ? darkMode ? 'bg-white/10 text-white border border-white/20' : 'bg-zinc-100 text-black border border-zinc-300'
            : darkMode ? 'border border-white/5 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 hover:border-white/10' : 'border border-zinc-100 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-200'
          }
        `}
      >
        {chat.pinned && <Pin className="w-3.5 h-3.5 shrink-0 opacity-60 rotate-45" />}
        <span className="flex-1 text-sm font-medium truncate leading-tight">{chat.title}</span>
      </button>

      <div className={`absolute right-2 top-1/2 -translate-y-1/2 ${active || isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-all duration-300`}>
        <button
          onClick={(e) => handleMenuAction('toggle_menu', e)}
          className={`p-1.5 rounded-xl hover:bg-white/10 transition-all duration-300 ${darkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-600 hover:bg-zinc-100'}`}
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {isMenuOpen && (
        <div ref={menuRef} className={`absolute right-0 top-12 w-52 rounded-xl border z-50 overflow-hidden animate-in fade-in duration-300 ${darkMode ? 'bg-[#0a0a0b] border-white/10 backdrop-blur-sm' : 'bg-white border-zinc-200 backdrop-blur-sm'}`}>
          {showDeleteConfirm ? (
            <div className="p-4 flex flex-col gap-3">
              <p className={`text-sm text-center font-semibold leading-relaxed ${darkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>
                {textMap.confirmDelete}
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={(e) => handleMenuAction('confirm_delete', e)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all duration-300 flex items-center justify-center font-medium"
                  title="Evet"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Evet
                </button>
                <button
                  onClick={(e) => handleMenuAction('cancel_delete', e)}
                  className={`flex-1 px-3 py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center font-medium ${darkMode ? 'bg-white/10 text-zinc-300 hover:bg-white/20' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
                  title="İptal"
                >
                  <X className="w-4 h-4 mr-1.5" />
                  İptal
                </button>
              </div>
            </div>
          ) : (
            <div className="py-1">
              <MenuButton onClick={(e) => handleMenuAction('pin', e)} icon={Pin} label={chat.pinned ? textMap.unpin : textMap.pin} darkMode={darkMode} />
              <MenuButton onClick={(e) => handleMenuAction('rename', e)} icon={Edit2} label={textMap.rename} darkMode={darkMode} />
              <MenuButton onClick={(e) => handleMenuAction('delete_click', e)} icon={Trash2} label={textMap.delete} darkMode={darkMode} danger />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Sohbet Listesi Bölümü Bileşeni
const ChatListSection = ({ title, chats, ...props }) => {
  if (!chats || chats.length === 0) return null;
  return (
    <div className="mb-6">
      {title && <h3 className={`px-3 mb-3 text-xs font-semibold uppercase tracking-wider ${props.darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{title}</h3>}
      <div className="space-y-1.5">
        {chats.map(chat => <SidebarItem key={chat.id} chat={chat} {...props} />)}
      </div>
    </div>
  );
};

// Ana Sidebar Bileşeni
export default function Sidebar({ 
  showSidebar, 
  toggleSidebar, 
  darkMode, 
  t = {}, 
  chats = [], 
  activeChatId, 
  onNewChat, 
  onSelectChat, 
  onDeleteChat, 
  onRenameStart,
  onPinChat,
  onToggleSettings, 
  username 
}) {
  const currentLang = localStorage.getItem('language') || 'tr';
  
  const safeChats = Array.isArray(chats) ? chats : [];
  const pinnedChats = safeChats.filter(c => c.pinned);
  const otherChats = safeChats.filter(c => !c.pinned);

  const groupedChats = useMemo(() => {
    return otherChats.reduce((groups, chat) => {
      const label = getRelativeDateLabel(chat.date, currentLang);
      (groups[label] ??= []).push(chat);
      return groups;
    }, {});
  }, [otherChats, currentLang]);

  const textMap = {
    newChat: t?.newChat || "Yeni Sohbet",
    chats: t?.chats || "Sohbetler",
    projects: t?.projects || "Projeler",
    artifacts: t?.artifacts || "Artifacts",
    pinned: t?.pinned || "Sabitlenenler",
    recents: t?.recents || "Geçmiş",
    noRecents: t?.noRecentChats || "Geçmiş sohbet yok",
    freePlan: t?.freePlan || "Ücretsiz Plan",
    confirmDelete: t?.confirmDelete || "Emin misin?",
    unpin: t?.unpin || "Sabitlemeyi Kaldır",
    pin: t?.pin || "Sabitle",
    rename: t?.rename || "Yeniden Adlandır",
    delete: t?.delete || "Sil"
  };

  const itemProps = {
    activeChatId,
    onSelect: onSelectChat,
    onDelete: onDeleteChat,
    onRenameStart,
    onPin: onPinChat,
    textMap,
    darkMode
  };

  const staticLinks = [
    { icon: MessageSquare, text: textMap.chats, active: true },
    { icon: Grid, text: textMap.projects, active: false },
    { icon: Code, text: textMap.artifacts, active: false },
  ];

  return (
    <>
      {/* Ana Yan Çubuk */}
      <aside className={`
        fixed inset-y-0 left-0 z-60 flex flex-col border-r transition-all duration-300 ease-out font-sans backdrop-blur-xl
        ${darkMode ? 'bg-[#0a0a0b] border-white/5' : 'bg-white border-zinc-200'}
        ${showSidebar ? 'translate-x-0 w-[300px]' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-none'}
        overflow-hidden
      `}>
        
        <div className="w-[300px] h-full flex flex-col">
            
            {/* Üst Kısım - Logo ve Kapat Butonu */}
            <div className="px-4 pt-6 pb-4 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2 group cursor-pointer select-none">
                   <div className="w-9 h-9 flex items-center justify-center overflow-hidden opacity-90 text-orange-400 rounded-xl">
                      <Eye className="w-8 h-8" strokeWidth={1.5} />
                   </div>
                   <span className={`font-serif text-xl tracking-tight font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                     MyAI
                   </span>
                </div>
                <button onClick={toggleSidebar} className={`p-2 rounded-xl transition-all duration-300 ${darkMode ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'}`}>
                  <PanelLeft className="w-4 h-4" strokeWidth={1.5} />
                </button>
            </div>

            {/* Yeni Sohbet Butonu */}
            <div className="px-4 mt-4 mb-4">
                <button onClick={onNewChat} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${darkMode ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
                    <div className="bg-white/20 p-1 rounded-full shrink-0">
                        <Plus className="w-4 h-4 stroke-2" />
                    </div>
                    <span className="text-sm font-semibold">{textMap.newChat}</span>
                </button>
            </div>

            {/* Statik Navigasyon Linkleri */}
            <div className="px-4 py-2 mb-4">
                {staticLinks.map((link, idx) => (
                    <NavItem key={idx} icon={link.icon} text={link.text} active={link.active} darkMode={darkMode} />
                ))}
            </div>

            {/* Sohbet Listesi Bölümü */}
            <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin space-y-4">
                
                {/* Sabitlenmiş Sohbetler */}
                <ChatListSection 
                    title={textMap.pinned} 
                    chats={pinnedChats} 
                    {...itemProps} 
                />

                {/* Son Sohbetler Başlığı */}
                <h3 className={`text-sm font-semibold tracking-wide ${darkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>{textMap.recents}</h3>
                
                {safeChats.length === 0 ? (
                     <div className="py-6 text-center text-sm opacity-60 italic">{textMap.noRecents}</div>
                ) : (
                    Object.keys(groupedChats).map(groupLabel => (
                        <div key={groupLabel} className="space-y-2">

                            {/* Grup Başlığı */}
                            <div className="text-xs font-medium text-zinc-500 px-2 uppercase tracking-wider">{groupLabel}</div>
                            <div className="space-y-1.5">
                                {groupedChats[groupLabel].map(chat => (
                                    <SidebarItem key={chat.id} chat={chat} active={activeChatId === chat.id} {...itemProps} />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Alt Kısım - Kullanıcı Bilgileri */}
            <div className={`p-4 shrink-0 ${darkMode ? 'border-t border-white/5 bg-[#0a0a0b]' : 'border-t border-zinc-100 bg-white'}`}>
                 <button onClick={onToggleSettings} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${darkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-100'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-serif italic shrink-0 ${darkMode ? 'bg-white/10 text-white' : 'bg-zinc-200 text-zinc-800'}`}>
                        {username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                        <div className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{username}</div>
                        <div className={`text-xs truncate ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{textMap.freePlan}</div>
                    </div>
                 </button>
            </div>

        </div>
      </aside>

      {/* Mobil Arka Plan */}
      {showSidebar && <div className="fixed inset-0 bg-black/40 z-50 lg:hidden backdrop-blur-md" onClick={toggleSidebar} />}
    </>
  );
}