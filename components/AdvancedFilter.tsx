
import React, { useState, useMemo } from 'react';
import MultiSelect from './MultiSelect';
import type { Playlist, AdvancedFilterState } from '../App';

type AdvancedFilterProps = {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: AdvancedFilterState) => void;
    allGlobalTags: string[];
    allPlaylists: Playlist[];
    allSourceFolders: string[];
    initialState: AdvancedFilterState;
};

const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif', 'mp4', 'webm', 'ogv', 'mpeg4', 'mp3', 'wav', 'pdf', 'json', 'txt', 'doc', 'docx', 'yaml', 'html', 'fountain'];

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
    isOpen,
    onClose,
    onApply,
    allGlobalTags,
    allPlaylists,
    allSourceFolders,
    initialState,
}) => {
    const [filters, setFilters] = useState<AdvancedFilterState>(initialState);

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleClear = () => {
        const clearedState = { tags: [], playlists: [], formats: [], folders: [] };
        setFilters(clearedState);
        onApply(clearedState);
        onClose();
    };

    const tagOptions = useMemo(() => allGlobalTags.map(tag => ({ value: tag, label: tag })), [allGlobalTags]);
    const playlistOptions = useMemo(() => allPlaylists.map(p => ({ value: p.id, label: p.name })), [allPlaylists]);
    const formatOptions = useMemo(() => SUPPORTED_FORMATS.map(f => ({ value: f, label: f.toUpperCase() })), []);
    const folderOptions = useMemo(() => allSourceFolders.map(f => ({ value: f, label: f })), [allSourceFolders]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-40 p-4 pt-[10vh]" onClick={onClose} dir="rtl">
            <div
                className="bg-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-sky-400">فیلتر پیشرفته</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                    <MultiSelect
                        label="تگ‌ها"
                        options={tagOptions}
                        selected={filters.tags}
                        onChange={(selected) => setFilters(f => ({ ...f, tags: selected }))}
                    />
                    <MultiSelect
                        label="لیست‌های پخش"
                        options={playlistOptions}
                        selected={filters.playlists}
                        onChange={(selected) => setFilters(f => ({ ...f, playlists: selected }))}
                    />
                    <MultiSelect
                        label="فرمت‌های فایل"
                        options={formatOptions}
                        selected={filters.formats}
                        onChange={(selected) => setFilters(f => ({ ...f, formats: selected }))}
                    />
                    <MultiSelect
                        label="پوشه‌های مبدا"
                        options={folderOptions}
                        selected={filters.folders}
                        onChange={(selected) => setFilters(f => ({ ...f, folders: selected }))}
                    />
                </div>
                 <div className="p-4 text-xs text-zinc-400 text-center bg-zinc-900/50">
                    نتایج شامل مواردی است که در <b className="text-zinc-300">تمام</b> تگ‌ها و لیست‌های پخش انتخاب شده باشند.
                </div>

                <footer className="p-4 border-t border-zinc-700 flex justify-between items-center">
                    <button onClick={handleClear} className="px-5 py-2 rounded-lg text-zinc-400 hover:bg-zinc-700 font-semibold transition-colors">
                        پاک کردن همه فیلترها
                    </button>
                    <button onClick={handleApply} className="px-6 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-900 font-bold transition-colors">
                        اعمال فیلترها
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AdvancedFilter;
