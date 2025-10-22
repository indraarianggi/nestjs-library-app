/**
 * Contact Page
 * 
 * Placeholder page for contact information.
 */
export const Contact = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
        <div className="prose prose-gray dark:prose-invert">
          <p className="text-lg text-muted-foreground mb-8">
            Have questions or need assistance? We're here to help!
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-2">Email</h2>
              <p className="text-muted-foreground">support@library-system.com</p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-2">Phone</h2>
              <p className="text-muted-foreground">+1 (555) 123-4567</p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-2">Address</h2>
              <p className="text-muted-foreground">
                123 Library Street<br />
                Book City, BC 12345
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-2">Hours</h2>
              <p className="text-muted-foreground">
                Monday - Friday: 9:00 AM - 6:00 PM<br />
                Saturday: 10:00 AM - 4:00 PM
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-lg border bg-muted/50 p-6">
            <h2 className="text-xl font-semibold mb-4">Send us a message</h2>
            <p className="text-muted-foreground">
              Contact form coming soon. For now, please reach out via email or phone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
