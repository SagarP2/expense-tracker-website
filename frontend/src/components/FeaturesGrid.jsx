import { Zap,Users,BarChart3,Shield } from 'lucide-react';
import { Card } from './ui/Card';

export default function FeaturesGrid() {
  const features = [
    { title: 'Fast Transactions',desc: 'Add and edit quickly with smart filters.',icon: Zap,color: 'text-primary bg-primary/10' },
    { title: 'Collaboration',desc: 'Invite friends and settle shared balances.',icon: Users,color: 'text-blue-600 bg-blue-100' },
    { title: 'Analytics',desc: 'Charts to visualize category and monthly spend.',icon: BarChart3,color: 'text-emerald-600 bg-emerald-100' },
    { title: 'Secure',desc: 'JWT auth and protected APIs for safety.',icon: Shield,color: 'text-amber-600 bg-amber-100' },
  ];

  return (
    <section aria-labelledby="features-title" className="mt-16 md:mt-24">
      <div className="text-center max-w-2xl mx-auto">
        <h2 id="features-title" className="text-3xl md:text-4xl font-bold text-text tracking-tight">Everything you need</h2>
        <p className="mt-4 text-lg text-text-secondary">Minimal features that matter for expense tracking. No clutter, just clarity.</p>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f) => (
          <Card key={f.title} className="p-6 hover:-translate-y-1 transition-transform duration-300 border-border/60" hover>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
              <f.icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-text">{f.title}</h3>
            <p className="mt-2 text-sm text-text-muted leading-relaxed">{f.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
