import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { registerSchema } from '@/schemas/auth.schema';
import type { RegisterInput } from '@/schemas/auth.schema';
import { useRegister } from '@/features/auth/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

export const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useRegister();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      const response = await registerUser(data);
      
      // After successful registration, redirect to member dashboard
      navigate('/member', { replace: true });
      
      toast.success(
        `Welcome, ${response.user.email}! Your account has been created.`
      );
    } catch (error: unknown) {
      const errorResponse = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      const message =
        errorResponse.response?.data?.message ||
        errorResponse.message ||
        'Registration failed. Please try again.';
      
      // Handle specific error cases
      if (
        errorResponse.response?.status === 409 ||
        message.includes('already exists')
      ) {
        toast.error('An account with this email already exists');
      } else {
        toast.error(message);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md my-8">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create an Account
          </CardTitle>
          <CardDescription className="text-center">
            Enter your information to register for a library account
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-16rem)] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="text-sm font-semibold text-muted-foreground">
                Personal Information
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  {...register('email')}
                  disabled={isLoading}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p
                    id="email-error"
                    className="text-sm font-medium text-destructive"
                    role="alert"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    {...register('password')}
                    disabled={isLoading}
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={
                      errors.password ? 'password-error' : 'password-hint'
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password ? (
                  <p
                    id="password-error"
                    className="text-sm font-medium text-destructive"
                    role="alert"
                  >
                    {errors.password.message}
                  </p>
                ) : (
                  <p id="password-hint" className="text-xs text-muted-foreground">
                    Min. 8 characters with uppercase, lowercase, and number
                  </p>
                )}
              </div>

              {/* First Name Field */}
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  {...register('firstName')}
                  disabled={isLoading}
                  aria-invalid={errors.firstName ? 'true' : 'false'}
                  aria-describedby={
                    errors.firstName ? 'firstName-error' : undefined
                  }
                />
                {errors.firstName && (
                  <p
                    id="firstName-error"
                    className="text-sm font-medium text-destructive"
                    role="alert"
                  >
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Last Name Field */}
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  {...register('lastName')}
                  disabled={isLoading}
                  aria-invalid={errors.lastName ? 'true' : 'false'}
                  aria-describedby={
                    errors.lastName ? 'lastName-error' : undefined
                  }
                />
                {errors.lastName && (
                  <p
                    id="lastName-error"
                    className="text-sm font-medium text-destructive"
                    role="alert"
                  >
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  {...register('phone')}
                  disabled={isLoading}
                  aria-invalid={errors.phone ? 'true' : 'false'}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone && (
                  <p
                    id="phone-error"
                    className="text-sm font-medium text-destructive"
                    role="alert"
                  >
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Address Field */}
              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Textarea
                  id="address"
                  placeholder="123 Main Street, City, State, ZIP"
                  {...register('address')}
                  disabled={isLoading}
                  aria-invalid={errors.address ? 'true' : 'false'}
                  aria-describedby={errors.address ? 'address-error' : undefined}
                  rows={3}
                />
                {errors.address && (
                  <p
                    id="address-error"
                    className="text-sm font-medium text-destructive"
                    role="alert"
                  >
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
