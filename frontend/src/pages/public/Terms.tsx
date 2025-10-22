/**
 * Terms of Service Page
 * 
 * Placeholder page for terms of service information.
 */
export const Terms = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
        <div className="prose prose-gray dark:prose-invert">
          <p className="text-sm text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
            <p className="text-muted-foreground mb-4">
              By accessing and using the Library Management System, you agree to be bound by
              these Terms of Service and all applicable laws and regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Use License</h2>
            <p className="text-muted-foreground mb-4">
              Permission is granted to temporarily access the materials on Library Management
              System for personal, non-commercial use only. This is the grant of a license,
              not a transfer of title.
            </p>
            <p className="text-muted-foreground mb-4">Under this license you may not:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to reverse engineer any software</li>
              <li>Remove any copyright or proprietary notations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">User Responsibilities</h2>
            <p className="text-muted-foreground mb-4">
              As a user of our services, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
              <li>Return borrowed materials on time</li>
              <li>Comply with all library policies and procedures</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground mb-4">
              In no event shall Library Management System be liable for any damages arising
              out of the use or inability to use the materials on our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Modifications</h2>
            <p className="text-muted-foreground mb-4">
              We reserve the right to revise these terms of service at any time without notice.
              By using this service, you agree to be bound by the current version of these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p className="text-muted-foreground">
              Questions about the Terms of Service should be sent to us at
              legal@library-system.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
