import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  displayName?: string;
  online?: boolean;
  lastSeen?: string;
}

interface ChatUserListProps {
  users: User[];
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
}

export default function ChatUserList({
  users,
  selectedUser,
  onSelectUser,
}: ChatUserListProps) {
  const navigate = useNavigate();
  const { signout } = useAuth()!;

  const handleSignOut = async () => {
    try {
      await signout();
      navigate('/signin');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <>
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Chats</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {users.map((user) => (
            <button
              key={user.id}
              className={cn(
                'w-full p-4 text-left hover:bg-gray-800 transition-colors',
                selectedUser?.id === user.id ? 'bg-gray-800' : ''
              )}
              onClick={() => onSelectUser(user)}
            >
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback className="bg-blue-600 text-white">
                    {user.displayName?.[0] || user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.displayName || user.email}
                  </p>
                  {user.displayName && (
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {user.online ? (
                      <span className="text-green-500">● Online</span>
                    ) : (
                      <span>
                        Last seen: {new Date(user.lastSeen || '').toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </>
  );
}