import { Link } from '@tanstack/react-router';
import { SignedIn, SignedOut, UserButton } from '@clerk/tanstack-react-start';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { Button } from './ui/button';

export default function Header() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 p-4 flex justify-between items-center bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <Link to="/" className="flex items-center gap-2 group">
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          <Wallet className="w-6 h-6 text-primary" />
        </motion.div>
        <span className="font-bold text-xl font-mono group-hover:text-primary transition-colors">
          CentStack
        </span>
      </Link>

      <nav className="flex items-center gap-4">
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </nav>
    </motion.header>
  );
}
