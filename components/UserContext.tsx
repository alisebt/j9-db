
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export type User = {
  email: string;
  name: string;
  role: 'admin' | 'user';
};

// Mock data, in a real app this would come from an API
const initialUsers: User[] = [
  { email: 'admin@j9.app', name: 'ادمین', role: 'admin' },
  { email: 'user1@j9.app', name: 'کاربر اول', role: 'user' },
  { email: 'user2@j9.app', name: 'کاربر دوم', role: 'user' },
];

interface UserContextType {
  users: User[];
  setUsers: (users: User[]) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  addUser: (user: User) => void;
  removeUser: (email: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users`);
        if (res.ok) {
          const data = await res.json();
          const loadedUsers: User[] = data.users && data.users.length ? data.users : initialUsers;
          setUsers(loadedUsers);
          const found = loadedUsers.find(u => u.email === data.currentUserEmail);
          setCurrentUser(found || loadedUsers[0]);
        }
      } catch (err) {
        console.error('Failed to load user state:', err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const save = async () => {
      try {
        await fetch(`${API_BASE_URL}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users, currentUserEmail: currentUser.email })
        });
      } catch (err) {
        console.error('Failed to save user state:', err);
      }
    };
    save();
    // Ensure current user is still valid
    if (!users.find(u => u.email === currentUser.email)) {
      setCurrentUser(users[0] || initialUsers[0]);
    }
  }, [users, currentUser.email]);

  const handleSetCurrentUser = (user: User) => {
    setCurrentUser(user);
  }

  const addUser = (user: User) => {
    if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
        alert('کاربری با این ایمیل وجود دارد.');
        return;
    }
    setUsers(prev => [...prev, user]);
  }

  const removeUser = (email: string) => {
    if (email === 'admin@j9.app') {
        alert('نمی‌توان کاربر ادمین اصلی را حذف کرد.');
        return;
    }
    setUsers(prev => prev.filter(u => u.email !== email));
  }

  const value = useMemo(() => ({
    users,
    setUsers,
    currentUser,
    setCurrentUser: handleSetCurrentUser,
    addUser,
    removeUser,
  }), [users, currentUser]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
