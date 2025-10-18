import { useParams } from 'react-router-dom';

export const BookForm = () => {
  const { id } = useParams();
  const isEdit = !!id;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">
        {isEdit ? 'Edit Book' : 'Add New Book'}
      </h1>
      <p className="text-muted-foreground">
        Book form placeholder - Ready for implementation in FE-5.3
      </p>
    </div>
  );
};
