import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2 } from 'lucide-react';

interface ReauthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReauthModal({ isOpen, onClose, onSuccess }: ReauthModalProps) {
  const { reauthenticate } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password.trim()) {
      setErrorMessage('Lütfen şifreni gir.');
      return;
    }

    setLoading(true);

    const result = await reauthenticate(password);

    if (!result.success) {
      setErrorMessage(result.error ?? 'Şifre doğrulanamadı. Lütfen tekrar dene.');
      setLoading(false);
      return;
    }

    // Success
    setLoading(false);
    setPassword('');
    setErrorMessage(null);
    onSuccess();
    onClose();
  };

  const handleClose = () => {
    if (!loading) {
      setPassword('');
      setErrorMessage(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>İşleme devam etmek için şifreni gir</DialogTitle>
          <DialogDescription>
            Please re-enter your current password to continue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoFocus
            />

            {errorMessage && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Vazgeç
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Doğrulanıyor...
                </>
              ) : (
                'Onayla'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

