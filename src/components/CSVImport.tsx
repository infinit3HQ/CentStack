import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { suggestCategory, CATEGORIES } from '@/lib/categoryUtils';

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  valid: boolean;
  error?: string;
}

interface ColumnMapping {
  date: number;
  description: number;
  amount: number;
  type: number;
}

const EXPECTED_HEADERS = ['date', 'description', 'amount', 'type'];

function detectColumnMapping(headers: string[]): ColumnMapping {
  const lower = headers.map(h => h.toLowerCase().trim());
  return {
    date: Math.max(0, lower.findIndex(h => ['date', 'time', 'timestamp', 'when'].includes(h))),
    description: Math.max(0, lower.findIndex(h => ['description', 'desc', 'memo', 'note', 'name', 'details', 'narration'].includes(h))),
    amount: Math.max(0, lower.findIndex(h => ['amount', 'value', 'sum', 'total', 'price'].includes(h))),
    type: lower.findIndex(h => ['type', 'kind', 'direction', 'credit/debit'].includes(h)),
  };
}

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

function parseRow(row: string[], mapping: ColumnMapping): ParsedRow {
  try {
    const dateStr = row[mapping.date] || '';
    const description = row[mapping.description] || '';
    const amountStr = row[mapping.amount] || '0';
    const typeStr = mapping.type >= 0 ? (row[mapping.type] || '').toLowerCase() : '';

    // Parse amount — handle negative numbers and currency symbols
    const cleanAmount = amountStr.replace(/[^0-9.\-]/g, '');
    const amount = Math.abs(parseFloat(cleanAmount));

    if (isNaN(amount) || amount === 0) {
      return { date: dateStr, description, amount: 0, type: 'expense', category: 'other', valid: false, error: 'Invalid amount' };
    }

    // Parse date
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) {
      return { date: dateStr, description, amount, type: 'expense', category: 'other', valid: false, error: 'Invalid date' };
    }

    // Determine type
    let type: 'income' | 'expense' = 'expense';
    if (typeStr.includes('income') || typeStr.includes('credit') || typeStr.includes('deposit')) {
      type = 'income';
    } else if (parseFloat(cleanAmount) > 0 && mapping.type < 0) {
      // If no type column and amount is positive, try to infer
      type = 'income';
    } else if (parseFloat(cleanAmount) < 0) {
      type = 'expense';
    }

    // Auto-categorize
    const category = suggestCategory(description);

    return { date: dateStr, description, amount, type, category, valid: true };
  } catch {
    return { date: '', description: '', amount: 0, type: 'expense', category: 'other', valid: false, error: 'Parse error' };
  }
}

export function CSVImport({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ date: 0, description: 1, amount: 2, type: -1 });
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [fileName, setFileName] = useState('');

  const createMany = useMutation(api.transactions.createMany);

  useEffect(() => {
    const handleOpenCSVImport = () => setOpen(true);
    document.addEventListener('open-csv-import', handleOpenCSVImport);
    return () => document.removeEventListener('open-csv-import', handleOpenCSVImport);
  }, []);

  const validCount = useMemo(() => rows.filter(r => r.valid).length, [rows]);
  const invalidCount = useMemo(() => rows.filter(r => !r.valid).length, [rows]);

  const reparse = useCallback((data: string[][], m: ColumnMapping) => {
    const parsed = data.map(row => parseRow(row, m));
    setRows(parsed);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setDone(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);

      if (parsed.length < 2) return;

      const headerRow = parsed[0];
      const dataRows = parsed.slice(1);
      const autoMapping = detectColumnMapping(headerRow);

      setHeaders(headerRow);
      setRawRows(dataRows);
      setMapping(autoMapping);
      reparse(dataRows, autoMapping);
    };
    reader.readAsText(file);
  }, [reparse]);

  const updateMapping = useCallback((field: keyof ColumnMapping, value: number) => {
    const newMapping = { ...mapping, [field]: value };
    setMapping(newMapping);
    reparse(rawRows, newMapping);
  }, [mapping, rawRows, reparse]);

  const updateRowCategory = useCallback((index: number, category: string) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, category } : r));
  }, []);

  const handleImport = useCallback(async () => {
    setImporting(true);
    try {
      const validRows = rows.filter(r => r.valid);
      const transactions = validRows.map(r => ({
        amount: r.amount,
        type: r.type,
        category: r.category,
        description: r.description,
        date: new Date(r.date).getTime(),
      }));

      // Batch in groups of 100
      for (let i = 0; i < transactions.length; i += 100) {
        const batch = transactions.slice(i, i + 100);
        await createMany({ transactions: batch });
      }

      setDone(true);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  }, [rows, createMany]);

  const reset = useCallback(() => {
    setHeaders([]);
    setRows([]);
    setRawRows([]);
    setFileName('');
    setDone(false);
    setMapping({ date: 0, description: 1, amount: 2, type: -1 });
  }, []);

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-mono">import_csv</SheetTitle>
          <SheetDescription>Upload a CSV file to import transactions in bulk.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* File Upload */}
          {!done && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <label
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all group"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {fileName ? (
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {fileName}
                      </span>
                    ) : (
                      <span>Click to upload <span className="font-mono text-primary">.csv</span></span>
                    )}
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </motion.div>
          )}

          {/* Column Mapping */}
          {headers.length > 0 && !done && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-3"
            >
              <h4 className="text-sm font-medium text-muted-foreground font-mono">column_mapping</h4>
              <div className="grid grid-cols-2 gap-3">
                {EXPECTED_HEADERS.map((field) => (
                  <div key={field} className="space-y-1">
                    <label className="text-xs text-muted-foreground capitalize">{field}</label>
                    <Select
                      value={String(mapping[field as keyof ColumnMapping])}
                      onValueChange={(v) => updateMapping(field as keyof ColumnMapping, parseInt(v))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {field === 'type' && (
                          <SelectItem value="-1">Auto-detect</SelectItem>
                        )}
                        {headers.map((h, i) => (
                          <SelectItem key={i} value={String(i)}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Preview Table */}
          {rows.length > 0 && !done && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground font-mono">preview</h4>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-green-500">
                    <CheckCircle2 className="w-3 h-3" /> {validCount} valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="flex items-center gap-1 text-red-500">
                      <AlertCircle className="w-3 h-3" /> {invalidCount} errors
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-border rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-mono text-muted-foreground">Date</th>
                      <th className="px-3 py-2 text-left font-mono text-muted-foreground">Description</th>
                      <th className="px-3 py-2 text-right font-mono text-muted-foreground">Amount</th>
                      <th className="px-3 py-2 text-left font-mono text-muted-foreground">Type</th>
                      <th className="px-3 py-2 text-left font-mono text-muted-foreground">Category</th>
                      <th className="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {rows.slice(0, 50).map((row, i) => (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className={`border-t border-border/50 ${!row.valid ? 'bg-destructive/5' : 'hover:bg-muted/20'}`}
                        >
                          <td className="px-3 py-2 whitespace-nowrap">{row.date}</td>
                          <td className="px-3 py-2 truncate max-w-[150px]">{row.description}</td>
                          <td className="px-3 py-2 text-right font-mono">${row.amount.toFixed(2)}</td>
                          <td className="px-3 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                              row.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-zinc-500/10 text-zinc-400'
                            }`}>
                              {row.type}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <Select
                              value={row.category}
                              onValueChange={(v) => updateRowCategory(i, v)}
                            >
                              <SelectTrigger className="h-6 text-[10px] w-24 border-none bg-transparent px-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map(c => (
                                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2">
                            {!row.valid && (
                              <span title={row.error}>
                                <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                              </span>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
                {rows.length > 50 && (
                  <div className="px-3 py-2 text-center text-xs text-muted-foreground bg-muted/30">
                    Showing 50 of {rows.length} rows
                  </div>
                )}
              </div>

              <Button
                onClick={handleImport}
                disabled={importing || validCount === 0}
                className="w-full gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import {validCount} Transactions
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Success State */}
          {done && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              >
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </motion.div>
              <h3 className="text-lg font-semibold">Import Complete!</h3>
              <p className="text-sm text-muted-foreground">{validCount} transactions imported successfully.</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={reset}>Import More</Button>
                <Button onClick={() => setOpen(false)}>Done</Button>
              </div>
            </motion.div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
