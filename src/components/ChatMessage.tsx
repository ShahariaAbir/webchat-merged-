import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface ChatMessageProps {
  message: {
    id: string;
    text: string;
    timestamp: Timestamp;
    senderId: string;
  };
  isCurrentUser: boolean;
  onDelete: () => void;
}

export default function ChatMessage({ message, isCurrentUser, onDelete }: ChatMessageProps) {
  const formatMessageTime = (timestamp: Timestamp | null) => {
    if (!timestamp || !timestamp.toDate) {
      return '';
    }
    try {
      return format(timestamp.toDate(), 'HH:mm');
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  return (
    <div className={cn(
      'flex group relative',
      isCurrentUser ? 'justify-end' : 'justify-start'
    )}>
      <Card
        className={cn(
          'max-w-[85%] p-3 shadow-md transition-all rounded-2xl',
          isCurrentUser
            ? 'bg-blue-600 text-white rounded-tr-none'
            : 'bg-gray-800 text-white rounded-tl-none'
        )}
      >
        <div className="relative group">
          <p className="break-words text-sm md:text-base pr-6">{message.text}</p>
          {isCurrentUser && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
        <p className={cn(
          'text-[10px] md:text-xs mt-1',
          isCurrentUser ? 'text-blue-100' : 'text-gray-400'
        )}>
          {formatMessageTime(message.timestamp)}
        </p>
      </Card>
    </div>
  );
}