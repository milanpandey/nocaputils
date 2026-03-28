import Link from "next/link";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="mb-6 text-xl font-medium leading-relaxed">
              At NocapUtils, we take your privacy seriously. Our tools are designed to process your files 
              <strong> entirely in your browser</strong>. This means your data never leaves your device.
            </p>

            <h2 className="mb-4 mt-8 text-2xl font-bold uppercase">1. Data Collection</h2>
            <p className="mb-4">
              We do not collect, store, or share any of the video or audio files you process using our tools. 
              All processing (compression, conversion, editing) happens locally via WebAssembly (FFmpeg.wasm).
            </p>

            <h2 className="mb-4 mt-8 text-2xl font-bold uppercase">2. Cookies and Analytics</h2>
            <p className="mb-4">
              We may use essential cookies to maintain your theme preferences. We use minimal, privacy-compliant 
              analytics to understand site traffic and improve our tools.
            </p>

            <h2 className="mb-4 mt-8 text-2xl font-bold uppercase">3. Third-Party Services</h2>
            <p className="mb-4">
              We use Google AdSense to serve advertisements. Google may use cookies to serve ads based on 
              your prior visits to this or other websites. You can opt out of personalized advertising by 
              visiting <a href="https://www.google.com/settings/ads" className="underline font-bold">Ads Settings</a>.
            </p>

            <h2 className="mb-4 mt-8 text-2xl font-bold uppercase">4. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us via our support channels.
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
