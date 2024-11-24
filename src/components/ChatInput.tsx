import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    try {
      setSending(true);
      await onSendMessage(message.trim());
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
      <div className="flex space-x-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          disabled={disabled || sending}
        />
        <Button type="submit" disabled={disabled || sending || !message.trim()}>
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}