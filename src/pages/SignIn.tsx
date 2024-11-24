import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { MessageSquare, Loader2 } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function SignIn() {
  const { signin, currentUser } = useAuth()!;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (currentUser?.emailVerified) {
      navigate('/chat');
    }
  }, [currentUser, navigate]);

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      setLoading(true);
      await signin(data.email, data.password);
      navigate('/chat', { replace: true });
    } catch (error: any) {
      let message = 'Failed to sign in. Please check your credentials.';
      if (error.message === 'Please verify your email before signing in.') {
        message = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
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
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="text-gray-500">Sign in to your account</p>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                disabled={loading}
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                disabled={loading}
                {...register('password')}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
            <div className="text-sm text-center space-y-2">
              <Link
                to="/forgot-password"
                className="text-blue-600 hover:underline block"
              >
                Forgot password?
              </Link>
              <p>
                Don't have an account?{' '}
                <Link to="/signup" className="text-blue-600 hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}