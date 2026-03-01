import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { suggestCategory, CATEGORIES } from '@/lib/categoryUtils';
import { useEncryption } from '@/components/EncryptionProvider';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  type: z.enum(["income", "expense"]),
});

type TransactionFormValues = z.infer<typeof formSchema>;

export function AddTransaction({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const createTransaction = useMutation(api.transactions.create);
  const { isEnabled, isUnlocked, encryptValue } = useEncryption();

  useEffect(() => {
    const handleOpenAddTransaction = () => setOpen(true);
    document.addEventListener('open-add-transaction', handleOpenAddTransaction);
    return () => document.removeEventListener('open-add-transaction', handleOpenAddTransaction);
  }, []);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      description: "",
      category: "food",
      type: "expense",
    },
  });

  const description = form.watch('description');
  useEffect(() => {
    if (description && description.length > 2) {
      const suggested = suggestCategory(description);
      if (suggested !== 'other') {
        form.setValue('category', suggested);
      }
    }
  }, [description, form]);

  async function onSubmit(values: TransactionFormValues) {
    const shouldEncrypt = isEnabled && isUnlocked;

    await createTransaction({
      amount: shouldEncrypt ? await encryptValue(String(values.amount)) : values.amount,
      description: shouldEncrypt ? await encryptValue(values.description) : values.description,
      type: values.type,
      category: values.category,
      date: Date.now(),
      encrypted: shouldEncrypt || undefined,
    });
    setOpen(false);
    form.reset();
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger || (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-8 right-8 z-50 hidden md:block"
          >
            <Button size="icon" className="h-16 w-16 bg-foreground text-background border-2 border-foreground hover:bg-background hover:text-foreground rounded-none shadow-[6px_6px_0_0_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all duration-200">
              <Plus className="h-8 w-8" />
              <span className="sr-only">New Record</span>
            </Button>
          </motion.div>
        )}
      </DrawerTrigger>
      
      {/* Mobile Trigger Alternative */}
      {!trigger && (
        <DrawerTrigger asChild>
           <motion.div
            whileTap={{ scale: 0.95 }}
            className="md:hidden"
          >
            <Button size="icon" className="h-14 w-14 -mt-6 bg-foreground text-background rounded-none border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--background))] hover:bg-background hover:text-foreground">
              <Plus className="h-6 w-6" />
              <span className="sr-only">New Record</span>
            </Button>
          </motion.div>
        </DrawerTrigger>
      )}

      <DrawerContent className="rounded-none border-t-4 border-foreground font-mono">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mx-auto w-full max-w-lg mb-8"
        >
          <DrawerHeader className="border-b-2 border-border pb-6 mt-4">
            <DrawerTitle className="font-serif text-4xl tracking-tight text-center">New Entry</DrawerTitle>
            <DrawerDescription className="font-mono text-[10px] uppercase tracking-widest text-center mt-2">Append record to ledger</DrawerDescription>
          </DrawerHeader>
          
          <div className="p-6 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-2 gap-6">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase tracking-widest">Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-none border-2 border-border bg-transparent focus:border-foreground focus:ring-0 uppercase text-xs tracking-wider">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-none border-2 border-border font-mono text-xs uppercase tracking-wider">
                              <SelectItem value="expense">Expense</SelectItem>
                              <SelectItem value="income">Income</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase tracking-widest">Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-serif text-lg opacity-50">$</span>
                              <Input 
                                autoFocus 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                className="h-12 pl-8 rounded-none border-2 border-border focus-visible:ring-0 focus-visible:border-foreground font-serif text-lg" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase tracking-widest">Description</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Invoice, Groceries, Rent..." 
                            className="h-12 rounded-none border-2 border-border focus-visible:ring-0 focus-visible:border-foreground font-serif text-lg placeholder:font-sans placeholder:text-sm placeholder:opacity-50"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase tracking-widest">Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-none border-2 border-border bg-transparent focus:border-foreground focus:ring-0 uppercase text-xs tracking-wider">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-none border-2 border-border font-mono text-xs uppercase tracking-wider">
                            {CATEGORIES.map(c => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="pt-4 grid grid-cols-[1fr_2fr] gap-4">
                  <DrawerClose asChild>
                    <Button variant="outline" type="button" className="h-14 rounded-none border-2 border-border uppercase tracking-widest text-xs">Abort</Button>
                  </DrawerClose>
                  <Button type="submit" className="h-14 rounded-none bg-foreground text-background hover:bg-background hover:text-foreground border-2 border-foreground uppercase tracking-widest text-sm font-bold shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all">Submit Entry</Button>
                </motion.div>
              </form>
            </Form>
          </div>
        </motion.div>
      </DrawerContent>
    </Drawer>
  );
}
