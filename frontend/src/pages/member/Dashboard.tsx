import { useAuth } from '@/features/auth/hooks/useAuth';

export const MemberDashboard = () => {
  const { memberProfile } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Welcome, {memberProfile?.firstName}!</h1>
      <p className="text-muted-foreground">
        Member dashboard placeholder - Ready for implementation in FE-4.1
      </p>
    </div>
  );
};
