import Link from "next/link";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="subtle-pattern min-h-screen pb-20 pt-12">
      <div className="mx-auto max-w-4xl px-6">
        <Link 
          href="/"
          className="neo-button mb-8 inline-block bg-accent px-6 py-2 font-bold uppercase tracking-wider text-black"
        >
          ← Back Home
        </Link>
        
        <div className="neo-panel p-8 md:p-12">
          <h1 className="mb-8 text-4xl font-black uppercase tracking-tight md:text-5xl">
            Terms of Service
          </h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="mb-6 text-xl font-medium leading-relaxed">
              By using NocapUtils, you agree to the following terms and conditions. 
              Please read them carefully.
            </p>

            <h2 className="mb-4 mt-8 text-2xl font-bold uppercase">1. Acceptance of Terms</h2>
            <p className="mb-4">
              NocapUtils provides in-browser utility tools. By accessing or using our services, you 
              acknowledge that you have read, understood, and agree to be bound by these Terms.
            </p>

            <h2 className="mb-4 mt-8 text-2xl font-bold uppercase">2. Use of Service</h2>
            <p className="mb-4">
              Our tools are provided "as is" and "as available". We do not guarantee that the service 
              will be uninterrupted or error-free. You are responsible for the content you process.
            </p>

            <h2 className="mb-4 mt-8 text-2xl font-bold uppercase">3. Privacy and Local Processing</h2>
            <p className="mb-4">
              As stated in our Privacy Policy, all file processing occurs on your local machine. 
              We do not claim ownership of any files you process using our tools.
            </p>

            <h2 className="mb-4 mt-8 text-2xl font-bold uppercase">4. Prohibited Uses</h2>
            <p className="mb-4">
              You agree not to use NocapUtils for any illegal purposes or to process content that 
              violates any laws or third-party rights.
            </p>

            <h2 className="mb-4 mt-8 text-2xl font-bold uppercase">5. Limitation of Liability</h2>
            <p className="mb-4">
              NocapUtils shall not be liable for any direct, indirect, incidental, or consequential 
              damages resulting from the use or inability to use our services.
            </p>

            <p className="mt-12 text-sm opacity-60 italic">
              Last updated: March 2024
            </p>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
