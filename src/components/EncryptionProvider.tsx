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
import { Shield, Lock, AlertTriangle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

// ─── Context ─────────────────────────────────────────────────────

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

// ─── Provider ────────────────────────────────────────────────────

export function EncryptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const settings = useQuery(api.encryptionSettings.get, user ? {} : 'skip');
  const setupMutation = useMutation(api.encryptionSettings.setup);

  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);

  const isEnabled = !!settings;
  const isUnlocked = !!cryptoKey;

  useEffect(() => {
    if (settings && !cryptoKey && user) setShowUnlock(true);
  }, [settings, cryptoKey, user]);

  const encryptValue = useCallback(async (plaintext: string): Promise<string> => {
    if (!cryptoKey) return plaintext;
    return encrypt(plaintext, cryptoKey);
  }, [cryptoKey]);

  const decryptValue = useCallback(async (ciphertext: string): Promise<string> => {
    if (!cryptoKey) return ciphertext;
    try { return await decrypt(ciphertext, cryptoKey); }
    catch { return ciphertext; }
  }, [cryptoKey]);

  const handleSetup = useCallback(async (passphrase: string) => {
    const salt = await generateSalt();
    const key  = await deriveKey(passphrase, salt);
    const verificationHash = await createVerificationHash(key);
    await setupMutation({ salt: saltToBase64(salt), verificationHash });
    setCryptoKey(key);
    setShowSetup(false);
  }, [setupMutation]);

  const handleUnlock = useCallback(async (passphrase: string): Promise<boolean> => {
    if (!settings) return false;
    const salt  = base64ToSalt(settings.salt);
    const key   = await deriveKey(passphrase, salt);
    const valid = await verifyPassphrase(key, settings.verificationHash);
    if (valid) { setCryptoKey(key); setShowUnlock(false); return true; }
    return false;
  }, [settings]);

  return (
    <EncryptionContext.Provider value={{ isEnabled, isUnlocked, encryptValue, decryptValue, setupEncryption: () => setShowSetup(true) }}>
      {children}

      <AnimatePresence>
        {showSetup && (
          <SetupDialog onSetup={handleSetup} onCancel={() => setShowSetup(false)} />
        )}
        {showUnlock && isEnabled && (
          <UnlockDialog onUnlock={handleUnlock} onSkip={() => setShowUnlock(false)} />
        )}
      </AnimatePresence>
    </EncryptionContext.Provider>
  );
}

// ─── Shared components ───────────────────────────────────────────

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'hsl(0 0% 0% / 0.75)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md"
        style={{
          background: 'hsl(0 0% 7%)',
          border: '1px solid hsl(0 0% 16%)',
          boxShadow: '0 0 0 1px hsl(142 60% 52% / 0.08), 0 24px 48px hsl(0 0% 0% / 0.6)',
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function TermInput({
  type, value, onChange, placeholder, autoFocus,
}: {
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground/40 outline-none px-3 py-2.5"
      style={{ border: '1px solid hsl(0 0% 16%)', borderRadius: 0 }}
      onFocus={e => (e.currentTarget.style.borderColor = 'hsl(142 60% 52% / 0.5)')}
      onBlur={e  => (e.currentTarget.style.borderColor = 'hsl(0 0% 16%)')}
    />
  );
}

function TermButton({
  children, onClick, type = 'button', disabled, variant = 'ghost',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}) {
  const base = 'flex-1 h-9 font-mono text-[11px] uppercase tracking-widest transition-all duration-150 disabled:opacity-40 flex items-center justify-center gap-2';
  const styles = variant === 'primary'
    ? { background: 'hsl(142 60% 52%)', color: 'hsl(0 0% 5%)', border: 'none' }
    : { background: 'transparent', color: 'hsl(0 0% 45%)', border: '1px solid hsl(0 0% 18%)' };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base} style={styles}>
      {children}
    </button>
  );
}

// ─── Setup Dialog ────────────────────────────────────────────────

function SetupDialog({ onSetup, onCancel }: { onSetup: (p: string) => Promise<void>; onCancel: () => void }) {
  const [pass, setPass]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (pass.length < 8)    { setError('err: passphrase must be ≥ 8 chars'); return; }
    if (pass !== confirm)   { setError('err: passphrases do not match'); return; }
    setLoading(true);
    try { await onSetup(pass); }
    catch { setError('err: failed to initialise encryption'); }
    finally { setLoading(false); }
  };

  return (
    <Overlay>
      {/* Header */}
      <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid hsl(0 0% 14%)' }}>
        <Shield className="h-5 w-5 text-primary shrink-0" />
        <div>
          <p className="font-mono text-sm text-foreground">enable_encryption</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
            AES-256-GCM · PBKDF2-SHA256 · client-side
          </p>
        </div>
      </div>

      {/* Warning */}
      <div className="mx-6 mt-5 px-4 py-3 font-mono text-[10px] leading-relaxed"
           style={{ border: '1px solid hsl(40 80% 50% / 0.2)', background: 'hsl(40 80% 50% / 0.06)', color: 'hsl(40 75% 60%)' }}>
        <div className="flex gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            <strong>no recovery path.</strong> Your key is derived from this passphrase and never stored or transmitted. If lost, encrypted records cannot be recovered.
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            passphrase
          </label>
          <div className="relative">
            <TermInput type={show ? 'text' : 'password'} value={pass} onChange={setPass} placeholder="enter a strong passphrase" autoFocus />
            <button type="button" onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            confirm_passphrase
          </label>
          <TermInput type={show ? 'text' : 'password'} value={confirm} onChange={setConfirm} placeholder="confirm your passphrase" />
        </div>

        {error && (
          <p className="font-mono text-[10px]" style={{ color: 'hsl(3 85% 60%)' }}>{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <TermButton onClick={onCancel} variant="ghost">cancel</TermButton>
          <TermButton type="submit" disabled={loading} variant="primary">
            {loading ? <span className="animate-spin inline-block">◌</span> : <Lock className="h-3.5 w-3.5" />}
            enable
          </TermButton>
        </div>
      </form>
    </Overlay>
  );
}

// ─── Unlock Dialog ───────────────────────────────────────────────

function UnlockDialog({ onUnlock, onSkip }: { onUnlock: (p: string) => Promise<boolean>; onSkip: () => void }) {
  const [pass, setPass]       = useState('');
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const valid = await onUnlock(pass);
      if (!valid) setError('err: incorrect passphrase');
    } catch {
      setError('err: decryption failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay>
      {/* Header */}
      <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid hsl(0 0% 14%)' }}>
        <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
        <div>
          <p className="font-mono text-sm text-foreground">unlock_session</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
            enter passphrase to decrypt your data
          </p>
        </div>
      </div>

      {/* Spec row */}
      <div className="px-6 py-3 flex gap-4" style={{ borderBottom: '1px solid hsl(0 0% 11%)' }}>
        {[['cipher', 'AES-256-GCM'], ['kdf', 'PBKDF2 / 600k'], ['scope', 'browser only']].map(([k, v]) => (
          <div key={k}>
            <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground">{k}</p>
            <p className="font-mono text-[11px] text-foreground">{v}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            passphrase
          </label>
          <div className="relative">
            <TermInput type={show ? 'text' : 'password'} value={pass} onChange={setPass} placeholder="enter your passphrase" autoFocus />
            <button type="button" onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="font-mono text-[10px]" style={{ color: 'hsl(3 85% 60%)' }}>{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <TermButton onClick={onSkip} variant="ghost">skip</TermButton>
          <TermButton type="submit" disabled={loading} variant="primary">
            {loading ? <span className="animate-spin inline-block">◌</span> : <Lock className="h-3.5 w-3.5" />}
            unlock
          </TermButton>
        </div>
      </form>
    </Overlay>
  );
}
