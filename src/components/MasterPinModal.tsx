import { useEffect, useState, type FormEvent } from 'react';
import { Lock, X, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { signInMasterWithGoogle } from '../lib/firebase';
import { detectApiAvailability, isOfflineFileRuntime } from '../lib/siteRuntime';

interface MasterPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: (verifiedPin: string, mode: 'pin' | 'static-google') => void;
  onErrorFeedback: () => void;
}

export function MasterPinModal({
  isOpen,
  onClose,
  onUnlocked,
  onErrorFeedback,
}: MasterPinModalProps) {
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkingMode, setCheckingMode] = useState(false);
  const [apiAvailable, setApiAvailable] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const offlineRuntime = isOfflineFileRuntime();

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (offlineRuntime) {
      setApiAvailable(false);
      return;
    }

    let cancelled = false;
    setCheckingMode(true);
    void detectApiAvailability().then((available) => {
      if (!cancelled) {
        setApiAvailable(available);
        setCheckingMode(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, offlineRuntime]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleaned = pin.trim();
    if (!cleaned) {
      setError('Введите PIN-код мастера.');
      onErrorFeedback();
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/master/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleaned }),
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setApiAvailable(false);
        setError('Сервер PIN-авторизации не подключён — используйте вход через Google администратора.');
        onErrorFeedback();
        return;
      }
      const data = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setError(data.message || 'Неверный PIN-код.');
        onErrorFeedback();
        return;
      }
      setPin('');
      onUnlocked(cleaned, 'pin');
    } catch {
      setApiAvailable(false);
      setError('Node-сервер недоступен — на статическом хостинге войдите через Google-аккаунт владельца.');
      onErrorFeedback();
    } finally {
      setSubmitting(false);
    }
  };

  const handleStaticGoogleLogin = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await signInMasterWithGoogle();
      onUnlocked('', 'static-google');
    } catch (err) {
      onErrorFeedback();
      setError(
        err instanceof Error
          ? err.message
          : 'Не удалось выполнить вход через Google. Проверьте подключение к интернету и настройки домена в Firebase.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="master-pin-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-[#1C1917] border border-[#D9A773]/24 p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs text-[#D9A773]">
              <Lock className="w-3.5 h-3.5" />
              <span>Закрытый доступ</span>
            </div>
            <h2 id="master-pin-title" className="font-serif text-2xl font-medium text-[#F5F0EB]">
              Кабинет мастера
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно входа"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#A69C93] hover:text-[#F5F0EB] hover:bg-[#231F1C]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {offlineRuntime ? (
          <div className="space-y-4">
            <p className="text-xs text-[#A69C93] leading-relaxed">
              Вы открыли автономную оффлайн-версию сайта. Кабинет мастера и публикация новых фотографий в облако Firebase доступны на онлайн-версии сайта на вашем домене.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 rounded-xl bg-[#D9A773] text-[#141211] text-sm font-semibold hover:bg-[#E6BD90] transition-colors"
            >
              Вернуться к сайту
            </button>
          </div>
        ) : checkingMode ? (
          <div className="py-6 flex items-center justify-center gap-2.5 text-xs text-[#A69C93]">
            <Loader2 className="w-4 h-4 animate-spin text-[#D9A773]" />
            <span>Определение режима хостинга...</span>
          </div>
        ) : apiAvailable ? (
          <>
            <p className="text-xs text-[#A69C93] leading-relaxed">
              Введите PIN-код для открытия студии загрузки, AI-генерации и утверждения фотографий работ.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN-код"
                maxLength={16}
                className="w-full h-12 px-4 rounded-xl bg-[#141211] border border-[#D9A773]/22 text-center text-lg tracking-[0.35em] text-[#F5F0EB] placeholder:tracking-normal placeholder:text-sm placeholder:text-[#A69C93]/60 focus:outline-none focus:border-[#D9A773]"
              />

              {error && (
                <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-xl px-3.5 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-[#D9A773] text-[#141211] text-sm font-semibold hover:bg-[#E6BD90] disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Проверка...' : 'Войти в студию'}
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-[#A69C93] leading-relaxed">
              Сайт работает в режиме статического хостинга. Войдите через Google-аккаунт администратора, чтобы загружать и публиковать реальные фотографии работ в облаке Firebase.
            </p>

            {error && (
              <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-xl px-3.5 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleStaticGoogleLogin()}
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-[#D9A773] text-[#141211] text-sm font-semibold hover:bg-[#E6BD90] disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Вход...' : 'Войти через Google (мастер)'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
