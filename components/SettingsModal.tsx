
import React, { useState, useEffect, useRef } from 'react';
import { useUser, User } from './UserContext';
import type { AppBackup, Playlists } from '../App';

type SettingsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    allTags: string[];
    onAddTag: (tag: string) => void;
    onRenameTag: (oldTag: string, newTag: string) => void;
    onDeleteTag: (tag: string) => void;
    tagLimit: number;
    onBackup: () => void;
    onRestore: (backup: AppBackup) => void;
    allPlaylists: Playlists;
    allUsers: User[];
    onAdminDeletePlaylist: (playlistId: string) => void;
    sourceFolders: string[];
    onFoldersAdded: (files: File[]) => void;
    onFolderRemoved: (folderName: string) => void;
};

type Tab = 'sources' | 'users' | 'tags' | 'playlists' | 'backup';

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, allTags, onAddTag, onRenameTag, onDeleteTag, tagLimit,
    onBackup, onRestore, allPlaylists, allUsers, onAdminDeletePlaylist,
    sourceFolders, onFoldersAdded, onFolderRemoved
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('sources');

    if (!isOpen) return null;
    
    const renderContent = () => {
        switch(activeTab) {
            case 'sources': return <SourceFoldersTab sourceFolders={sourceFolders} onFoldersAdded={onFoldersAdded} onFolderRemoved={onFolderRemoved} />;
            case 'users': return <UsersTab />;
            case 'tags': return <TagsTab allTags={allTags} onAddTag={onAddTag} onRenameTag={onRenameTag} onDeleteTag={onDeleteTag} tagLimit={tagLimit} />;
            case 'playlists': return <PlaylistsTab playlists={allPlaylists} users={allUsers} onDelete={onAdminDeletePlaylist} />;
            case 'backup': return <BackupTab onBackup={onBackup} onRestore={onRestore} />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose} dir="rtl">
            <div className="bg-zinc-800 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-zinc-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-sky-400">تنظیمات ادمین</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </header>
                
                <div className="flex border-b border-zinc-700 flex-shrink-0 overflow-x-auto">
                    <TabButton id="sources" label="پوشه‌های مبدا" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton id="users" label="کاربران" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton id="tags" label="تگ‌ها" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton id="playlists" label="لیست‌های پخش" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton id="backup" label="پشتیبان‌گیری" activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>

                <div className="flex-grow overflow-y-auto">
                    {renderContent()}
                </div>

                <footer className="p-4 border-t border-zinc-700 flex justify-end flex-shrink-0">
                    <button onClick={onClose} className="px-5 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-semibold transition-colors">
                        بستن
                    </button>
                </footer>
            </div>
        </div>
    );
};

const TabButton: React.FC<{id: Tab, label: string, activeTab: Tab, setActiveTab: (tab: Tab) => void}> = ({ id, label, activeTab, setActiveTab }) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 flex-shrink-0 ${
            activeTab === id
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'
        }`}
    >
        {label}
    </button>
);

const SourceFoldersTab: React.FC<{
    sourceFolders: string[];
    onFoldersAdded: (files: File[]) => void;
    onFolderRemoved: (folderName: string) => void;
}> = ({ sourceFolders, onFoldersAdded, onFolderRemoved }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            onFoldersAdded(Array.from(files));
        }
        // Reset input to allow selecting the same folder again if removed
        event.target.value = '';
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h3 className="text-lg font-bold text-zinc-200 mb-2">مدیریت پوشه‌های مبدا (جلسه فعلی)</h3>
                <div className="p-4 bg-zinc-700/30 rounded-lg space-y-4">
                    <p className="text-sm text-zinc-400">پوشه‌های محتوای خود را اضافه کنید. این لیست پس از بستن تب مرورگر پاک می‌شود.</p>
                     <div className="space-y-2">
                        {sourceFolders.map(folderName => (
                            <div key={folderName} className="flex items-center justify-between p-3 rounded-md bg-zinc-700/50">
                                <p className="font-semibold text-zinc-100 font-mono">{folderName}</p>
                                <button onClick={() => onFolderRemoved(folderName)} title="حذف پوشه" className="p-2 text-zinc-400 hover:text-red-400 rounded-full hover:bg-red-500/10"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                        ))}
                         {sourceFolders.length === 0 && <p className="text-center text-zinc-500 py-4">هیچ پوشه‌ای اضافه نشده است.</p>}
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-2 bg-sky-500 text-zinc-900 font-bold rounded-lg hover:bg-sky-400">افزودن پوشه جدید</button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        webkitdirectory=""
                        directory=""
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            </div>
             <div className="p-4 bg-green-900/30 rounded-lg">
                <p className="text-green-300 text-sm">
                    پوشه‌های مبدا در پایگاه داده ذخیره می‌شوند و پس از باز کردن دوباره برنامه نیز در دسترس هستند.
                </p>
            </div>
        </div>
    );
};

const UsersTab: React.FC = () => {
    const { users, addUser, removeUser } = useUser();
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState<User['role']>('user');

    const handleAddUser = () => {
        if (newUserEmail.trim() && newUserName.trim()) {
            addUser({ email: newUserEmail.trim(), name: newUserName.trim(), role: newUserRole });
            setNewUserEmail('');
            setNewUserName('');
        }
    };
    
    return (
        <div className="p-6 space-y-6">
            <div>
                <h3 className="text-lg font-bold text-zinc-200 mb-2">افزودن کاربر جدید</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-zinc-700/30 rounded-lg">
                    <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="ایمیل کاربر" className="sm:col-span-2 bg-zinc-700/80 text-zinc-200 placeholder-zinc-400 rounded-md px-3 py-2 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                    <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="نام نمایشی" className="sm:col-span-2 bg-zinc-700/80 text-zinc-200 placeholder-zinc-400 rounded-md px-3 py-2 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                    <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as User['role'])} className="bg-zinc-700/80 text-zinc-200 rounded-md px-3 py-2 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500">
                        <option value="user">کاربر</option>
                        <option value="admin">ادمین</option>
                    </select>
                    <button onClick={handleAddUser} disabled={!newUserEmail.trim() || !newUserName.trim()} className="sm:col-span-3 w-full px-4 py-2 bg-sky-500 text-zinc-900 font-bold rounded-lg hover:bg-sky-400 disabled:bg-zinc-600">افزودن</button>
                </div>
            </div>
            <div>
                <h3 className="text-lg font-bold text-zinc-200 mb-2">کاربران فعلی</h3>
                <div className="space-y-2">
                    {users.map(user => (
                        <div key={user.email} className="flex items-center justify-between p-3 rounded-md bg-zinc-700/50">
                            <div>
                                <p className="font-semibold text-zinc-100">{user.name}</p>
                                <p className="text-sm text-zinc-400">{user.email} - <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-600">{user.role}</span></p>
                            </div>
                            {user.email !== 'admin@j9.app' && (
                                <button onClick={() => window.confirm(`آیا از حذف کاربر «${user.name}» مطمئن هستید؟`) && removeUser(user.email)} title="حذف کاربر" className="p-2 text-zinc-400 hover:text-red-400 rounded-full hover:bg-red-500/10"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const TagsTab: React.FC<Pick<SettingsModalProps, 'allTags' | 'onAddTag' | 'onRenameTag' | 'onDeleteTag' | 'tagLimit'>> = ({ allTags, onAddTag, onRenameTag, onDeleteTag, tagLimit }) => {
    const [newTag, setNewTag] = useState('');
    const [editingTag, setEditingTag] = useState<{ old: string; current: string } | null>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

     useEffect(() => {
        if (editingTag && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingTag]);
    
    const handleAdd = () => {
        if (newTag.trim() && allTags.length < tagLimit) {
            onAddTag(newTag.trim());
            setNewTag('');
        }
    };
    
    const handleSaveRename = () => {
        if (editingTag) {
            const { old, current } = editingTag;
            const trimmedCurrent = current.trim();
            if (trimmedCurrent && trimmedCurrent.toLowerCase() !== old.toLowerCase()) {
                onRenameTag(old, trimmedCurrent);
            }
            setEditingTag(null);
        }
    };
    
    const handleDelete = (tag: string) => {
        if (window.confirm(`آیا از حذف تگ «${tag}» از کل برنامه مطمئن هستید؟ این عمل غیرقابل بازگشت است.`)) {
            onDeleteTag(tag);
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="p-4 bg-zinc-700/30 rounded-lg">
                 <p className="text-zinc-400 text-sm mb-2">تگ جدید (مجموع: {allTags.length} / {tagLimit})</p>
                 <div className="flex gap-2">
                    <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="نام تگ جدید..." disabled={allTags.length >= tagLimit} className="flex-grow bg-zinc-700/80 text-zinc-200 placeholder-zinc-400 rounded-lg px-3 py-2 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500 transition disabled:opacity-50"/>
                    <button onClick={handleAdd} disabled={!newTag.trim() || allTags.length >= tagLimit} className="px-4 py-2 bg-sky-500 text-zinc-900 font-bold rounded-lg hover:bg-sky-400 transition-all duration-300 disabled:bg-zinc-600 disabled:cursor-not-allowed">
                        ایجاد تگ
                    </button>
                </div>
            </div>
            <div className="space-y-2">
               {allTags.length > 0 ? allTags.map(tag => (
                    <div key={tag} className="flex items-center justify-between p-2 rounded-md bg-zinc-700/50">
                       {editingTag?.old === tag ? (
                            <input ref={editInputRef} type="text" value={editingTag.current} onChange={e => setEditingTag({ ...editingTag, current: e.target.value })} onBlur={handleSaveRename} onKeyDown={e => e.key === 'Enter' && handleSaveRename()} className="bg-zinc-600 text-zinc-100 text-sm font-medium px-2 py-1 rounded-md border border-sky-500 outline-none flex-grow"/>
                        ) : <span className="text-zinc-200">{tag}</span> }
                        <div className="flex items-center gap-2">
                            <button onClick={() => setEditingTag({ old: tag, current: tag })} title="تغییر نام" className="p-1 text-zinc-400 hover:text-sky-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg></button>
                            <button onClick={() => handleDelete(tag)} title="حذف" className="p-1 text-zinc-400 hover:text-red-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                    </div>
               )) : <p className="text-zinc-500 text-center py-8">هیچ تگی تعریف نشده است.</p>}
            </div>
        </div>
    );
};

const PlaylistsTab: React.FC<{playlists: Playlists; users: User[]; onDelete: (playlistId: string) => void}> = ({ playlists, users, onDelete }) => {
    const userMap = new Map(users.map(u => [u.email, u.name]));
    const playlistArray = Object.values(playlists).sort((a,b) => a.name.localeCompare(b.name));

    return (
         <div className="p-6 space-y-4">
             <h3 className="text-lg font-bold text-zinc-200">مدیریت لیست‌های پخش ({playlistArray.length})</h3>
             <div className="space-y-2">
                {playlistArray.length > 0 ? playlistArray.map(p => (
                    <div key={p.id} className="p-3 bg-zinc-700/50 rounded-lg">
                        <div className="flex justify-between items-start">
                           <div>
                            <p className="font-bold text-zinc-100">{p.name} <span className="text-sm font-normal text-zinc-400">({p.shotIds.length} آیتم)</span></p>
                            <p className="text-sm text-zinc-300">سازنده: <span className="font-semibold">{userMap.get(p.owner) || p.owner}</span></p>
                           </div>
                           <button onClick={() => onDelete(p.id)} title="حذف" className="p-2 text-zinc-400 hover:text-red-400 rounded-full hover:bg-red-500/10 flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                        {p.sharedWith.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-zinc-600/50">
                                <p className="text-xs text-zinc-400">اشتراک گذاشته شده با:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {p.sharedWith.map(email => (
                                        <span key={email} className="text-xs bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded-full">{userMap.get(email) || email}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )) : <p className="text-zinc-500 text-center py-8">هیچ لیست پخشی وجود ندارد.</p>}
             </div>
         </div>
    );
};

const BackupTab: React.FC<Pick<SettingsModalProps, 'onBackup' | 'onRestore'>> = ({ onBackup, onRestore }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File is not readable");
                const backupData = JSON.parse(text);
                onRestore(backupData);
            } catch (err) {
                console.error("Failed to parse backup file", err);
                alert("فایل پشتیبان نامعتبر است.");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    };

    return (
        <div className="p-6 space-y-6">
            <div className="p-4 bg-zinc-700/30 rounded-lg space-y-4">
                <h3 className="text-lg font-bold text-zinc-200">گرفتن خروجی پشتیبان</h3>
                <p className="text-sm text-zinc-400">از تمام تنظیمات برنامه (کاربران، لیست‌های پخش، تگ‌ها و کاورهای شات) یک فایل JSON خروجی بگیرید. این فایل شامل خود محتوای رسانه‌ای نمی‌شود.</p>
                <button onClick={onBackup} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 w-full">خروجی گرفتن از تنظیمات</button>
            </div>
             <div className="p-4 bg-zinc-700/30 rounded-lg space-y-4">
                <h3 className="text-lg font-bold text-zinc-200">بازیابی از پشتیبان</h3>
                <p className="text-sm text-zinc-400">یک فایل پشتیبان JSON را برای بازنویسی تمام تنظیمات فعلی برنامه وارد کنید. این عمل غیرقابل بازگشت است و صفحه مجددا بارگذاری می شود.</p>
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 w-full">وارد کردن فایل پشتیبان...</button>
                <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </div>
        </div>
    );
}

export default SettingsModal;