import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { sendEmailVerification } from 'firebase/auth';

export default function EmailVerification() {
  const { currentUser } = useAuth()!;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const resendVerification = async () => {
    try {
      setLoading(true);
      if (currentUser) {
        await sendEmailVerification(currentUser);
        toast({
          title: 'Verification email sent',
          description: 'Please check your inbox and verify your email.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send verification email.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="bg-blue-600 p-3 rounded-full">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Verify Your Email</h2>
          <p className="text-gray-500 text-center">
            We've sent a verification email to {currentUser?.email}.<br />
            Please verify your email to continue.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center">
            Didn't receive the email? Check your spam folder or click below to resend.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={resendVerification}
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}