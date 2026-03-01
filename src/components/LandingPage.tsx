import { SignUpButton, SignInButton } from '@clerk/tanstack-react-start';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Shield, Zap, ArrowRight, Lock, Database, LineChart, CheckCircle2, Github, Twitter } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="relative overflow-hidden flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        <motion.div
           className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl opacity-50"
           animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
           className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-50"
           animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
           transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="container mx-auto px-4 py-20 grow">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto space-y-8"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Self-hosted & Privacy-first</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-6xl md:text-7xl font-bold tracking-tight bg-linear-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent"
          >
            Take Control of Your Wealth
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Smart, beautiful money management that you own. Self-host for full control over your financial data.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <SignUpButton mode="modal">
              <Button size="lg" className="text-lg px-8 h-12 group">
                Get Started
                <motion.span
                  className="ml-2 inline-block group-hover:translate-x-1 transition-transform"
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
              </Button>
            </SignUpButton>
            <SignInButton mode="modal">
              <Button size="lg" variant="outline" className="text-lg px-8 h-12">
                Sign In
              </Button>
            </SignInButton>
          </motion.div>
        </motion.div>

        {/* App Preview Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 max-w-5xl mx-auto relative cursor-default"
        >
          <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl overflow-hidden">
            <div className="h-8 border-b border-border/50 bg-muted/30 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
            <div className="p-6 md:p-8 space-y-6 opacity-70">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div className="space-y-3">
                   <div className="h-6 w-32 bg-primary/20 rounded animate-pulse" />
                   <div className="h-10 w-48 bg-foreground/10 rounded animate-pulse" />
                 </div>
                 <div className="flex gap-4">
                   <div className="h-24 w-32 bg-green-500/10 rounded-lg animate-pulse" />
                   <div className="h-24 w-32 bg-red-500/10 rounded-lg animate-pulse" />
                 </div>
               </div>
               <div className="space-y-3 pt-6 border-t border-border/30">
                 {[1, 2, 3].map((i) => (
                   <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-primary/10" />
                       <div className="space-y-2">
                         <div className="h-4 w-24 bg-foreground/20 rounded" />
                         <div className="h-3 w-16 bg-muted-foreground/20 rounded" />
                       </div>
                     </div>
                     <div className="h-5 w-20 bg-foreground/20 rounded" />
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </motion.div>

        {/* How it Works Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mt-32 max-w-5xl mx-auto"
        >
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-primary/60">How it Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Three simple steps to financial clarity.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Database, title: "1. Connect", desc: "Import your data securely via CSV or add transactions manually with a lightning-fast UI." },
              { icon: Zap, title: "2. Categorize", desc: "Organize your transactions effortlessly. Smart auto-categorization keeps everything tidy." },
              { icon: LineChart, title: "3. Analyze", desc: "Gain actionable insights. Beautiful charts and reports help you understand your spending habits." }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="relative p-6 space-y-4 text-center group"
              >
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                {i !== 2 && (
                   <div className="hidden md:block absolute top-10 -right-4 w-8 border-t-2 border-dashed border-border/50" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Why Self-Hosted / Features */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mt-32 max-w-6xl mx-auto bg-card/50 border border-border/50 rounded-3xl p-8 md:p-12 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold">Your data.<br/><span className="text-primary">Your rules.</span></h2>
              <p className="text-xl text-muted-foreground">
                Financial data is deeply personal. CentStack is built on the philosophy that you should own your data without compromising on user experience.
              </p>
              <ul className="space-y-4">
                {[
                  "Complete privacy and data ownership",
                  "No vendor lock-in",
                  "Open source and transparent",
                  "Real-time reactive data updates"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="grid gap-4">
              {[
                { icon: Shield, title: "Privacy First", desc: "Keep your sensitive financial data on your own infrastructure." },
                { icon: TrendingUp, title: "Real-time Tracking", desc: "Instant updates and reactive data powered by Convex." },
                { icon: Lock, title: "AES-256 Encrypted", desc: "Client-side AES-256-GCM encryption. Your key never leaves your browser." }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  whileHover={{ scale: 1.02 }}
                  className="p-6 rounded-2xl bg-background border border-border/50 shadow-sm flex items-start gap-4"
                >
                  <feature.icon className="w-8 h-8 text-primary shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modern Footer */}
      <footer className="mt-20 border-t border-border/40 bg-muted/20 py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xl font-bold font-mono tracking-tight">CentStack</span>
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} CentStack. Open source money management.
          </p>
          <div className="flex gap-4">
            <a href="https://github.com/infinit3HQ/CentStack" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="hover:text-primary rounded-full">
                <Github className="w-5 h-5" />
              </Button>
            </a>
            <a href="https://twitter.com/Niraj_Dilshan" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="hover:text-primary rounded-full">
                <Twitter className="w-5 h-5" />
              </Button>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
