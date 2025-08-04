
import React from 'react';
import type { Shot } from '../App';

type ShotCardProps = {
  shot: Shot;
  tags: string[];
  size: 'sm' | 'md' | 'lg';
  onSelect: () => void;
  onTogglePlaylist: () => void;
  isInPlaylist: boolean;
  isPlaylistActive: boolean;
  isMultiSelectMode: boolean;
  isSelected: boolean;
  onToggleSelection: () => void;
};

const ShotCard: React.FC<ShotCardProps> = ({ shot, tags, size, onSelect, onTogglePlaylist, isInPlaylist, isPlaylistActive, isMultiSelectMode, isSelected, onToggleSelection }) => {
  const handleCardClick = () => {
    if (isMultiSelectMode) {
      onToggleSelection();
    } else {
      onSelect();
    }
  };
  
  const handlePlaylistClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    onTogglePlaylist();
  };
  
  const hasMedia = shot.imageFiles.length > 0 || shot.videoFiles.length > 0 || shot.audioFiles.length > 0 || shot.documentFiles.length > 0;
  
  const sizeClasses = {
      sm: 'h-24',
      md: 'h-40',
      lg: 'h-56'
  };

  const renderCover = () => {
      switch (shot.coverType) {
          case 'image':
              return <img src={shot.coverUrl} alt={shot.id} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" />;
          case 'video':
              return <video src={shot.coverUrl} muted playsInline disablePictureInPicture className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />;
          case 'audio':
              return <div className="w-full h-full flex items-center justify-center bg-zinc-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-12c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg></div>;
          case 'document':
              return <div className="w-full h-full flex items-center justify-center bg-zinc-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>;
          case 'none':
          default:
              return <div className="w-full h-full flex items-center justify-center bg-zinc-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.563C9.252 15 9 14.748 9 14.437V9.564z" /></svg></div>;
      }
  };


  return (
    <div 
        className={`group relative rounded-lg overflow-hidden bg-zinc-800 shadow-lg transform transition-all duration-300 ${isMultiSelectMode ? 'cursor-pointer' : 'cursor-pointer hover:-translate-y-1'}`} 
        onClick={handleCardClick}
    >
      {isMultiSelectMode && (
          <div className={`absolute top-2 left-2 z-20 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-sky-500 border-sky-400' : 'bg-black/30 border-zinc-400'}`}>
              {isSelected && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
          </div>
      )}
      <div className={`w-full ${sizeClasses[size]} bg-zinc-700 flex items-center justify-center transition-opacity duration-300 ${isSelected ? 'opacity-60' : 'opacity-100'}`}>
        {renderCover()}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white z-10">
        <h3 className="font-bold truncate text-sm">{shot.baseName}</h3>
        <p className="text-xs text-zinc-400 truncate">{shot.folderId}</p>
        {tags && tags.length > 0 && size !== 'sm' && (
            <div className="flex flex-wrap gap-1 mt-1 max-h-10 overflow-hidden">
                {tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded-full">{tag}</span>
                ))}
            </div>
        )}
      </div>
      {!isMultiSelectMode && (
        <button 
            onClick={handlePlaylistClick}
            disabled={!isPlaylistActive}
            title={!isPlaylistActive ? "برای افزودن، یک لیست پخش را فعال کنید" : (isInPlaylist ? "حذف از لیست پخش فعال" : "افزودن به لیست پخش فعال")}
            className={`absolute top-2 right-2 p-1.5 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 z-20
                ${isInPlaylist ? 'bg-amber-500/80 text-white' : 'bg-zinc-900/50 text-zinc-200 hover:bg-sky-500'}
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-zinc-900/50`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                {isInPlaylist 
                    ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    : <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                }
            </svg>
        </button>
      )}
    </div>
  );
};

export default ShotCard;
