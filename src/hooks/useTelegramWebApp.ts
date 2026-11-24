import { useCallback, useEffect, useMemo } from 'react';
import { CONTACTS } from '../data/catalog';

interface TgUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TgWebApp {
  initData?: string;
  initDataUnsafe?: {
    user?: TgUser;
  };
  ready: () => void;
  expand: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TgWebApp;
    };
  }
}

function getTg(): TgWebApp | null {
  if (typeof window === 'undefined') return null;
  const wa = window.Telegram?.WebApp;
  if (!wa) return null;
  // Detect genuine Telegram container vs bare script tag in regular browser
  const hasSession = Boolean(wa.initData && wa.initData.length > 0) || Boolean(wa.initDataUnsafe?.user);
  return hasSession ? wa : null;
}

export function useTelegramWebApp() {
  const tg = useMemo(() => getTg(), []);

  useEffect(() => {
    const rawWa = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
    if (!rawWa) return;
    try {
      rawWa.ready();
      rawWa.expand();
      rawWa.setHeaderColor?.('#141211');
      rawWa.setBackgroundColor?.('#141211');
    } catch {
      // Safe no-op outside Telegram
    }
  }, []);

  const guestName = useMemo(() => {
    const user = tg?.initDataUnsafe?.user;
    if (!user) return '';
    return [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  }, [tg]);

  const guestFirstName = useMemo(() => {
    return tg?.initDataUnsafe?.user?.first_name?.trim() || '';
  }, [tg]);

  const hapticImpact = useCallback(
    (style: 'light' | 'medium' | 'heavy' = 'light') => {
      try {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
      } catch {
        // Ignore outside Telegram
      }
    },
    []
  );

  const hapticNotification = useCallback((type: 'success' | 'error' | 'warning') => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
    } catch {
      // Ignore outside Telegram
    }
  }, []);

  const openTelegramChat = useCallback((prefillText?: string) => {
    const baseUrl = CONTACTS.telegram;
    const targetUrl = prefillText
      ? `${baseUrl}?text=${encodeURIComponent(prefillText)}`
      : baseUrl;

    const wa = getTg();
    if (wa?.openTelegramLink) {
      wa.openTelegramLink(targetUrl);
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = targetUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.click();
  }, []);

  return {
    guestName,
    guestFirstName,
    hapticImpact,
    hapticNotification,
    openTelegramChat,
  };
}

export function useTelegramBackButton(isVisible: boolean, onBack: () => void) {
  useEffect(() => {
    const wa = getTg();
    const backBtn = wa?.BackButton;
    if (!backBtn) return;

    if (isVisible) {
      backBtn.show();
      backBtn.onClick(onBack);
    } else {
      backBtn.hide();
    }

    return () => {
      backBtn.offClick(onBack);
      if (!isVisible) {
        backBtn.hide();
      }
    };
  }, [isVisible, onBack]);
}
