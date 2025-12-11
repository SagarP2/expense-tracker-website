import { Link } from 'react-router-dom';
import { Button } from './ui/Button';

export default function Hero() {
  return (
    <section aria-labelledby="hero-title" className="py-12 md:py-20 lg:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="animate-slide-up">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            New • Collaboration tracking
          </span>
          <h1 id="hero-title" className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text leading-[1.1]">
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Track expenses</span> <br className="hidden sm:block" />
            and share balances.
          </h1>
          <p className="mt-6 text-lg text-text-secondary max-w-lg leading-relaxed">
            Clean workflows, fast filters, and helpful insights designed for everyday use. Manage your personal and shared finances in one place.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto shadow-xl shadow-primary/20">Get started</Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">Sign in</Button>
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm font-medium text-text-muted">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
              No setup required
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(37,99,235,0.5)]"></span>
              Secure by design
            </div>
          </div>
        </div>

        <div className="relative animate-fade-in delay-100 hidden md:block">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full mix-blend-multiply dark:hidden" aria-hidden="true" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full mix-blend-multiply dark:hidden" aria-hidden="true" />
          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-border bg-surface shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
            {/* Abstract UI Representation */}
            <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-highlight dark:bg-none dark:bg-surface p-6 flex flex-col gap-4">
              {/* Mock Header */}
              <div className="flex items-center justify-between">
                <div className="w-32 h-8 bg-neutral-100 rounded-lg animate-pulse"></div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-neutral-100 rounded-full"></div>
                  <div className="w-8 h-8 bg-neutral-100 rounded-full"></div>
                </div>
              </div>
              {/* Mock Chart */}
              <div className="flex-1 bg-white rounded-xl border border-neutral-100 p-4 shadow-sm flex items-end justify-between gap-2">
                <div className="w-full bg-primary/10 rounded-t-lg h-[40%]"></div>
                <div className="w-full bg-primary/20 rounded-t-lg h-[70%]"></div>
                <div className="w-full bg-primary/40 rounded-t-lg h-[50%]"></div>
                <div className="w-full bg-primary/60 rounded-t-lg h-[80%]"></div>
                <div className="w-full bg-primary rounded-t-lg h-[60%]"></div>
              </div>
              {/* Mock List */}
              <div className="space-y-3">
                <div className="h-12 bg-white rounded-xl border border-neutral-100 shadow-sm"></div>
                <div className="h-12 bg-white rounded-xl border border-neutral-100 shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
