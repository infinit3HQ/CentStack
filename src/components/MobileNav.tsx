import { Link } from '@tanstack/react-router';
import { Home, PlusCircle, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddTransaction } from './AddTransaction';
import { motion } from 'framer-motion';

export function MobileNav() {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-lg p-2 flex justify-around items-center z-50 shadow-lg"
    >
      <Link to="/" className="flex flex-col items-center gap-1 text-xs text-muted-foreground [&.active]:text-primary transition-colors">
        <motion.div whileTap={{ scale: 0.9 }}>
          <Home className="h-6 w-6" />
        </motion.div>
        <span>Home</span>
      </Link>
      
      <AddTransaction />

      <Link to="/" className="flex flex-col items-center gap-1 text-xs text-muted-foreground [&.active]:text-primary transition-colors">
        <motion.div whileTap={{ scale: 0.9 }}>
          <PieChart className="h-6 w-6" />
        </motion.div>
        <span>Budget</span>
      </Link>
    </motion.div>
  );
}
