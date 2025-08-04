
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import MediaViewer from './components/MediaViewer';
import PromptViewer from './components/JsonViewer';
import ShotCard from './components/ShotCard';
import TagEditor from './components/TagEditor';
import SettingsModal from './components/SettingsModal';
import SharePlaylistModal from './components/SharePlaylistModal';
import BulkTagModal from './components/BulkTagModal';
import { useUser } from './components/UserContext';
import PlaylistManager from './components/PlaylistManager';
import AdvancedFilter from './components/AdvancedFilter';


// Augment React's HTMLAttributes to include non-standard directory attributes
declare module 'react' {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
    multiple?: boolean;
  }
}

export type PromptFile = { name: string; content: string; type: 'json' | 'text' | 'doc' | 'docx' | 'yaml' | 'html' | 'fountain'; };
export type MediaFile = { name: string; url: string; };

export type Shot = {
  id: string; // sourceFolderName/subfolder/baseName
  folderId: string; // sourceFolderName
  baseName: string;
  imageFiles: MediaFile[];
  videoFiles: MediaFile[];
  audioFiles: MediaFile[];
  documentFiles: MediaFile[];
  promptFiles: PromptFile[];
  coverUrl: string;
  coverType: 'image' | 'video' | 'audio' | 'document' | 'none';
};

export type Playlist = { 
  id: string; 
  name: string; 
  owner: string; // owner's email
  shotIds: string[]; 
  sharedWith: string[]; // array of user emails
};
export type Playlists = Record<string, Playlist>;
export type Tags = Record<string, string[]>; // Maps shot.id to array of tags
export type ShotCovers = Record<string, string>; // Maps shot.id to cover file name
export type AppBackup = {
  playlists: Playlists;
  tags: Tags;
  allGlobalTags: string[];
  shotCovers: ShotCovers;
  users: ReturnType<typeof useUser>['users'];
};

export type AdvancedFilterState = {
    tags: string[];
    playlists: string[];
    formats: string[];
    folders: string[];
};


const App: React.FC = () => {
    
  const { currentUser, users, setUsers, setCurrentUser } = useUser();

  const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
  };

  const [allShots, setAllShots] = useState<Shot[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);
  
  const [playlists, setPlaylists] = useState<Playlists>(() => loadFromStorage('j9_playlists_v3', {}));
  const [tags, setTags] = useState<Tags>(() => loadFromStorage('j9_tags_v2', {}));
  const [allGlobalTags, setAllGlobalTags] = useState<string[]>(() => loadFromStorage('j9_all_tags_v2', []));
  const [shotCovers, setShotCovers] = useState<ShotCovers>(() => loadFromStorage('j9_shotCovers_v2', {}));
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(() => loadFromStorage('j9_activePlaylistId', null));
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => loadFromStorage('j9_isSidebarOpen', true));

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [invertTagFilter, setInvertTagFilter] = useState(false);
  const [invertPlaylistFilter, setInvertPlaylistFilter] = useState(false);
  const [advancedFilter, setAdvancedFilter] = useState<AdvancedFilterState>({ tags: [], playlists: [], formats: [], folders: [] });

  
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedShotIds, setSelectedShotIds] = useState<Set<string>>(new Set());

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modals and inputs state
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [renamingPlaylist, setRenamingPlaylist] = useState<{ id: string; newName: string } | null>(null);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [playlistToShare, setPlaylistToShare] = useState<Playlist | null>(null);
  const [isBulkTagModalOpen, setBulkTagModalOpen] = useState(false);
  const [isAdvancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  const [gallerySize, setGallerySize] = useState<'sm' | 'md' | 'lg'>('md');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Effect for saving state to localStorage
  useEffect(() => {
    try {
        window.localStorage.setItem('j9_playlists_v3', JSON.stringify(playlists));
        window.localStorage.setItem('j9_tags_v2', JSON.stringify(tags));
        window.localStorage.setItem('j9_all_tags_v2', JSON.stringify(allGlobalTags));
        window.localStorage.setItem('j9_shotCovers_v2', JSON.stringify(shotCovers));
        window.localStorage.setItem('j9_activePlaylistId', JSON.stringify(activePlaylistId));
        window.localStorage.setItem('j9_isSidebarOpen', JSON.stringify(isSidebarOpen));
    } catch (error) {
        console.error("Failed to save state to localStorage:", error);
    }
  }, [playlists, tags, allGlobalTags, shotCovers, activePlaylistId, isSidebarOpen]);
  
  useEffect(() => {
    if (renamingPlaylist && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingPlaylist]);

  useEffect(() => {
    document.title = activeFolder ? `${activeFolder} - J9` : 'J9';
  }, [activeFolder]);

  const sourceFolders = useMemo(() => {
    return [...new Set(allShots.map(s => s.folderId))].sort();
  }, [allShots]);

  const processFiles = useCallback(async (files: File[]): Promise<Shot[]> => {
      const groupedFiles: Map<string, { sourceFolder: string; files: File[] }> = new Map();
      
      // Group files by their parent directory and base name
      for (const file of files) {
          const path = (file as any).webkitRelativePath || file.name;
          const pathParts = path.split('/');
          if (pathParts.length < 2) continue; // Skip files in root
          const sourceFolder = pathParts[0];
          const fileName = pathParts[pathParts.length - 1];
          const baseName = fileName.split('.').slice(0, -1).join('.');
          if (!baseName) continue; // Skip files like .DS_Store
          
          const shotGroupFolder = pathParts.slice(1, -1).join('/'); // Path inside the source folder
          const key = `${sourceFolder}/${shotGroupFolder ? shotGroupFolder + '/' : ''}${baseName}`;
          
          if (!groupedFiles.has(key)) groupedFiles.set(key, { sourceFolder, files: [] });
          groupedFiles.get(key)!.files.push(file);
      }

      const savedCovers = loadFromStorage<ShotCovers>('j9_shotCovers_v2', {});
      const shotPromises = Array.from(groupedFiles.entries()).map(async ([id, group]): Promise<Shot | null> => {
        const { sourceFolder, files } = group;
        const pathWithinSource = id.replace(`${sourceFolder}/`, '');
        const baseName = pathWithinSource.split('/').pop() || '';
        
        const imageFiles: MediaFile[] = [];
        const videoFiles: MediaFile[] = [];
        const audioFiles: MediaFile[] = [];
        const documentFiles: MediaFile[] = [];
        const promptFiles: PromptFile[] = [];
        
        const PROMPT_EXTS = ['json', 'txt', 'doc', 'docx', 'yaml', 'html', 'fountain'];
        const IMG_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif'];
        const VID_EXTS = ['mp4', 'webm', 'ogv', 'mpeg4'];
        const AUD_EXTS = ['mp3', 'wav'];
        const DOC_EXTS = ['pdf'];

        await Promise.all(files.map(async file => {
          const extension = file.name.split('.').pop()?.toLowerCase() || "";
          if (IMG_EXTS.includes(extension)) imageFiles.push({ name: file.name, url: URL.createObjectURL(file) });
          else if (VID_EXTS.includes(extension)) videoFiles.push({ name: file.name, url: URL.createObjectURL(file) });
          else if (AUD_EXTS.includes(extension)) audioFiles.push({ name: file.name, url: URL.createObjectURL(file) });
          else if (DOC_EXTS.includes(extension)) documentFiles.push({ name: file.name, url: URL.createObjectURL(file) });
          else if (PROMPT_EXTS.includes(extension)) {
            let type: PromptFile['type'] = 'text';
            if (extension === 'json') type = 'json';
            else if (PROMPT_EXTS.slice(2).includes(extension)) type = extension as PromptFile['type'];
            promptFiles.push({ name: file.name, content: await file.text(), type });
          }
        }));

        imageFiles.sort((a,b)=> a.name.localeCompare(b.name));
        videoFiles.sort((a,b)=> a.name.localeCompare(b.name));
        audioFiles.sort((a,b)=> a.name.localeCompare(b.name));

        let coverUrl = '', coverType: Shot['coverType'] = 'none', coverFile: MediaFile | undefined;
        const savedCoverName = savedCovers[id];
        const allMedia = [...imageFiles, ...videoFiles, ...audioFiles, ...documentFiles];

        if (savedCoverName) coverFile = allMedia.find(f => f.name === savedCoverName);
        if (!coverFile) coverFile = imageFiles[0] || videoFiles[0] || audioFiles[0] || documentFiles[0];
        
        if (coverFile) {
            coverUrl = coverFile.url;
            if (videoFiles.some(f => f.url === coverUrl)) coverType = 'video';
            else if (imageFiles.some(f => f.url === coverUrl)) coverType = 'image';
            else if (audioFiles.some(f => f.url === coverUrl)) coverType = 'audio';
            else if (documentFiles.some(f => f.url === coverUrl)) coverType = 'document';
        }

        return { id, folderId: sourceFolder, baseName, imageFiles, videoFiles, audioFiles, documentFiles, promptFiles, coverUrl, coverType };
      });

      const loadedShots = (await Promise.all(shotPromises)).filter((s): s is Shot => s !== null);
      return loadedShots;
  }, []);

  const handleFoldersAdded = useCallback(async (files: File[]) => {
      if (!files || files.length === 0) return;
      
      const firstFile = files[0];
      const relativePath = (firstFile as any).webkitRelativePath;
      if (!relativePath) {
          setError("مرورگر شما اطلاعات مسیر فایل را ارائه نمی‌دهد. لطفا از گوگل کروم یا مایکروسافت اج استفاده کنید.");
          return;
      }
      
      const sourceFolderName = relativePath.split('/')[0];
      if (sourceFolders.includes(sourceFolderName)) {
          alert(`پوشه «${sourceFolderName}» قبلا اضافه شده است.`);
          return;
      }

      setIsLoading(true);
      setError(null);
      try {
          const newShots = await processFiles(files);
          setAllShots(prev => [...prev, ...newShots].sort((a, b) => a.id.localeCompare(b.id)));
      } catch (err) {
          setError('خطا در پردازش فایل‌های جدید.');
          console.error(err);
      } finally {
          setIsLoading(false);
      }
  }, [processFiles, sourceFolders]);

  const handleFolderRemoved = useCallback((folderNameToRemove: string) => {
      if (!window.confirm(`آیا از حذف پوشه «${folderNameToRemove}» از این جلسه مطمئن هستید؟`)) return;
      setAllShots(prev => prev.filter(shot => shot.folderId !== folderNameToRemove));
      if (activeFolder === folderNameToRemove) {
        setActiveFolder(null);
      }
  }, [activeFolder]);

  const shotsInView = useMemo(() => {
    if (activeFolder) {
      return allShots.filter(shot => shot.folderId === activeFolder);
    }
    return allShots;
  }, [allShots, activeFolder]);

  const filteredShots = useMemo(() => {
    let shotsToFilter = shotsInView;

    // --- Sidebar Playlist filtering ---
    if (activePlaylistId && playlists[activePlaylistId]) {
      const playlistShotIds = new Set(playlists[activePlaylistId].shotIds);
      shotsToFilter = shotsToFilter.filter(shot => {
        const isInPlaylist = playlistShotIds.has(shot.id);
        return invertPlaylistFilter ? !isInPlaylist : isInPlaylist;
      });
    }
    
    // --- Sidebar Tag filtering ---
    if (selectedTags.size > 0) {
        shotsToFilter = shotsToFilter.filter(shot => {
            const shotTags = new Set(tags[shot.id] || []);
            const hasAllSelectedTags = Array.from(selectedTags).every(st => shotTags.has(st));
            return invertTagFilter ? !hasAllSelectedTags : hasAllSelectedTags;
        });
    }

    // --- Advanced filtering ---
    const { tags: advTags, playlists: advPlaylists, formats: advFormats, folders: advFolders } = advancedFilter;
    if (advFolders.length > 0) {
        const folderSet = new Set(advFolders);
        shotsToFilter = shotsToFilter.filter(shot => folderSet.has(shot.folderId));
    }
    if (advTags.length > 0) {
        shotsToFilter = shotsToFilter.filter(shot => {
            const shotTags = new Set(tags[shot.id] || []);
            return advTags.every(t => shotTags.has(t));
        });
    }
    if (advPlaylists.length > 0) {
        shotsToFilter = shotsToFilter.filter(shot => {
            return advPlaylists.every(pid => playlists[pid]?.shotIds.includes(shot.id));
        });
    }
    if (advFormats.length > 0) {
        const formatSet = new Set(advFormats.map(f => f.toLowerCase()));
        shotsToFilter = shotsToFilter.filter(shot => {
            const allFiles = [...shot.imageFiles, ...shot.videoFiles, ...shot.audioFiles, ...shot.documentFiles, ...shot.promptFiles];
            return allFiles.some(file => {
                const ext = file.name.split('.').pop()?.toLowerCase();
                return ext && formatSet.has(ext);
            });
        });
    }

    // --- Search query filtering ---
    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    if (lowerCaseQuery) {
        shotsToFilter = shotsToFilter.filter(shot => {
            const shotTags = tags[shot.id] || [];
            const promptContent = shot.promptFiles.map(p => p.content).join(' ').toLowerCase();
            return shot.id.toLowerCase().includes(lowerCaseQuery) ||
                   promptContent.includes(lowerCaseQuery) ||
                   shotTags.some(tag => tag.toLowerCase().includes(lowerCaseQuery));
        });
    }
    return shotsToFilter;
  }, [shotsInView, searchQuery, tags, selectedTags, invertTagFilter, activePlaylistId, playlists, invertPlaylistFilter, advancedFilter]);
  
  const userVisiblePlaylists = useMemo(() => {
    return Object.values(playlists)
      .filter(p => p.owner === currentUser.email || p.sharedWith.includes(currentUser.email))
      .sort((a,b) => a.name.localeCompare(b.name));
  }, [playlists, currentUser]);

  const shotPlaylistMemberships = useMemo(() => {
    if (!selectedShot) return new Set<string>();
    return new Set(
        Object.values(playlists)
            .filter(p => p.shotIds.includes(selectedShot.id))
            .map(p => p.id)
    );
  }, [selectedShot, playlists]);

  const hasEditPermission = useCallback((playlist: Playlist) => {
    return playlist.owner === currentUser.email || playlist.sharedWith.includes(currentUser.email);
  }, [currentUser.email]);

  // Playlist Handlers
  const handleCreatePlaylist = () => {
    const name = newPlaylistName.trim();
    if (name && !Object.values(playlists).some(p => p.name.toLowerCase() === name.toLowerCase())) {
      const newId = crypto.randomUUID();
      const newPlaylist: Playlist = { id: newId, name, owner: currentUser.email, shotIds: [], sharedWith: [] };
      setPlaylists(prev => ({ ...prev, [newId]: newPlaylist }));
      setActivePlaylistId(newId);
      setNewPlaylistName('');
    } else if (name) {
      alert("یک لیست پخش با این نام از قبل وجود دارد.");
    }
  };

  const handleDeletePlaylist = (playlistId: string) => {
    const playlist = playlists[playlistId];
    if (!playlist) return;

    if (playlist.owner !== currentUser.email && currentUser.role !== 'admin') {
        alert("فقط سازنده یا ادمین می‌تواند این لیست پخش را حذف کند.");
        return;
    }
    if (!window.confirm(`آیا از حذف لیست پخش «${playlist.name}» مطمئن هستید؟`)) return;
    
    setPlaylists(prev => {
        const newPlaylists = { ...prev };
        delete newPlaylists[playlistId];
        return newPlaylists;
    });

    if (activePlaylistId === playlistId) setActivePlaylistId(null);
  };
  
  const handleRenamePlaylist = () => {
    if (!renamingPlaylist) return;
    const { id, newName } = renamingPlaylist;
    const trimmedName = newName.trim();
    
    if (trimmedName && trimmedName !== playlists[id].name) {
      if (Object.values(playlists).some(p => p.id !== id && p.name.toLowerCase() === trimmedName.toLowerCase())) {
        alert("یک لیست پخش با این نام از قبل وجود دارد.");
        setRenamingPlaylist(null); // Keep input open with old name on error? or close it? close it.
        return;
      } else {
        setPlaylists(prev => ({
            ...prev,
            [id]: { ...prev[id], name: trimmedName }
        }));
      }
    }
    setRenamingPlaylist(null);
  };

  const handleDuplicatePlaylist = (playlistToCopy: Playlist) => {
    let newName = `${playlistToCopy.name} (کپی)`;
    let i = 2;
    // Ensure the new name is unique
    while (Object.values(playlists).some(p => p.name === newName)) {
        newName = `${playlistToCopy.name} (کپی ${i++})`;
    }

    const newId = crypto.randomUUID();
    const newPlaylist: Playlist = {
        ...playlistToCopy,
        id: newId,
        name: newName,
        owner: currentUser.email, // New copy is owned by the current user
        sharedWith: [], // Sharing is not copied
    };
    setPlaylists(prev => ({...prev, [newId]: newPlaylist}));
    setActivePlaylistId(newId);
  }

  const handleToggleShotInPlaylist = useCallback((shotId: string, playlistId: string) => {
    const playlist = playlists[playlistId];
    if (!playlist || !hasEditPermission(playlist)) {
        alert("شما اجازه تغییر این لیست پخش را ندارید.");
        return;
    }
    setPlaylists(prev => {
        const p = prev[playlistId];
        const newShotIds = p.shotIds.includes(shotId) ? p.shotIds.filter(id => id !== shotId) : [...p.shotIds, shotId];
        return { ...prev, [playlistId]: { ...p, shotIds: newShotIds } };
    });
  }, [playlists, currentUser.email, hasEditPermission]);

  const handleBulkAddToPlaylist = (playlistId: string) => {
    const playlist = playlists[playlistId];
    if (!playlist || !hasEditPermission(playlist)) {
         alert("شما اجازه افزودن به این لیست پخش را ندارید.");
         return;
    }
    setPlaylists(prev => {
        const p = prev[playlistId];
        const newShotIds = Array.from(new Set([...p.shotIds, ...selectedShotIds]));
        return {...prev, [playlistId]: {...p, shotIds: newShotIds}}
    });
    setSelectedShotIds(new Set());
    setMultiSelectMode(false);
  };

  const handleSharePlaylist = (playlistId: string, sharedWith: string[]) => {
    setPlaylists(prev => ({
      ...prev,
      [playlistId]: { ...prev[playlistId], sharedWith }
    }));
    setShareModalOpen(false);
  };

  // Tag Handlers
  const handleBulkTag = (tagsToAdd: string[], tagsToRemove: string[]) => {
    setTags(prev => {
      const newTags = {...prev};
      for (const shotId of selectedShotIds) {
        const currentTags = new Set(newTags[shotId] || []);
        tagsToAdd.forEach(tag => currentTags.add(tag));
        tagsToRemove.forEach(tag => currentTags.delete(tag));
        if (currentTags.size > 0) {
          newTags[shotId] = Array.from(currentTags).sort();
        } else {
          delete newTags[shotId];
        }
      }
      return newTags;
    });
    setBulkTagModalOpen(false);
    setMultiSelectMode(false);
    setSelectedShotIds(new Set());
  };

  const handleAddGlobalTag = (tag: string) => {
    if (currentUser.role !== 'admin') return;
    const cleanTag = tag.trim();
    if (cleanTag && !allGlobalTags.map(t=>t.toLowerCase()).includes(cleanTag.toLowerCase())) {
        setAllGlobalTags(prev => [...prev, cleanTag].sort());
    }
  };
  
  const handleDeleteGlobalTag = (tagToDelete: string) => {
     if (currentUser.role !== 'admin') return;
      setTags(prevTags => {
        const newTags = { ...prevTags };
        Object.keys(newTags).forEach(shotId => {
          newTags[shotId] = newTags[shotId].filter(t => t !== tagToDelete);
          if (newTags[shotId].length === 0) {
            delete newTags[shotId];
          }
        });
        return newTags;
      });
      setAllGlobalTags(prev => prev.filter(t => t !== tagToDelete));
  };
  const handleRenameGlobalTag = (oldTag: string, newTag: string) => {
    if (currentUser.role !== 'admin' || !newTag.trim() || oldTag === newTag) return;
     if (allGlobalTags.map(t => t.toLowerCase()).includes(newTag.trim().toLowerCase())) {
        alert("تگی با این نام وجود دارد.");
        return;
    }
    setTags(prevTags => {
        const newTags = { ...prevTags };
        Object.keys(newTags).forEach(shotId => {
            const index = newTags[shotId].indexOf(oldTag);
            if (index > -1) {
                const updatedTags = new Set(newTags[shotId]);
                updatedTags.delete(oldTag);
                updatedTags.add(newTag);
                newTags[shotId] = Array.from(updatedTags).sort();
            }
        });
        return newTags;
    });
    setAllGlobalTags(prev => prev.map(t => t === oldTag ? newTag : t).sort());
  };
  const handleAddTagToShot = useCallback((shotId: string, tag: string) => {
    setTags(prev => {
        const currentTags = prev[shotId] || [];
        if (currentTags.includes(tag)) return prev;
        return { ...prev, [shotId]: [...currentTags, tag].sort() };
    });
  }, []);
  const handleRemoveTagFromShot = useCallback((shotId: string, tagToRemove: string) => {
    setTags(prev => {
        const currentTags = prev[shotId] || [];
        const newTags = currentTags.filter(t => t !== tagToRemove);
        if (newTags.length === 0) {
            const nextState = { ...prev };
            delete nextState[shotId];
            return nextState;
        }
        return { ...prev, [shotId]: newTags };
    });
  }, []);
  const handleToggleSelection = (shotId: string) => {
    setSelectedShotIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(shotId)) {
            newSet.delete(shotId);
        } else {
            newSet.add(shotId);
        }
        return newSet;
    });
  };
  const handleSetCover = useCallback((shotId: string, coverMediaName: string) => {
     setShotCovers(prev => ({...prev, [shotId]: coverMediaName}));
     setAllShots(prevShots => prevShots.map(shot => {
        if (shot.id === shotId) {
            const allMedia = [...shot.imageFiles, ...shot.videoFiles, ...shot.audioFiles, ...shot.documentFiles];
            const newCoverFile = allMedia.find(f => f.name === coverMediaName);
            if (newCoverFile) {
                let newCoverType: Shot['coverType'] = 'none';
                if(shot.imageFiles.some(f => f.name === coverMediaName)) newCoverType = 'image';
                else if (shot.videoFiles.some(f => f.name === coverMediaName)) newCoverType = 'video';
                else if (shot.audioFiles.some(f => f.name === coverMediaName)) newCoverType = 'audio';
                else if (shot.documentFiles.some(f => f.name === coverMediaName)) newCoverType = 'document';

                return { ...shot, coverUrl: newCoverFile.url, coverType: newCoverType };
            }
        }
        return shot;
     }));
  }, []);
  
  // Backup & Restore
  const handleBackup = () => {
    const backupData: AppBackup = {
      playlists,
      tags,
      allGlobalTags,
      shotCovers,
      users,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `j9_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleRestore = (backup: AppBackup) => {
    if (!window.confirm("آیا مطمئن هستید؟ با بازیابی، تمام تنظیمات فعلی بازنویسی خواهد شد.")) return;
    setPlaylists(backup.playlists || {});
    setTags(backup.tags || {});
    setAllGlobalTags(backup.allGlobalTags || []);
    setShotCovers(backup.shotCovers || {});
    setUsers(backup.users || []); // Assuming UserProvider's setUsers updates local state and context
    setSettingsModalOpen(false);
    alert("تنظیمات با موفقیت بازیابی شد. صفحه مجددا بارگذاری می شود.");
    window.location.reload();
  };

  const gallerySizeClasses = {
    sm: 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12',
    md: 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8',
    lg: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
  };
  
  const activePlaylist = activePlaylistId ? playlists[activePlaylistId] : null;
  const isInActivePlaylist = useCallback((shotId: string) => activePlaylist?.shotIds.includes(shotId) ?? false, [activePlaylist]);

  return (
    <div className="flex h-screen bg-zinc-900 text-zinc-200 overflow-hidden">
        <aside className={`flex-shrink-0 flex flex-col bg-zinc-800/50 border-l border-zinc-700/80 transition-all duration-300 ${isSidebarOpen ? 'w-80' : 'w-0'}`}>
            <div className="w-80 h-full flex flex-col overflow-hidden">
                {/* --- Logo --- */}
                <div className="p-4 border-b border-zinc-700/80 flex items-center justify-center">
                    <img src="/logo.png" alt="J9 Logo" className="h-12" />
                </div>
                {/* --- Management Section --- */}
                <div className="p-4 border-b border-zinc-700/80">
                   <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-sky-400">مدیریت</h2>
                        {currentUser.role === 'admin' && (
                            <button onClick={() => setSettingsModalOpen(true)} className="p-2 rounded-md hover:bg-zinc-700" title="تنظیمات">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </button>
                        )}
                    </div>
                    <select value={currentUser.email} onChange={e => setCurrentUser(users.find(u => u.email === e.target.value)!)} className="w-full bg-zinc-700/50 text-zinc-200 rounded-lg px-3 py-2 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500">
                        {users.map(user => <option key={user.email} value={user.email}>{user.name} ({user.role})</option>)}
                    </select>
                </div>
                
                {/* --- Playlists Section --- */}
                <div className="p-4 border-b border-zinc-700/80 flex flex-col min-h-[30%]">
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="text-xl font-bold text-sky-400">لیست‌های پخش</h2>
                       <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                           <input type="checkbox" checked={invertPlaylistFilter} onChange={e => setInvertPlaylistFilter(e.target.checked)} className="form-checkbox h-4 w-4 rounded bg-zinc-700 border-zinc-600 text-sky-500 focus:ring-sky-500" disabled={!activePlaylistId} />
                           مخفی کردن
                       </label>
                    </div>
                    <div className="flex gap-2 mb-4">
                      <input type="text" value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreatePlaylist()} placeholder="نام لیست پخش جدید..." className="flex-grow bg-zinc-700/50 text-zinc-200 placeholder-zinc-400 rounded-lg px-3 py-2 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"/>
                      <button onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()} className="px-4 py-2 bg-sky-500 text-zinc-900 font-bold rounded-lg hover:bg-sky-400 disabled:bg-zinc-600">ایجاد</button>
                    </div>
                    <div className="flex-grow overflow-y-auto scroll-hidden -mr-2 pr-2 space-y-1">
                      {userVisiblePlaylists.map(playlist => (
                          renamingPlaylist?.id === playlist.id ? (
                            <input 
                              key={playlist.id}
                              ref={renameInputRef}
                              type="text"
                              value={renamingPlaylist.newName}
                              onChange={(e) => setRenamingPlaylist({ ...renamingPlaylist, newName: e.target.value })}
                              onBlur={handleRenamePlaylist}
                              onKeyDown={(e) => e.key === 'Enter' && handleRenamePlaylist()}
                              className="w-full bg-zinc-600 text-zinc-100 font-semibold px-3 py-2 rounded-md border border-sky-500 outline-none"
                            />
                          ) : (
                          <div key={playlist.id} className={`group flex items-center justify-between rounded-md transition-colors ${activePlaylistId === playlist.id ? 'bg-sky-500/20' : 'hover:bg-zinc-700/50'}`}>
                              <button onClick={() => setActivePlaylistId(prev => prev === playlist.id ? null : playlist.id)} className={`flex-grow text-right px-3 py-2 truncate ${activePlaylistId === playlist.id ? 'text-sky-300 font-semibold' : 'text-zinc-300'}`}>
                                  <div className="font-semibold">{playlist.name} <span className="text-xs font-normal">({playlist.shotIds.length})</span></div>
                                  <div className="text-xs text-zinc-400">سازنده: {users.find(u => u.email === playlist.owner)?.name || 'ناشناس'}</div>
                              </button>
                              {playlist.owner === currentUser.email && (
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                                  <button onClick={() => setRenamingPlaylist({ id: playlist.id, newName: playlist.name })} title="تغییر نام" className="p-1 text-zinc-400 hover:text-sky-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg></button>
                                  <button onClick={() => { setPlaylistToShare(playlist); setShareModalOpen(true); }} title="اشتراک گذاری" className="p-1 text-zinc-400 hover:text-sky-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367 2.684z" /></svg></button>
                                  <button onClick={() => handleDuplicatePlaylist(playlist)} title="کپی" className="p-1 text-zinc-400 hover:text-green-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                                  <button onClick={() => handleDeletePlaylist(playlist.id)} title="حذف" className="p-1 text-zinc-400 hover:text-red-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                              )}
                          </div>
                          )
                      ))}
                    </div>
                </div>
                
                {/* --- Tag Filter Section --- */}
                <div className="p-4 flex flex-col flex-grow min-h-0">
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="text-xl font-bold text-sky-400">فیلتر با تگ</h2>
                       <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                           <input type="checkbox" checked={invertTagFilter} onChange={e => setInvertTagFilter(e.target.checked)} className="form-checkbox h-4 w-4 rounded bg-zinc-700 border-zinc-600 text-sky-500 focus:ring-sky-500" />
                           مخفی کردن
                       </label>
                    </div>
                    <div className="flex-grow overflow-y-auto scroll-hidden -mr-2 pr-2">
                      <div className="flex flex-wrap gap-2">
                          {allGlobalTags.map(tag => (
                            <button key={tag} onClick={() => setSelectedTags(p => {const s=new Set(p); s.has(tag)?s.delete(tag):s.add(tag); return s;})} className={`px-3 py-1 text-sm font-medium rounded-full border transition-colors ${selectedTags.has(tag) ? 'bg-sky-500 border-sky-500 text-zinc-900' : 'bg-zinc-700/60 border-zinc-600 hover:bg-zinc-700 text-zinc-300'}`}>
                                {tag}
                            </button>
                          ))}
                      </div>
                    </div>
                </div>
            </div>
        </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 bg-sky-500/80 hover:bg-sky-500 text-white rounded-full p-2 z-30 transition-transform hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform transition-transform" style={{transform: isSidebarOpen ? 'rotate(180deg)' : ''}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>

        {selectedShot ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* --- Detail View --- */}
            <header className="p-4 flex items-center justify-between bg-zinc-800/50 border-b border-zinc-700/80 flex-shrink-0">
              <button onClick={() => setSelectedShot(null)} className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-zinc-700 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                بازگشت
              </button>
              <h1 className="text-xl font-bold text-sky-400 truncate px-4">{selectedShot.id}</h1>
              <div></div>
            </header>
             <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-3 gap-1 p-1 overflow-hidden">
              <div className="lg:col-span-3 xl:col-span-2 bg-black rounded-lg min-h-0">
                <MediaViewer shotId={selectedShot.id} imageFiles={selectedShot.imageFiles} videoFiles={selectedShot.videoFiles} audioFiles={selectedShot.audioFiles} documentFiles={selectedShot.documentFiles} coverUrl={selectedShot.coverUrl} onSetCover={handleSetCover} />
              </div>
              <div className="lg:col-span-2 xl:col-span-1 bg-zinc-800/60 rounded-lg flex flex-col overflow-hidden min-h-0">
                <div className="flex-[3_3_0%] min-h-0"><PromptViewer promptFiles={selectedShot.promptFiles} /></div>
                <div className="flex-[2_2_0%] min-h-0 flex flex-col divide-y divide-zinc-700/80">
                  <div className="flex-1 min-h-0"><TagEditor shotId={selectedShot.id} tags={tags[selectedShot.id] || []} allGlobalTags={allGlobalTags} onAddTag={handleAddTagToShot} onRemoveTag={handleRemoveTagFromShot} /></div>
                  <div className="flex-1 min-h-0"><PlaylistManager shotId={selectedShot.id} playlists={userVisiblePlaylists} memberships={shotPlaylistMemberships} onToggle={(playlistId) => handleToggleShotInPlaylist(selectedShot.id, playlistId)} hasEditPermission={hasEditPermission} /></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
             {/* --- Gallery View Header --- */}
            <header className="p-4 bg-zinc-800/50 border-b border-zinc-700/80 flex items-center gap-4 flex-wrap">
              <div className="flex-grow flex items-center gap-2">
                <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="جستجو در همه موارد..." className="flex-grow bg-zinc-700/50 text-zinc-200 placeholder-zinc-400 rounded-lg px-4 py-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500 min-w-[200px]" />
                <button onClick={() => setAdvancedFilterOpen(true)} className="flex-shrink-0 px-4 py-2 bg-zinc-700 rounded-lg font-semibold hover:bg-zinc-600 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>
                  فیلترها
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">اندازه:</span>
                <button onClick={() => setGallerySize('sm')} className={`p-1 rounded ${gallerySize === 'sm' ? 'bg-sky-500' : 'bg-zinc-700'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg></button>
                <button onClick={() => setGallerySize('md')} className={`p-1 rounded ${gallerySize === 'md' ? 'bg-sky-500' : 'bg-zinc-700'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2V6a2 2 0 00-2-2H4zm10 0a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2V6a2 2 0 00-2-2h-4zM4 14a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2H4z" clipRule="evenodd" /></svg></button>
                <button onClick={() => setGallerySize('lg')} className={`p-1 rounded ${gallerySize === 'lg' ? 'bg-sky-500' : 'bg-zinc-700'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" /></svg></button>
              </div>
              <button onClick={() => {setMultiSelectMode(!multiSelectMode); setSelectedShotIds(new Set());}} className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${multiSelectMode ? 'bg-sky-500 text-white' : 'bg-zinc-700'}`}>
                {multiSelectMode ? 'لغو انتخاب' : 'انتخاب چندتایی'}
              </button>
            </header>
            
            {/* --- Source Folder Bar --- */}
            {sourceFolders.length > 0 && (
              <div className="flex-shrink-0 p-2 border-b border-zinc-700/80 bg-zinc-900/50">
                 <div className="flex items-center gap-2 overflow-x-auto scroll-hidden">
                    <button onClick={() => setActiveFolder(null)} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors flex-shrink-0 ${!activeFolder ? 'bg-sky-500/20 text-sky-300' : 'text-zinc-400 hover:bg-zinc-700/50'}`}>همه ({allShots.length})</button>
                    {sourceFolders.map(folder => {
                      const count = allShots.filter(s => s.folderId === folder).length;
                      return <button key={folder} onClick={() => setActiveFolder(folder)} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors flex-shrink-0 ${activeFolder === folder ? 'bg-sky-500/20 text-sky-300' : 'text-zinc-400 hover:bg-zinc-700/50'}`}>{folder} ({count})</button>
                    })}
                 </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <svg className="animate-spin h-12 w-12 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="text-zinc-400 mt-4">در حال بارگذاری محتوا...</p>
                  </div>
              ) : allShots.length > 0 ? (
                <>
                  <div className={`grid ${gallerySizeClasses[gallerySize]} gap-4`}>
                    {filteredShots.map(shot => (
                      <ShotCard key={shot.id} shot={shot} size={gallerySize} tags={tags[shot.id] || []} onSelect={() => setSelectedShot(shot)} onTogglePlaylist={() => activePlaylistId && handleToggleShotInPlaylist(shot.id, activePlaylistId)} isInPlaylist={isInActivePlaylist(shot.id)} isPlaylistActive={!!activePlaylistId && hasEditPermission(playlists[activePlaylistId])} isMultiSelectMode={multiSelectMode} isSelected={selectedShotIds.has(shot.id)} onToggleSelection={() => handleToggleSelection(shot.id)} />
                    ))}
                  </div>
                  {(filteredShots.length === 0 && (searchQuery || selectedTags.size > 0 || activePlaylistId)) && <p className="text-center text-zinc-500 mt-8">موردی با فیلترهای اعمال شده یافت نشد.</p>}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <h1 className="text-3xl font-bold text-sky-400 mb-4">به J9 خوش آمدید</h1>
                  <p className="text-zinc-400 mb-6 max-w-md">هنوز هیچ پوشه محتوایی تنظیم نشده است. برای شروع، ادمین باید از بخش تنظیمات، یک یا چند پوشه مبدا را اضافه کند.</p>
                  {currentUser.role === 'admin' && (
                    <button onClick={() => setSettingsModalOpen(true)} className="px-6 py-3 bg-sky-500 text-zinc-900 font-bold rounded-lg hover:bg-sky-400 text-lg">
                      رفتن به تنظیمات
                    </button>
                  )}
                </div>
              )}
               {error && <p className="text-center text-red-400 mt-4">{error}</p>}
            </div>

            {multiSelectMode && selectedShotIds.size > 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-800/90 backdrop-blur-sm rounded-lg shadow-2xl p-2 flex items-center gap-2 z-20">
                    <span className="text-white font-bold px-2">{selectedShotIds.size} مورد انتخاب شد</span>
                    <div className="w-px h-8 bg-zinc-600"></div>
                    <select onChange={e => handleBulkAddToPlaylist(e.target.value)} defaultValue="" className="bg-zinc-700 text-white rounded-md p-2">
                        <option value="" disabled>افزودن به لیست پخش...</option>
                        {userVisiblePlaylists.filter(p => hasEditPermission(p)).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <button onClick={() => setBulkTagModalOpen(true)} className="bg-zinc-700 text-white rounded-md p-2 hover:bg-zinc-600">تگ‌گذاری...</button>
                    <button onClick={() => setSelectedShotIds(new Set())} className="p-2 text-zinc-300 hover:text-white" title="لغو انتخاب"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
                </div>
            )}
          </div>
        )}
      </main>
      
      {currentUser.role === 'admin' && <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} allTags={allGlobalTags} onAddTag={handleAddGlobalTag} onRenameTag={handleRenameGlobalTag} onDeleteTag={handleDeleteGlobalTag} tagLimit={50} onBackup={handleBackup} onRestore={handleRestore} allPlaylists={playlists} allUsers={users} onAdminDeletePlaylist={handleDeletePlaylist} sourceFolders={sourceFolders} onFoldersAdded={handleFoldersAdded} onFolderRemoved={handleFolderRemoved} />}
      
      {playlistToShare && <SharePlaylistModal isOpen={isShareModalOpen} onClose={() => {setShareModalOpen(false); setPlaylistToShare(null);}} playlist={playlistToShare} allUsers={users} onShare={handleSharePlaylist} />}
      
      <BulkTagModal isOpen={isBulkTagModalOpen} onClose={() => setBulkTagModalOpen(false)} allGlobalTags={allGlobalTags} onApply={handleBulkTag} />

      <AdvancedFilter 
        isOpen={isAdvancedFilterOpen}
        onClose={() => setAdvancedFilterOpen(false)}
        onApply={setAdvancedFilter}
        initialState={advancedFilter}
        allGlobalTags={allGlobalTags}
        allPlaylists={Object.values(playlists)}
        allSourceFolders={sourceFolders}
      />

    </div>
  );
};

export default App;
