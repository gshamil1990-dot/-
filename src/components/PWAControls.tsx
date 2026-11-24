import { useEffect, useState } from 'react';
import { Download, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWA';
import { isOfflineFileRuntime } from '../lib/siteRuntime';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (!showIOSGuide) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowIOSGuide(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showIOSGuide]);

  if (isInstalled || isOfflineFileRuntime()) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex items-center gap-1.5 text-xs text-[#D9A773] hover:text-[#E6BD90] transition-colors whitespace-nowrap min-h-[36px]"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Установить приложение</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 text-xs text-[#D9A773] hover:text-[#E6BD90] transition-colors whitespace-nowrap min-h-[36px]"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span>На экран «Домой»</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowIOSGuide(false);
            }}
          >
            <div className="w-full max-w-sm rounded-2xl bg-[#1C1917] border border-[#D9A773]/24 p-6 space-y-4 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-[#D9A773]">iPhone и iPad · Safari</p>
                  <h3
                    id="ios-install-title"
                    className="font-serif text-2xl font-medium text-[#F5F0EB]"
                  >
                    Установить MAGDANA
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Закрыть инструкцию"
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[#A69C93] hover:text-[#F5F0EB] hover:bg-[#231F1C]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ol className="space-y-2.5 text-sm text-[#A69C93] leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#D9A773] font-medium tabular-nums">1.</span>
                  <span>
                    Нажмите кнопку{' '}
                    <span className="inline-flex items-center gap-1 text-[#F5F0EB] font-medium">
                      <Share className="w-3.5 h-3.5 text-[#D9A773]" />
                      Поделиться
                    </span>{' '}
                    в нижней панели Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#D9A773] font-medium tabular-nums">2.</span>
                  <span>
                    Выберите пункт{' '}
                    <span className="text-[#F5F0EB] font-medium">
                      «На экран «Домой»»
                    </span>{' '}
                    и подтвердите добавление.
                  </span>
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full h-11 rounded-xl bg-[#D9A773] text-[#141211] text-sm font-semibold hover:bg-[#E6BD90] transition-colors"
              >
                Понятно
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline || isOfflineFileRuntime()) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-16 md:bottom-5 left-4 right-4 sm:right-auto z-40 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#1C1917]/95 backdrop-blur-md border border-[#D9A773]/35 text-xs text-[#F5F0EB] shadow-2xl"
    >
      <WifiOff className="w-4 h-4 text-[#D9A773] shrink-0" />
      <span>Оффлайн-режим — каталог и портфолио открыты из кэша</span>
    </div>
  );
}
