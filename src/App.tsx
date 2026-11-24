import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { AnimatePresence, motion } from 'motion/react';
import {
  CARE_CATEGORIES,
  CARE_SERVICES,
  COLORING_CATEGORIES,
  COLORING_SERVICES,
  HAIRCUT_CATEGORIES,
  HAIRCUT_SERVICES,
  STYLING_CATEGORIES,
  STYLING_SERVICES,
} from './data/catalog';
import { auth, subscribePublishedModels } from './lib/firebase';
import {
  detectApiAvailability,
  isOfflineFileRuntime,
  parseRouteFromLocation,
  syncLocationToRoute,
  updateDocumentSeo,
} from './lib/siteRuntime';
import {
  useTelegramBackButton,
  useTelegramWebApp,
} from './hooks/useTelegramWebApp';
import { Footer, MobileBottomNav, TopNavigation } from './components/LayoutChrome';
import { HomeView } from './components/HomeView';
import { ServiceCatalogView } from './components/ServiceCatalogView';
import { PortfolioView, type PortfolioSectionFilter } from './components/PortfolioView';
import { BookingModal } from './components/BookingModal';
import { MasterPinModal } from './components/MasterPinModal';
import { MasterModelStudioModal } from './components/MasterModelStudioModal';
import { OfflineBanner } from './components/PWAControls';
import type {
  BookingPrefill,
  ServiceItem,
  ServiceModelDoc,
  ServiceSection,
  TabId,
} from './types';

const MASTER_PIN_STORAGE_KEY = 'magdana_master_session_pin';
const MASTER_STATIC_STORAGE_KEY = 'magdana_master_static_unlocked';

export default function App() {
  const {
    guestName,
    guestFirstName,
    hapticImpact,
    hapticNotification,
    openTelegramChat,
  } = useTelegramWebApp();

  const initialRoute = useMemo(() => parseRouteFromLocation(), []);
  const offlineRuntime = isOfflineFileRuntime();

  const [activeTab, setActiveTab] = useState<TabId>(initialRoute.tab);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<BookingPrefill | null>(null);

  const [publishedColoringModels, setPublishedColoringModels] = useState<
    Record<string, ServiceModelDoc>
  >({});
  const [coloringModelsLoading, setColoringModelsLoading] = useState(!offlineRuntime);

  const [publishedHaircutModels, setPublishedHaircutModels] = useState<
    Record<string, ServiceModelDoc>
  >({});
  const [haircutModelsLoading, setHaircutModelsLoading] = useState(!offlineRuntime);

  const [publishedCareModels, setPublishedCareModels] = useState<
    Record<string, ServiceModelDoc>
  >({});
  const [careModelsLoading, setCareModelsLoading] = useState(!offlineRuntime);

  const [publishedStylingModels, setPublishedStylingModels] = useState<
    Record<string, ServiceModelDoc>
  >({});
  const [stylingModelsLoading, setStylingModelsLoading] = useState(!offlineRuntime);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean>(!offlineRuntime);
  const [masterPin, setMasterPin] = useState<string>(() => {
    try {
      return sessionStorage.getItem(MASTER_PIN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [staticMasterUnlocked, setStaticMasterUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(MASTER_STATIC_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [studioModalOpen, setStudioModalOpen] = useState(false);
  const [studioSection, setStudioSection] = useState<ServiceSection>('coloring');
  const [studioItemId, setStudioItemId] = useState<string | undefined>(undefined);
  const [portfolioLightboxOpen, setPortfolioLightboxOpen] = useState(false);
  const [lightboxCloseSignal, setLightboxCloseSignal] = useState(0);
  const [portfolioInitialSection, setPortfolioInitialSection] =
    useState<PortfolioSectionFilter>(initialRoute.portfolioSection);

  const isMasterUnlocked =
    !offlineRuntime &&
    (Boolean(masterPin) || (staticMasterUnlocked && Boolean(firebaseUser)));

  const publishedModelsBySection = useMemo(
    () => ({
      coloring: publishedColoringModels,
      haircuts: publishedHaircutModels,
      care: publishedCareModels,
      styling: publishedStylingModels,
    }),
    [
      publishedColoringModels,
      publishedHaircutModels,
      publishedCareModels,
      publishedStylingModels,
    ]
  );

  const anyModelsLoading =
    coloringModelsLoading ||
    haircutModelsLoading ||
    careModelsLoading ||
    stylingModelsLoading;

  useEffect(() => {
    updateDocumentSeo(activeTab, portfolioInitialSection);
  }, [activeTab, portfolioInitialSection]);

  useEffect(() => {
    const handleHistoryChange = () => {
      const parsed = parseRouteFromLocation();
      setActiveTab(parsed.tab);
      setPortfolioInitialSection(parsed.portfolioSection);
    };
    window.addEventListener('popstate', handleHistoryChange);
    window.addEventListener('hashchange', handleHistoryChange);
    return () => {
      window.removeEventListener('popstate', handleHistoryChange);
      window.removeEventListener('hashchange', handleHistoryChange);
    };
  }, []);

  useEffect(() => {
    if (offlineRuntime) {
      setApiAvailable(false);
      return;
    }
    let cancelled = false;
    void detectApiAvailability().then((available) => {
      if (!cancelled) {
        setApiAvailable(available);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [offlineRuntime]);

  useEffect(() => {
    if (offlineRuntime) return;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return unsubscribeAuth;
  }, [offlineRuntime]);

  useEffect(() => {
    if (offlineRuntime) return;
    const unsubscribeColoring = subscribePublishedModels(
      'coloring',
      (models) => {
        setPublishedColoringModels(models);
        setColoringModelsLoading(false);
      },
      () => {
        setColoringModelsLoading(false);
      }
    );
    const unsubscribeHaircuts = subscribePublishedModels(
      'haircuts',
      (models) => {
        setPublishedHaircutModels(models);
        setHaircutModelsLoading(false);
      },
      () => {
        setHaircutModelsLoading(false);
      }
    );
    const unsubscribeCare = subscribePublishedModels(
      'care',
      (models) => {
        setPublishedCareModels(models);
        setCareModelsLoading(false);
      },
      () => {
        setCareModelsLoading(false);
      }
    );
    const unsubscribeStyling = subscribePublishedModels(
      'styling',
      (models) => {
        setPublishedStylingModels(models);
        setStylingModelsLoading(false);
      },
      () => {
        setStylingModelsLoading(false);
      }
    );
    return () => {
      unsubscribeColoring();
      unsubscribeHaircuts();
      unsubscribeCare();
      unsubscribeStyling();
    };
  }, [offlineRuntime]);

  const handleSelectTab = useCallback(
    (tab: TabId) => {
      hapticImpact('light');
      const nextPortfolioSection: PortfolioSectionFilter =
        tab === 'portfolio' ? 'all' : portfolioInitialSection;
      if (tab === 'portfolio') {
        setPortfolioInitialSection('all');
      }
      setActiveTab(tab);
      syncLocationToRoute(tab, nextPortfolioSection);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [hapticImpact, portfolioInitialSection]
  );

  const handleOpenPortfolioCategory = useCallback(
    (section?: ServiceSection) => {
      hapticImpact('light');
      const targetSection: PortfolioSectionFilter = section ?? 'all';
      setPortfolioInitialSection(targetSection);
      setActiveTab('portfolio');
      syncLocationToRoute('portfolio', targetSection);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [hapticImpact]
  );

  const handlePortfolioSectionChange = useCallback(
    (section: PortfolioSectionFilter) => {
      setPortfolioInitialSection(section);
      syncLocationToRoute('portfolio', section, true);
    },
    []
  );

  const handleOpenBooking = useCallback(
    (item?: ServiceItem) => {
      hapticImpact('medium');
      if (item) {
        setBookingPrefill({
          serviceId: item.id,
          serviceTitle: item.title,
          section: item.section,
        });
      } else {
        setBookingPrefill(null);
      }
      setBookingOpen(true);
    },
    [hapticImpact]
  );

  const handleMasterUnlocked = useCallback(
    (verifiedPin: string, mode: 'pin' | 'static-google') => {
      hapticNotification('success');
      if (mode === 'pin') {
        setMasterPin(verifiedPin);
        setApiAvailable(true);
        try {
          sessionStorage.setItem(MASTER_PIN_STORAGE_KEY, verifiedPin);
        } catch {
          // Ignore private browsing quota errors
        }
      } else {
        setStaticMasterUnlocked(true);
        setApiAvailable(false);
        try {
          sessionStorage.setItem(MASTER_STATIC_STORAGE_KEY, '1');
        } catch {
          // Ignore private browsing quota errors
        }
      }
      setPinModalOpen(false);
      const targetSection: ServiceSection =
        activeTab === 'haircuts'
          ? 'haircuts'
          : activeTab === 'care'
            ? 'care'
            : activeTab === 'styling'
              ? 'styling'
              : 'coloring';
      setActiveTab(targetSection);
      syncLocationToRoute(targetSection);
      setStudioSection(targetSection);
      setStudioItemId(undefined);
      setStudioModalOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [activeTab, hapticNotification]
  );

  const handleLockMaster = useCallback(() => {
    hapticImpact('light');
    setMasterPin('');
    setStaticMasterUnlocked(false);
    setStudioModalOpen(false);
    try {
      sessionStorage.removeItem(MASTER_PIN_STORAGE_KEY);
      sessionStorage.removeItem(MASTER_STATIC_STORAGE_KEY);
    } catch {
      // Ignore storage error
    }
  }, [hapticImpact]);

  const handleOpenMasterStudio = useCallback(
    (section: ServiceSection, itemId?: string) => {
      hapticImpact('light');
      setStudioSection(section);
      setStudioItemId(itemId);
      setStudioModalOpen(true);
    },
    [hapticImpact]
  );

  const shouldShowTelegramBack =
    bookingOpen ||
    pinModalOpen ||
    studioModalOpen ||
    portfolioLightboxOpen ||
    activeTab !== 'home';

  const handleTelegramBack = useCallback(() => {
    hapticImpact('light');
    if (studioModalOpen) {
      setStudioModalOpen(false);
      return;
    }
    if (pinModalOpen) {
      setPinModalOpen(false);
      return;
    }
    if (bookingOpen) {
      setBookingOpen(false);
      return;
    }
    if (portfolioLightboxOpen) {
      setLightboxCloseSignal((prev) => prev + 1);
      return;
    }
    if (activeTab !== 'home') {
      setActiveTab('home');
      syncLocationToRoute('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [
    activeTab,
    bookingOpen,
    hapticImpact,
    pinModalOpen,
    portfolioLightboxOpen,
    studioModalOpen,
  ]);

  useTelegramBackButton(shouldShowTelegramBack, handleTelegramBack);

  return (
    <div className="min-h-screen flex flex-col bg-[#141211] text-[#F5F0EB]">
      <TopNavigation
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenBooking={() => handleOpenBooking()}
      />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'home' && (
              <HomeView
                guestFirstName={guestFirstName}
                onSelectTab={handleSelectTab}
                onOpenBooking={() => handleOpenBooking()}
                onOpenPortfolioCategory={handleOpenPortfolioCategory}
              />
            )}

            {activeTab === 'coloring' && (
              <ServiceCatalogView
                key="catalog-coloring"
                section="coloring"
                title="Окрашивание волос"
                lead="26 авторских и классических техник колористики — от воздушного AirTouch и французского балаяжа до деликатного шитья седины и 5D-глазирования."
                items={COLORING_SERVICES}
                categories={COLORING_CATEGORIES}
                enableTopSix
                enableSearch
                enableModelStudio
                studioButtonLabel="Студия фото моделей"
                publishedModels={publishedColoringModels}
                modelsLoading={coloringModelsLoading}
                isMasterUnlocked={isMasterUnlocked}
                onOpenMasterStudio={(id) => handleOpenMasterStudio('coloring', id)}
                onBookService={handleOpenBooking}
                onFilterTap={() => hapticImpact('light')}
              />
            )}

            {activeTab === 'haircuts' && (
              <ServiceCatalogView
                key="catalog-haircuts"
                section="haircuts"
                title="Стрижки"
                lead="20 выверенных форм с учётом архитектуры лица, плотности полотна и естественного роста волос — стрижка держит силуэт даже без сложной укладки."
                items={HAIRCUT_SERVICES}
                categories={HAIRCUT_CATEGORIES}
                enableTopSix
                enableSearch
                enableModelStudio
                studioButtonLabel="Студия фото стрижек"
                publishedModels={publishedHaircutModels}
                modelsLoading={haircutModelsLoading}
                isMasterUnlocked={isMasterUnlocked}
                onOpenMasterStudio={(id) => handleOpenMasterStudio('haircuts', id)}
                onBookService={handleOpenBooking}
                onFilterTap={() => hapticImpact('light')}
              />
            )}

            {activeTab === 'care' && (
              <ServiceCatalogView
                key="catalog-care"
                section="care"
                title="Спа-уход и реконструкция"
                lead="12 профессиональных программ глубокого восстановления, липидного питания, увлажнения и зеркального блеска для любого типа волос."
                items={CARE_SERVICES}
                categories={CARE_CATEGORIES}
                enableModelStudio
                studioButtonLabel="Студия фото спа-ухода"
                publishedModels={publishedCareModels}
                modelsLoading={careModelsLoading}
                isMasterUnlocked={isMasterUnlocked}
                onOpenMasterStudio={(id) => handleOpenMasterStudio('care', id)}
                onBookService={handleOpenBooking}
                onFilterTap={() => hapticImpact('light')}
              />
            )}

            {activeTab === 'styling' && (
              <ServiceCatalogView
                key="catalog-styling"
                section="styling"
                title="Укладки и причёски"
                lead="25 вечерних, свадебных и дневных образов: голливудская волна, объёмный брашинг, архитектурные пучки, глянцевые хвосты и плетения."
                items={STYLING_SERVICES}
                categories={STYLING_CATEGORIES}
                enableSearch
                enableModelStudio
                studioButtonLabel="Студия фото укладок"
                publishedModels={publishedStylingModels}
                modelsLoading={stylingModelsLoading}
                isMasterUnlocked={isMasterUnlocked}
                onOpenMasterStudio={(id) => handleOpenMasterStudio('styling', id)}
                onBookService={handleOpenBooking}
                onFilterTap={() => hapticImpact('light')}
              />
            )}

            {activeTab === 'portfolio' && (
              <PortfolioView
                key="studio-portfolio"
                publishedModelsBySection={publishedModelsBySection}
                modelsLoading={anyModelsLoading}
                isMasterUnlocked={isMasterUnlocked}
                initialSection={portfolioInitialSection}
                onSectionFilterChange={handlePortfolioSectionChange}
                onOpenMasterStudio={handleOpenMasterStudio}
                onBookService={handleOpenBooking}
                onSelectSection={handleSelectTab}
                onFilterTap={() => hapticImpact('light')}
                lightboxCloseSignal={lightboxCloseSignal}
                onLightboxOpenChange={setPortfolioLightboxOpen}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenTelegramChat={() => openTelegramChat()}
        isMasterUnlocked={isMasterUnlocked}
        onOpenMasterPin={() => {
          hapticImpact('light');
          setPinModalOpen(true);
        }}
        onLockMaster={handleLockMaster}
      />

      <MobileBottomNav activeTab={activeTab} onSelectTab={handleSelectTab} />

      <OfflineBanner />

      <BookingModal
        isOpen={bookingOpen}
        prefill={bookingPrefill}
        defaultGuestName={guestName}
        onClose={() => setBookingOpen(false)}
        onOpenTelegramChat={openTelegramChat}
        onSuccessFeedback={() => hapticNotification('success')}
      />

      <MasterPinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onUnlocked={handleMasterUnlocked}
        onErrorFeedback={() => hapticNotification('error')}
      />

      <MasterModelStudioModal
        isOpen={studioModalOpen}
        section={studioSection}
        initialItemId={studioItemId}
        masterPin={masterPin}
        apiAvailable={apiAvailable}
        firebaseUser={firebaseUser}
        publishedModels={
          studioSection === 'haircuts'
            ? publishedHaircutModels
            : studioSection === 'care'
              ? publishedCareModels
              : studioSection === 'styling'
                ? publishedStylingModels
                : publishedColoringModels
        }
        onClose={() => setStudioModalOpen(false)}
        onSuccessFeedback={() => hapticNotification('success')}
        onErrorFeedback={() => hapticNotification('error')}
      />
    </div>
  );
}
