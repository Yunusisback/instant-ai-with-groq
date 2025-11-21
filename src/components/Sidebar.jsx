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

const MenuButton = ({ onClick, icon, label, darkMode, danger }) => {
  const IconComponent = icon;
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors rounded-md ${
        danger 
          ? 'text-red-500 hover:bg-red-500/10' 
          : darkMode ? 'text-zinc-300 hover:bg-white/5' : 'text-zinc-700 hover:bg-zinc-100'
      }`}
    >
      <IconComponent className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
};


const NavItem = ({ icon, text, active, darkMode }) => {
  const IconComponent = icon;
  return (
    <button className={`
      w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
      ${active 
        ? darkMode ? 'bg-[#27272a] text-white' : 'bg-zinc-200 text-black'
        : darkMode ? 'text-zinc-400 hover:bg-[#27272a]/50 hover:text-zinc-200' : 'text-zinc-600 hover:bg-zinc-100'
      }
    `}>
      <IconComponent className="w-4 h-4" />
      <span>{text}</span>
    </button>
  );
};

const SidebarItem = ({ chat, active, onSelect, onDelete, onRenameStart, onPin, textMap, darkMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef(null);

  // Dışarı tıklama kontrolü
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
          w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors whitespace-nowrap
          ${active 
            ? darkMode ? 'bg-[#27272a] text-white' : 'bg-[#e4e4e7] text-black'
            : darkMode ? 'text-zinc-400 hover:bg-[#27272a]/50 hover:text-zinc-200' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
          }
        `}
      >
        {chat.pinned && <Pin className="w-3 h-3 shrink-0 opacity-50 rotate-45" />}
        <span className="flex-1 text-[13px] truncate leading-5">{chat.title}</span>
      </button>

      {/* 3 Nokta Butonu */}
      <div className={`absolute right-2 top-1/2 -translate-y-1/2 ${active || isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
        <button
          onClick={(e) => handleMenuAction('toggle_menu', e)}
          className={`p-1 rounded hover:bg-gray-500/20 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown Menü */}
      {isMenuOpen && (
        <div ref={menuRef} className={`absolute right-0 top-8 w-48 rounded-lg shadow-xl border z-100 overflow-hidden animate-fadeIn ${darkMode ? 'bg-[#18181b] border-white/10' : 'bg-white border-zinc-200'}`}>
          {showDeleteConfirm ? (
            <div className="p-3 flex flex-col gap-3">
              <p className={`text-[11px] text-center font-medium leading-tight ${darkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                {textMap.confirmDelete}
              </p>
              <div className="flex gap-2 justify-center">
                <button onClick={(e) => handleMenuAction('confirm_delete', e)} className="flex-1 p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center justify-center" title="Evet">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={(e) => handleMenuAction('cancel_delete', e)} className={`flex-1 p-1.5 rounded transition-colors flex items-center justify-center ${darkMode ? 'bg-white/10 text-zinc-300 hover:bg-white/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`} title="İptal">
                  <X className="w-4 h-4" />
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

// Sohbet listesi grubu 
const ChatListSection = ({ title, chats, ...props }) => {
  if (!chats || chats.length === 0) return null;
  return (
    <div className="mb-6">
      {title && <h3 className={`px-3 mt-2 mb-2 text-[10px] font-bold uppercase tracking-wider ${props.darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{title}</h3>}
      <div className="space-y-0.5">
        {chats.map(chat => <SidebarItem key={chat.id} chat={chat} {...props} />)}
      </div>
    </div>
  );
};

// ana bileşen

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
  
  // Veri 
  const safeChats = Array.isArray(chats) ? chats : [];
  const pinnedChats = safeChats.filter(c => c.pinned);
  const otherChats = safeChats.filter(c => !c.pinned);

  // Geçmiş sohbetleri grupla
  const groupedChats = useMemo(() => {
    return otherChats.reduce((groups, chat) => {
      const label = getRelativeDateLabel(chat.date, currentLang);
      (groups[label] ??= []).push(chat);
      return groups;
    }, {});
  }, [otherChats, currentLang]);

  // Metin Haritası 
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

  // Ortak Props
  const itemProps = {
    activeChatId,
    onSelect: onSelectChat,
    onDelete: onDeleteChat,
    onRenameStart,
    onPin: onPinChat,
    textMap,
    darkMode
  };

  // Statik Navigasyon Linkleri
  const staticLinks = [
    { icon: MessageSquare, text: textMap.chats, active: true },
    { icon: Grid, text: textMap.projects, active: false },
    { icon: Code, text: textMap.artifacts, active: false },
  ];

  return (
    <>
      <aside className={`
        fixed inset-y-0 left-0 z-60 flex flex-col border-r transition-all duration-300 ease-in-out font-sans
        ${darkMode ? 'bg-[#131316] border-white/5' : 'bg-[#f7f7f8] border-zinc-200'}
        ${showSidebar ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-none'}
        overflow-hidden
      `}>
        
        <div className="w-[280px] h-full flex flex-col">
            
            {/* Header */}
            <div className="px-4 pt-6 pb-2 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2 group cursor-pointer select-none">
                   <div className="w-7 h-7 flex items-center justify-center overflow-hidden opacity-90 text-orange-500">
                      <Eye className="w-full h-full" strokeWidth={1.5} />
                   </div>
                   <span className={`font-serif text-xl tracking-tight font-medium ${darkMode ? 'text-[#e4e4e7]' : 'text-[#333]'}`}>
                     MyAI
                   </span>
                </div>
                <button onClick={toggleSidebar} className={`p-2 rounded-md transition-colors ${darkMode ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5' : 'text-zinc-400 hover:text-zinc-600 hover:bg-black/5'}`}>
                  <PanelLeft className="w-5 h-5" strokeWidth={1.5} />
                </button>
            </div>

            {/* yeni sohbet butonu */}
            <div className="px-3 mt-6 mb-3">
                <button onClick={onNewChat} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group whitespace-nowrap ${darkMode ? 'bg-[#bf4835] hover:bg-[#a83f2e] text-white shadow-lg shadow-orange-900/20' : 'bg-[#d95f45] hover:bg-[#c4553e] text-white shadow-sm'}`}>
                    <div className="bg-white/20 p-0.5 rounded-full shrink-0">
                        <Plus className="w-4 h-4 stroke-3" />
                    </div>
                    <span className="text-sm font-medium">{textMap.newChat}</span>
                </button>
            </div>

            {/* Static Links */}
            <div className="px-2 py-1 space-y-1">
                {staticLinks.map((link, idx) => (
                    <NavItem key={idx} icon={link.icon} text={link.text} active={link.active} darkMode={darkMode} />
                ))}
            </div>

            {/*  Sohbet listesi bölümü */}
            <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
                
                {/* Sabitlenenler */}
                <ChatListSection 
                    title={textMap.pinned} 
                    chats={pinnedChats} 
                    {...itemProps} 
                />

                {/* Geçmiş Başlığı */}
                <h3 className={`px-3 mt-2 mb-2 text-xs font-medium ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{textMap.recents}</h3>
                
                {safeChats.length === 0 ? (
                     <div className="px-4 text-xs opacity-40 italic">{textMap.noRecents}</div>
                ) : (
                    Object.keys(groupedChats).map(groupLabel => (
                        <div key={groupLabel} className="mb-4">
                            <div className="space-y-0.5">
                                {groupedChats[groupLabel].map(chat => (
                                    <SidebarItem key={chat.id} chat={chat} active={activeChatId === chat.id} {...itemProps} />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className={`p-3 mt-auto shrink-0 ${darkMode ? 'bg-[#131316]' : 'bg-[#f7f7f8]'}`}>
                 <button onClick={onToggleSettings} className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors group whitespace-nowrap ${darkMode ? 'hover:bg-[#27272a]' : 'hover:bg-zinc-200'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-serif italic shrink-0 ${darkMode ? 'bg-[#3f3f46] text-white' : 'bg-[#d4d4d8] text-black'}`}>
                        {username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                        <div className={`text-sm font-medium truncate ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{username}</div>
                        <div className={`text-[10px] truncate ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{textMap.freePlan}</div>
                    </div>
                 </button>
            </div>

        </div>
      </aside>

      {showSidebar && <div className="fixed inset-0 bg-black/50 z-50 lg:hidden backdrop-blur-sm" onClick={toggleSidebar} />}
    </>
  );
}