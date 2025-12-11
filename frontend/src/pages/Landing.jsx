import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import FeaturesGrid from '../components/FeaturesGrid';
import PublicHeader from '../components/PublicHeader';
import { Button } from '../components/ui/Button';
import '../styles/landing.css';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-text selection:bg-primary/20 selection:text-primary">
      <PublicHeader />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="mt-6 rounded-3xl bg-surface/40 border border-white/20 backdrop-blur-xl shadow-sm overflow-hidden">
          <div className="px-4 md:px-8 lg:px-12">
            <Hero />
          </div>
        </div>

        <section className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm hover:shadow-md transition-shadow">
            <p className="text-3xl font-bold text-text">₹0 fees</p>
            <p className="text-sm font-medium text-text-muted mt-1">Forever free personal tracking</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm hover:shadow-md transition-shadow">
            <p className="text-3xl font-bold text-text">2× faster</p>
            <p className="text-sm font-medium text-text-muted mt-1">Quick add & smart filters</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm hover:shadow-md transition-shadow">
            <p className="text-3xl font-bold text-text">Secure</p>
            <p className="text-sm font-medium text-text-muted mt-1">JWT auth, protected APIs</p>
          </div>
        </section>

        <FeaturesGrid />

        <section aria-labelledby="cta" className="mt-20 md:mt-32">
          <h2 id="cta" className="sr-only">Get started</h2>
          <div className="relative rounded-3xl bg-primary overflow-hidden px-6 py-12 md:px-16 md:py-16 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-primary/30">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

            <div className="relative z-10 max-w-2xl">
              <p className="text-blue-100 font-semibold mb-2 uppercase tracking-wider text-sm">Start now</p>
              <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Ready to take control of your finances?</h3>
              <p className="mt-4 text-blue-100 text-lg">Join thousands of users tracking their expenses effortlessly.</p>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="bg-white text-primary hover:bg-blue-50 w-full sm:w-auto border-none">Create account</Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">Sign in</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border mt-20 bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center">
          <p className="text-sm text-text-muted">© {new Date().getFullYear()} Expense Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

