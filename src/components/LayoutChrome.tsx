import {
  Home,
  Palette,
  Scissors,
  Sparkles,
  Wind,
  Images,
  Phone,
  Send,
  MessageCircle,
  Instagram,
  ExternalLink,
  Lock,
  LogOut,
  FileDown,
} from 'lucide-react';
import { CONTACTS, NAV_TABS } from '../data/catalog';
import { isOfflineFileRuntime } from '../lib/siteRuntime';
import { PWAInstallButton } from './PWAControls';
import type { TabId } from '../types';

interface TopNavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  onOpenBooking: () => void;
}

export function TopNavigation({ activeTab, onSelectTab, onOpenBooking }: TopNavProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#141211]/92 backdrop-blur-md border-b border-[#D9A773]/12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 md:h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className="font-serif text-xl md:text-2xl font-semibold tracking-[0.18em] text-[#F5F0EB] hover:text-[#D9A773] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A773] rounded-sm"
        >
          MAGDANA
        </button>

        {/* Zone 2: Concise single-line text nav links (Desktop) */}
        <nav
          aria-label="Основная навигация"
          className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-medium"
        >
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A773] rounded-sm ${
                  isActive
                    ? 'text-[#D9A773]'
                    : 'text-[#A69C93] hover:text-[#F5F0EB]'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 -bottom-[1.15rem] h-[1.5px] bg-[#D9A773]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenBooking}
            className="px-4 py-1.5 md:px-5 md:py-2 rounded-lg bg-[#D9A773] text-[#141211] text-xs md:text-sm font-semibold hover:bg-[#E6BD90] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6BD90] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141211]"
          >
            Записаться
          </button>
        </div>
      </div>
    </header>
  );
}

interface MobileTabBarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

const TAB_ICONS: Record<TabId, typeof Home> = {
  home: Home,
  coloring: Palette,
  haircuts: Scissors,
  care: Sparkles,
  styling: Wind,
  portfolio: Images,
};

export function MobileBottomNav({ activeTab, onSelectTab }: MobileTabBarProps) {
  return (
    <nav
      aria-label="Мобильная навигация"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#141211]/95 backdrop-blur-md border-t border-[#D9A773]/15 pb-safe"
    >
      <div className="grid grid-cols-6 items-center h-14 px-1">
        {NAV_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.id];
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 transition-colors focus-visible:outline-none ${
                isActive ? 'text-[#D9A773]' : 'text-[#A69C93] hover:text-[#F5F0EB]'
              }`}
            >
              <Icon className="w-[19px] h-[19px]" strokeWidth={isActive ? 2 : 1.6} />
              <span className="text-[10px] font-medium leading-none whitespace-nowrap">
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

interface FooterProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  onOpenTelegramChat: () => void;
  isMasterUnlocked: boolean;
  onOpenMasterPin: () => void;
  onLockMaster: () => void;
}

export function Footer({
  activeTab,
  onSelectTab,
  onOpenTelegramChat,
  isMasterUnlocked,
  onOpenMasterPin,
  onLockMaster,
}: FooterProps) {
  return (
    <footer className="border-t border-[#D9A773]/14 bg-[#100E0D] mt-20 pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 items-start">
          {/* Left: Brand & Section Navigation */}
          <div className="md:col-span-7 space-y-6">
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => onSelectTab('home')}
                className="font-serif text-2xl font-semibold tracking-[0.18em] text-[#F5F0EB] hover:text-[#D9A773] transition-colors"
              >
                MAGDANA
              </button>
              <p className="text-sm text-[#A69C93] max-w-md leading-relaxed">
                Авторская колористика, архитектура стрижек, глубокие спа-ритуалы и подиумные укладки с бережным отношением к качеству волос.
              </p>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-medium text-[#A69C93]">Разделы</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2.5">
                {NAV_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onSelectTab(tab.id)}
                    className={`text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-[#D9A773] font-medium'
                        : 'text-[#F5F0EB]/80 hover:text-[#D9A773]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#D9A773]/10 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#A69C93]">
              <span>© {new Date().getFullYear()} MAGDANA</span>
              <span aria-hidden="true">·</span>
              {isMasterUnlocked ? (
                <button
                  type="button"
                  onClick={onLockMaster}
                  className="inline-flex items-center gap-1.5 text-[#D9A773] hover:text-[#E6BD90] transition-colors min-h-[36px]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Выйти из режима мастера
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenMasterPin}
                  className="inline-flex items-center gap-1.5 text-[#A69C93]/75 hover:text-[#D9A773] transition-colors min-h-[36px]"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Кабинет мастера
                </button>
              )}

              {!isOfflineFileRuntime() && (
                <>
                  <span aria-hidden="true">·</span>
                  <a
                    href="/magdana-offline.html"
                    download="magdana-offline.html"
                    className="inline-flex items-center gap-1.5 text-[#A69C93]/85 hover:text-[#D9A773] transition-colors whitespace-nowrap min-h-[36px]"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Оффлайн-версия (HTML)</span>
                  </a>
                  <PWAInstallButton />
                </>
              )}
            </div>
          </div>

          {/* Right: Direct Contacts Block */}
          <div className="md:col-span-5 md:pl-8 md:border-l md:border-[#D9A773]/12 space-y-4">
            <h2 className="font-serif text-2xl font-medium text-[#F5F0EB]">
              Прямые контакты
            </h2>
            <p className="text-xs text-[#A69C93] leading-relaxed">
              Выберите удобный мессенджер для консультации, расчёта стоимости и записи.
            </p>

            <div className="divide-y divide-[#D9A773]/10 border-t border-b border-[#D9A773]/10">
              <a
                href={CONTACTS.phoneHref}
                className="flex items-center justify-between py-3 text-sm text-[#F5F0EB] hover:text-[#D9A773] transition-colors min-h-[44px]"
              >
                <span className="inline-flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#D9A773]" />
                  <span>Телефон</span>
                </span>
                <span className="tabular-nums text-[#A69C93] font-medium">
                  {CONTACTS.phoneDisplay}
                </span>
              </a>

              <button
                type="button"
                onClick={onOpenTelegramChat}
                className="w-full flex items-center justify-between py-3 text-sm text-[#F5F0EB] hover:text-[#D9A773] transition-colors min-h-[44px]"
              >
                <span className="inline-flex items-center gap-3">
                  <Send className="w-4 h-4 text-[#D9A773]" />
                  <span>Telegram</span>
                </span>
                <span className="text-[#A69C93]">{CONTACTS.telegramHandle}</span>
              </button>

              <a
                href={CONTACTS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-3 text-sm text-[#F5F0EB] hover:text-[#D9A773] transition-colors min-h-[44px]"
              >
                <span className="inline-flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 text-[#D9A773]" />
                  <span>WhatsApp</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#A69C93]">
                  Написать
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </a>

              <a
                href={CONTACTS.max}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-3 text-sm text-[#F5F0EB] hover:text-[#D9A773] transition-colors min-h-[44px]"
              >
                <span className="inline-flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 text-[#D9A773]" />
                  <span>MAX</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#A69C93]">
                  Открыть чат
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </a>

              <a
                href={CONTACTS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-3 text-sm text-[#F5F0EB] hover:text-[#D9A773] transition-colors min-h-[44px]"
              >
                <span className="inline-flex items-center gap-3">
                  <Instagram className="w-4 h-4 text-[#D9A773]" />
                  <span>Instagram</span>
                </span>
                <span className="text-[#A69C93]">{CONTACTS.instagramHandle}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
