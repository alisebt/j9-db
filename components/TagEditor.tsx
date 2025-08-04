
import React, { useState } from 'react';

type TagEditorProps = {
  shotId: string;
  tags: string[];
  allGlobalTags: string[];
  onAddTag: (shotId: string, tag: string) => void;
  onRemoveTag: (shotId: string, tag: string) => void;
};

const TagEditor: React.FC<TagEditorProps> = ({ shotId, tags, allGlobalTags, onAddTag, onRemoveTag }) => {
  const [newTag, setNewTag] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const tagLimit = 20;

  const handleAdd = (tagToAdd: string) => {
    if (tagToAdd.trim() && tags.length < tagLimit) {
      onAddTag(shotId, tagToAdd);
      setNewTag('');
      setShowDropdown(false);
    }
  };
  
  const filteredAvailableTags = allGlobalTags.filter(globalTag => 
    !tags.includes(globalTag) && 
    globalTag.toLowerCase().includes(newTag.toLowerCase())
  );

  return (
    <div className="bg-zinc-800/60 rounded-b-lg flex flex-col h-full overflow-hidden">
      <h2 className="text-xl font-bold p-4 border-b border-zinc-700/80 text-zinc-300 flex-shrink-0 flex justify-between items-center">
        <span>تگ‌ها</span>
        <span className="text-sm font-normal text-zinc-400">{tags.length} / {tagLimit}</span>
      </h2>
      <div className="flex-grow p-4 overflow-auto scroll-hidden bg-zinc-900/50">
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span key={tag} className="group flex items-center bg-sky-800/70 text-sky-200 text-sm font-medium pl-2.5 pr-1 py-0.5 rounded-full">
                {tag}
                <button onClick={() => onRemoveTag(shotId, tag)} title="حذف تگ" className="ml-1.5 p-0.5 text-sky-200 hover:text-white transition-colors opacity-50 group-hover:opacity-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-center text-sm">هیچ تگی اضافه نشده است.</p>
        )}
      </div>
      <div className="p-4 border-t border-zinc-700/80 flex-shrink-0 bg-zinc-800/60 relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder={tags.length < tagLimit ? "افزودن تگ..." : "محدودیت تگ پر شده"}
            disabled={tags.length >= tagLimit}
            className="flex-grow bg-zinc-700/50 text-zinc-200 placeholder-zinc-400 rounded-lg px-3 py-2 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500 transition disabled:opacity-50"
            aria-label="New tag input"
          />
        </div>
        {showDropdown && filteredAvailableTags.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-700 border border-zinc-600 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
            {filteredAvailableTags.map(tag => (
              <div
                key={tag}
                onClick={() => handleAdd(tag)}
                className="px-4 py-2 hover:bg-sky-500/20 cursor-pointer text-zinc-200"
              >
                {tag}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagEditor;
