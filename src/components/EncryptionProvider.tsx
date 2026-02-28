import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useUser } from '@clerk/tanstack-react-start';
import { api } from '../../convex/_generated/api';
import {
  deriveKey,
  generateSalt,
  saltToBase64,
  base64ToSalt,
  createVerificationHash,
  verifyPassphrase,
  encrypt,
  decrypt,
} from '@/lib/encryption';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ─── Context ────────────────────────────────────────────────────

interface EncryptionContextType {
  isEnabled: boolean;
  isUnlocked: boolean;
  encryptValue: (plaintext: string) => Promise<string>;
  decryptValue: (ciphertext: string) => Promise<string>;
  setupEncryption: () => void;
}

const EncryptionContext = createContext<EncryptionContextType>({
  isEnabled: false,
  isUnlocked: false,
  encryptValue: async (v) => v,
  decryptValue: async (v) => v,
  setupEncryption: () => {},
});

export const useEncryption = () => useContext(EncryptionContext);

// ─── Provider ───────────────────────────────────────────────────

export function EncryptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const settings = useQuery(
    api.encryptionSettings.get,
    user ? {} : 'skip'
  );
  const setupMutation = useMutation(api.encryptionSettings.setup);

  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);

  const isEnabled = !!settings;
  const isUnlocked = !!cryptoKey;

  // Show unlock dialog when encryption is enabled but key isn't loaded
  useEffect(() => {
    if (settings && !cryptoKey && user) {
      setShowUnlock(true);
    }
  }, [settings, cryptoKey, user]);

  const encryptValue = useCallback(async (plaintext: string): Promise<string> => {
    if (!cryptoKey) return plaintext;
    return encrypt(plaintext, cryptoKey);
  }, [cryptoKey]);

  const decryptValue = useCallback(async (ciphertext: string): Promise<string> => {
    if (!cryptoKey) return ciphertext;
    try {
      return await decrypt(ciphertext, cryptoKey);
    } catch {
      return ciphertext; // Return as-is if decryption fails (unencrypted data)
    }
  }, [cryptoKey]);

  const handleSetup = useCallback(async (passphrase: string) => {
    const salt = await generateSalt();
    const key = await deriveKey(passphrase, salt);
    const verificationHash = await createVerificationHash(key);

    await setupMutation({
      salt: saltToBase64(salt),
      verificationHash,
    });

    setCryptoKey(key);
    setShowSetup(false);
  }, [setupMutation]);

  const handleUnlock = useCallback(async (passphrase: string): Promise<boolean> => {
    if (!settings) return false;

    const salt = base64ToSalt(settings.salt);
    const key = await deriveKey(passphrase, salt);
    const valid = await verifyPassphrase(key, settings.verificationHash);

    if (valid) {
      setCryptoKey(key);
      setShowUnlock(false);
      return true;
    }
    return false;
  }, [settings]);

  return (
    <EncryptionContext.Provider
      value={{
        isEnabled,
        isUnlocked,
        encryptValue,
        decryptValue,
        setupEncryption: () => setShowSetup(true),
      }}
    >
      {children}

      <AnimatePresence>
        {showSetup && (
          <SetupDialog
            onSetup={handleSetup}
            onCancel={() => setShowSetup(false)}
          />
        )}
        {showUnlock && isEnabled && (
          <UnlockDialog
            onUnlock={handleUnlock}
            onSkip={() => setShowUnlock(false)}
          />
        )}
      </AnimatePresence>
    </EncryptionContext.Provider>
  );
}

// ─── Setup Dialog ───────────────────────────────────────────────

function SetupDialog({
  onSetup,
  onCancel,
}: {
  onSetup: (passphrase: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (passphrase.length < 8) {
      setError('Passphrase must be at least 8 characters');
      return;
    }
    if (passphrase !== confirm) {
      setError('Passphrases do not match');
      return;
    }

    setLoading(true);
    try {
      await onSetup(passphrase);
    } catch {
      setError('Failed to set up encryption');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Enable Encryption</h3>
            <p className="text-sm text-muted-foreground">AES-256-GCM · Client-side</p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/80">
            <strong>No recovery possible.</strong> If you forget your passphrase, encrypted data cannot be recovered. Write it down somewhere safe.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Encryption Passphrase</label>
            <div className="relative">
              <Input
                type={showPass ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter a strong passphrase"
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Confirm Passphrase</label>
            <Input
              type={showPass ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm your passphrase"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 gap-2">
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Lock className="w-4 h-4" />
              )}
              Enable Encryption
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Unlock Dialog ──────────────────────────────────────────────

function UnlockDialog({
  onUnlock,
  onSkip,
}: {
  onUnlock: (passphrase: string) => Promise<boolean>;
  onSkip: () => void;
}) {
  const [passphrase, setPassphrase] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const valid = await onUnlock(passphrase);
      if (!valid) {
        setError('Incorrect passphrase. Please try again.');
      }
    } catch {
      setError('Failed to unlock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Unlock Your Data</h3>
            <p className="text-sm text-muted-foreground">Enter your encryption passphrase</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Passphrase</label>
            <div className="relative">
              <Input
                type={showPass ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter your passphrase"
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onSkip} className="flex-1">
              Skip (view encrypted)
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 gap-2">
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Lock className="w-4 h-4" />
              )}
              Unlock
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
