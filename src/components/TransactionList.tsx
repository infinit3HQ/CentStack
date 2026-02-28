import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useDecryptedTransactions } from '@/hooks/useDecryptedTransactions';
import { Id } from '../../convex/_generated/dataModel';

export function TransactionList() {
  const transactions = useDecryptedTransactions();
  const deleteTransaction = useMutation(api.transactions.remove);

  if (!transactions) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 text-center text-muted-foreground"
      >
        Loading transactions...
      </motion.div>
    );
  }

  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-12 text-center border-2 border-dashed border-border rounded-xl"
      >
        <p className="text-muted-foreground text-lg">No transactions yet. Add one!</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-1 pb-20 overflow-x-auto">
      <motion.table
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full text-sm text-left"
      >
        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 font-mono">
          <tr>
            <th scope="col" className="px-4 py-3 rounded-tl-md">Date</th>
            <th scope="col" className="px-4 py-3">Category</th>
            <th scope="col" className="px-4 py-3">Desc</th>
            <th scope="col" className="px-4 py-3 text-right">Amount</th>
            <th scope="col" className="px-4 py-3 rounded-tr-md"></th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence mode="popLayout">
            {transactions.map((t, index) => (
              <motion.tr
                key={t._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="border-b border-border hover:bg-muted/30 transition-colors font-mono group"
              >
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                  {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                </td>
                <td className="px-4 py-3">
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className={cn(
                      "px-2 py-1 rounded text-xs inline-block",
                      t.type === 'income' ? "bg-green-500/10 text-green-500" : "bg-zinc-500/10 text-zinc-500"
                    )}
                  >
                    {t.category}
                  </motion.span>
                </td>
                <td className="px-4 py-3 font-sans truncate max-w-[200px]">{t.description}</td>
                <td className={cn(
                  "px-4 py-3 text-right font-medium",
                  t.type === 'income' ? "text-green-500" : "text-foreground"
                )}>
                  {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right w-10">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteTransaction({ id: t._id as Id<"transactions"> })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </motion.table>
    </div>
  );
}
