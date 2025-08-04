
import React, { useState } from 'react';

type BulkTagModalProps = {
    isOpen: boolean;
    onClose: () => void;
    allGlobalTags: string[];
    onApply: (tagsToAdd: string[], tagsToRemove: string[]) => void;
};

type TagState = 'ignore' | 'add' | 'remove';

const BulkTagModal: React.FC<BulkTagModalProps> = ({ isOpen, onClose, allGlobalTags, onApply }) => {
    const [tagStates, setTagStates] = useState<Record<string, TagState>>({});

    const handleTagClick = (tag: string) => {
        const currentState = tagStates[tag] || 'ignore';
        let nextState: TagState;
        switch(currentState) {
            case 'ignore': nextState = 'add'; break;
            case 'add': nextState = 'remove'; break;
            case 'remove': nextState = 'ignore'; break;
        }
        setTagStates(prev => ({ ...prev, [tag]: nextState }));
    };

    const handleApply = () => {
        const tagsToAdd = Object.entries(tagStates).filter(([, state]) => state === 'add').map(([tag]) => tag);
        const tagsToRemove = Object.entries(tagStates).filter(([, state]) => state === 'remove').map(([tag]) => tag);
        onApply(tagsToAdd, tagsToRemove);
        setTagStates({}); // Reset for next time
    };
    
    const getStateStyles = (state: TagState) => {
        switch(state) {
            case 'add': return 'bg-green-500/80 border-green-400 text-white';
            case 'remove': return 'bg-red-500/80 border-red-400 text-white line-through';
            case 'ignore':
            default: return 'bg-zinc-700/60 border-zinc-600 hover:bg-zinc-700 text-zinc-300';
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose} dir="rtl">
            <div className="bg-zinc-800 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-sky-400">تگ‌گذاری گروهی</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                
                <div className="p-6 flex-grow overflow-y-auto">
                    <p className="text-zinc-400 text-sm mb-4">روی تگ‌ها کلیک کنید تا حالت آنها تغییر کند: <span className="text-green-400">افزودن (+)</span>، <span className="text-red-400">حذف (-)</span>, یا <span className="text-zinc-500">نادیده گرفتن (پیش‌فرض)</span>.</p>
                    <div className="flex flex-wrap gap-2">
                        {allGlobalTags.map(tag => {
                            const state = tagStates[tag] || 'ignore';
                            return (
                                <button
                                    key={tag}
                                    onClick={() => handleTagClick(tag)}
                                    className={`relative px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${getStateStyles(state)}`}
                                >
                                    {tag}
                                    {state === 'add' && <span className="absolute -top-1 -right-1 bg-green-500 h-4 w-4 rounded-full text-white text-xs leading-4">+</span>}
                                    {state === 'remove' && <span className="absolute -top-1 -right-1 bg-red-500 h-4 w-4 rounded-full text-white text-xs leading-4">-</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <footer className="p-4 border-t border-zinc-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-semibold transition-colors">لغو</button>
                    <button onClick={handleApply} className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-900 font-bold transition-colors">اعمال تغییرات</button>
                </footer>
            </div>
        </div>
    );
};

export default BulkTagModal;
