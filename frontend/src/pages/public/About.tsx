/**
 * About Page
 * 
 * Placeholder page for about information.
 */
export const About = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">About Us</h1>
        <div className="prose prose-gray dark:prose-invert">
          <p className="text-lg text-muted-foreground mb-4">
            Welcome to the Library Management System, your comprehensive solution for
            managing library operations efficiently.
          </p>
          <p className="text-muted-foreground mb-4">
            Our platform provides tools for cataloging books, managing member accounts,
            tracking loans, and much more. Built with modern technology and user experience
            in mind, we aim to make library management seamless and accessible.
          </p>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
          <p className="text-muted-foreground mb-4">
            To empower libraries with cutting-edge technology that simplifies operations
            and enhances the user experience for both staff and members.
          </p>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Features</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Comprehensive book catalog management</li>
            <li>Member registration and profile management</li>
            <li>Loan tracking and due date reminders</li>
            <li>Search and filter capabilities</li>
            <li>Admin dashboard for operations management</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
