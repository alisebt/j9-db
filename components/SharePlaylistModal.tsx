
import React, { useState, useEffect } from 'react';
import type { Playlist } from '../App';
import type { User } from './UserContext';

type SharePlaylistModalProps = {
    isOpen: boolean;
    onClose: () => void;
    playlist: Playlist | null;
    allUsers: User[];
    onShare: (playlistId: string, sharedWith: string[]) => void;
};

const SharePlaylistModal: React.FC<SharePlaylistModalProps> = ({ isOpen, onClose, playlist, allUsers, onShare }) => {
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (playlist) {
            setSelectedUsers(new Set(playlist.sharedWith));
        }
    }, [playlist]);

    if (!isOpen || !playlist) return null;

    const handleToggleUser = (email: string) => {
        setSelectedUsers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(email)) {
                newSet.delete(email);
            } else {
                newSet.add(email);
            }
            return newSet;
        });
    };

    const handleSave = () => {
        onShare(playlist.id, Array.from(selectedUsers));
    };

    const usersToShow = allUsers.filter(u => u.email !== playlist.owner);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose} dir="rtl">
            <div className="bg-zinc-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-sky-400">اشتراک‌گذاری «{playlist.name}»</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                
                <div className="p-6 flex-grow overflow-y-auto space-y-4">
                    <p className="text-zinc-400 text-sm">کاربرانی را که می‌خواهید این لیست پخش را با آنها به اشتراک بگذارید، انتخاب کنید. آنها اجازه افزودن و حذف محتوا را خواهند داشت.</p>
                    <div className="space-y-2">
                        {usersToShow.length > 0 ? usersToShow.map(user => (
                            <label key={user.email} className="flex items-center justify-between p-3 rounded-md bg-zinc-700/50 cursor-pointer hover:bg-zinc-700">
                                <div>
                                    <p className="font-semibold text-zinc-100">{user.name}</p>
                                    <p className="text-sm text-zinc-400">{user.email}</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.has(user.email)}
                                    onChange={() => handleToggleUser(user.email)}
                                    className="form-checkbox h-5 w-5 rounded bg-zinc-600 border-zinc-500 text-sky-500 focus:ring-sky-500 cursor-pointer"
                                />
                            </label>
                        )) : (
                            <p className="text-zinc-500 text-center py-4">کاربر دیگری برای اشتراک‌گذاری وجود ندارد.</p>
                        )}
                    </div>
                </div>

                <footer className="p-4 border-t border-zinc-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-semibold transition-colors">لغو</button>
                    <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-900 font-bold transition-colors">ذخیره تغییرات</button>
                </footer>
            </div>
        </div>
    );
};

export default SharePlaylistModal;