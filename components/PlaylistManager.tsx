
import React from 'react';
import type { Playlist } from '../App';

type PlaylistManagerProps = {
  shotId: string;
  playlists: Playlist[];
  memberships: Set<string>; // Set of playlist IDs the shot is in
  onToggle: (playlistId: string) => void;
  hasEditPermission: (playlist: Playlist) => boolean;
};

const PlaylistManager: React.FC<PlaylistManagerProps> = ({ playlists, memberships, onToggle, hasEditPermission }) => {
  return (
    <div className="bg-zinc-800/60 flex flex-col h-full overflow-hidden">
      <h2 className="text-xl font-bold p-4 border-b border-zinc-700/80 text-zinc-300 flex-shrink-0">
        عضویت در لیست‌های پخش
      </h2>
      <div className="flex-grow p-4 overflow-auto scroll-hidden bg-zinc-900/50">
        {playlists.length > 0 ? (
          <div className="space-y-2">
            {playlists.map(playlist => {
              const canEdit = hasEditPermission(playlist);
              const isMember = memberships.has(playlist.id);
              
              return (
                <label
                  key={playlist.id}
                  className={`flex items-center justify-between p-2 rounded-md transition-colors ${canEdit ? 'cursor-pointer hover:bg-zinc-700/50' : 'opacity-60 cursor-not-allowed'}`}
                >
                  <span className={`font-medium ${isMember ? 'text-sky-300' : 'text-zinc-300'}`}>
                    {playlist.name}
                  </span>
                  <input
                    type="checkbox"
                    checked={isMember}
                    onChange={() => canEdit && onToggle(playlist.id)}
                    disabled={!canEdit}
                    className="form-checkbox h-5 w-5 rounded bg-zinc-600 border-zinc-500 text-sky-500 focus:ring-sky-500 cursor-pointer disabled:cursor-not-allowed"
                  />
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-zinc-500 text-center text-sm">لیست پخشی برای نمایش وجود ندارد.</p>
        )}
      </div>
    </div>
  );
};

export default PlaylistManager;
