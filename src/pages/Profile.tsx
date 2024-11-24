import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const schema = z.object({
  displayName: z.string().min(2).max(50),
});

export default function Profile() {
  const { currentUser } = useAuth()!;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: currentUser?.displayName || '',
    },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      setLoading(true);
      if (currentUser) {
        await updateProfile(currentUser, {
          displayName: data.displayName,
        });
        await updateDoc(doc(db, 'users', currentUser.uid), {
          displayName: data.displayName,
        });
        toast({
          title: 'Profile updated',
          description: 'Your profile has been successfully updated.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-2xl">
              {currentUser?.email?.[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold">Profile Settings</h2>
          <p className="text-gray-500">{currentUser?.email}</p>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                {...register('displayName')}
                className={errors.displayName ? 'border-red-500' : ''}
              />
              {errors.displayName && (
                <p className="text-sm text-red-500">{errors.displayName.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/chat')}
              className="w-full"
            >
              Back to Chat
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}