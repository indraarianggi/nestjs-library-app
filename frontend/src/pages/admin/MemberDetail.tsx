import { useParams } from 'react-router-dom';

export const MemberDetail = () => {
  const { id } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Member Details</h1>
      <p className="text-muted-foreground">
        Member detail page placeholder (ID: {id}) - Ready for implementation in FE-6.2
      </p>
    </div>
  );
};
