import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
  deleteDoc,
  doc as firestoreDoc,
} from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import EmailVerification from '@/components/EmailVerification';
import ChatMessage from '@/components/ChatMessage';
import ChatUserList from '@/components/ChatUserList';
import ChatInput from '@/components/ChatInput';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderEmail?: string;
  senderName?: string;
  receiverId: string;
  timestamp: Timestamp;
}

interface User {
  id: string;
  email: string;
  displayName?: string;
  online?: boolean;
  lastSeen?: string;
}

export default function Chat() {
  const { currentUser } = useAuth()!;
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser?.emailVerified) return;

    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('email', '!=', currentUser.email),
      orderBy('email')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      setUsers(usersList);
      setFilteredUsers(usersList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const filtered = users.filter(user => {
      const searchLower = searchQuery.toLowerCase();
      return (
        user.email.toLowerCase().includes(searchLower) ||
        (user.displayName?.toLowerCase() || '').includes(searchLower)
      );
    });
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  useEffect(() => {
    if (!selectedUser || !currentUser?.emailVerified) return;
    setLoading(true);

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('senderId', '==', currentUser.uid),
      where('receiverId', '==', selectedUser.id)
    );

    const q2 = query(
      messagesRef,
      where('senderId', '==', selectedUser.id),
      where('receiverId', '==', currentUser.uid)
    );

    const fetchMessages = async () => {
      try {
        const [sent, received] = await Promise.all([
          getDocs(q),
          getDocs(q2)
        ]);

        const allMessages: Message[] = [
          ...sent.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            senderEmail: currentUser.email,
            senderName: currentUser.displayName
          } as Message)),
          ...received.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            senderEmail: selectedUser.email,
            senderName: selectedUser.displayName
          } as Message))
        ];

        const sortedMessages = allMessages.sort((a, b) => {
          const timeA = a.timestamp?.toMillis() || 0;
          const timeB = b.timestamp?.toMillis() || 0;
          return timeA - timeB;
        });

        setMessages(sortedMessages);
        setLoading(false);

        setTimeout(() => {
          if (scrollAreaRef.current) {
            const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollElement) {
              scrollElement.scrollTop = scrollElement.scrollHeight;
            }
          }
        }, 100);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load messages. Please try again.',
        });
        setLoading(false);
      }
    };

    fetchMessages();

    const unsubscribe1 = onSnapshot(q, () => fetchMessages());
    const unsubscribe2 = onSnapshot(q2, () => fetchMessages());

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [selectedUser, currentUser, toast]);

  const sendMessage = async (text: string) => {
    if (!selectedUser || !currentUser?.emailVerified || !text.trim()) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: text.trim(),
        senderId: currentUser.uid,
        receiverId: selectedUser.id,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message. Please try again.',
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(firestoreDoc(db, 'messages', messageId));
      toast({
        title: 'Message deleted',
        description: 'Message has been successfully deleted.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete message.',
      });
    }
  };

  if (!currentUser?.emailVerified) {
    return <EmailVerification />;
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900">
      {/* Users List - Hidden on mobile when chat is open */}
      <div 
        className={`w-full h-full ${
          selectedUser ? 'hidden md:flex md:w-80' : 'flex'
        } flex-col border-r border-gray-800`}
      >
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-800 border-gray-700"
            />
          </div>
        </div>
        <ChatUserList
          users={filteredUsers}
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
        />
      </div>

      {/* Chat Area - Full screen on mobile when active */}
      {selectedUser ? (
        <div className={`fixed inset-0 md:relative md:flex-1 flex flex-col h-full ${
          selectedUser ? 'flex' : 'hidden md:flex'
        }`}>
          <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 md:hidden"
              onClick={() => setSelectedUser(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-600 text-white">
                {selectedUser.displayName?.[0] ||
                  selectedUser.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-1">
              <h2 className="text-lg font-semibold text-white">
                {selectedUser.displayName || selectedUser.email}
              </h2>
              <p className="text-sm text-gray-400">
                {selectedUser.online ? (
                  <span className="text-green-500">● Online</span>
                ) : (
                  <span>Last seen: {new Date(selectedUser.lastSeen || '').toLocaleString()}</span>
                )}
              </p>
            </div>
          </div>

          <ScrollArea 
            ref={scrollAreaRef} 
            className="flex-1 p-4"
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">Loading messages...</p>
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isCurrentUser={message.senderId === currentUser.uid}
                    onDelete={() => deleteMessage(message.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">No messages yet. Start a conversation!</p>
              </div>
            )}
          </ScrollArea>

          <ChatInput onSendMessage={sendMessage} />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center text-gray-400">
            <p className="text-xl">Select a chat to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}