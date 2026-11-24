import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Maximize2,
  Palette,
  Scissors,
  Search,
  SlidersHorizontal,
  Sparkles,
  Wind,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  ALL_SERVICES,
  formatPriceRange,
  SECTION_LABELS,
  SECTION_PRICE_SUMMARY,
} from '../data/catalog';
import type {
  ServiceItem,
  ServiceModelDoc,
  ServiceSection,
} from '../types';

export type PortfolioSectionFilter = 'all' | ServiceSection;

interface PortfolioViewProps {
  publishedModelsBySection: Record<ServiceSection, Record<string, ServiceModelDoc>>;
  modelsLoading: boolean;
  isMasterUnlocked: boolean;
  initialSection?: PortfolioSectionFilter;
  onSectionFilterChange?: (section: PortfolioSectionFilter) => void;
  onOpenMasterStudio: (section: ServiceSection, itemId?: string) => void;
  onBookService: (item: ServiceItem) => void;
  onSelectSection: (section: ServiceSection) => void;
  onFilterTap?: () => void;
  lightboxCloseSignal?: number;
  onLightboxOpenChange?: (isOpen: boolean) => void;
}

interface PortfolioEntry {
  key: string;
  service: ServiceItem;
  imageUrl: string;
  isCloudPublished: boolean;
  cloudDoc?: ServiceModelDoc;
}

interface PortfolioCategoryOption {
  id: PortfolioSectionFilter;
  label: string;
  description: string;
  icon: typeof LayoutGrid;
}

const PORTFOLIO_CATEGORY_MENU: readonly PortfolioCategoryOption[] = [
  {
    id: 'all',
    label: 'Все работы',
    description: 'Полная кураторская коллекция студии',
    icon: LayoutGrid,
  },
  {
    id: 'coloring',
    label: SECTION_LABELS.coloring,
    description: 'AirTouch, балаяж, шатуш, блонд и шитьё седины',
    icon: Palette,
  },
  {
    id: 'haircuts',
    label: SECTION_LABELS.haircuts,
    description: 'Каре, боб, бабочка и умная архитектура формы',
    icon: Scissors,
  },
  {
    id: 'care',
    label: SECTION_LABELS.care,
    description: 'Реконструкция, холодный ботокс и 5D-блеск',
    icon: Sparkles,
  },
  {
    id: 'styling',
    label: SECTION_LABELS.styling,
    description: 'Волны, брашинг, пучки, хвосты и плетения',
    icon: Wind,
  },
];

const CURATED_INTERLEAVE_ORDER: ServiceSection[] = [
  'coloring',
  'haircuts',
  'care',
  'styling',
];

export function PortfolioView({
  publishedModelsBySection,
  modelsLoading,
  isMasterUnlocked,
  initialSection = 'all',
  onSectionFilterChange,
  onOpenMasterStudio,
  onBookService,
  onSelectSection,
  onFilterTap,
  lightboxCloseSignal = 0,
  onLightboxOpenChange,
}: PortfolioViewProps) {
  const [selectedSection, setSelectedSection] =
    useState<PortfolioSectionFilter>(initialSection);
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [onlyCloudWorks, setOnlyCloudWorks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedSection(initialSection);
    setSelectedCategory('Все');
  }, [initialSection]);

  useEffect(() => {
    if (!categoryMenuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(event.target as Node)
      ) {
        setCategoryMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCategoryMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [categoryMenuOpen]);

  // Build curated gallery combining live studio cloud publications + studio high-res assets
  const allEntries = useMemo<PortfolioEntry[]>(() => {
    const seenStaticUrls = new Set<string>();
    const cloudEntries: PortfolioEntry[] = [];
    const editorialBySection: Record<ServiceSection, PortfolioEntry[]> = {
      coloring: [],
      haircuts: [],
      styling: [],
      care: [],
    };

    for (const service of ALL_SERVICES) {
      const cloudDoc = publishedModelsBySection[service.section]?.[service.id];
      if (cloudDoc?.imageDataUrl) {
        cloudEntries.push({
          key: `${service.section}:${service.id}`,
          service,
          imageUrl: cloudDoc.imageDataUrl,
          isCloudPublished: true,
          cloudDoc,
        });
        continue;
      }

      if (service.defaultImage && !seenStaticUrls.has(service.defaultImage)) {
        seenStaticUrls.add(service.defaultImage);
        editorialBySection[service.section].push({
          key: `${service.section}:${service.id}`,
          service,
          imageUrl: service.defaultImage,
          isCloudPublished: false,
        });
      }
    }

    cloudEntries.sort((a, b) => {
      const timeA = a.cloudDoc?.updatedAt?.getTime() ?? 0;
      const timeB = b.cloudDoc?.updatedAt?.getTime() ?? 0;
      return timeB - timeA;
    });

    // Interleave studio editorial works across all 4 directions for balanced monograph pacing
    const interleavedEditorial: PortfolioEntry[] = [];
    let cursor = 0;
    let remaining = true;
    while (remaining) {
      remaining = false;
      for (const sec of CURATED_INTERLEAVE_ORDER) {
        const list = editorialBySection[sec];
        if (cursor < list.length) {
          interleavedEditorial.push(list[cursor]);
          remaining = true;
        }
      }
      cursor += 1;
    }

    return [...cloudEntries, ...interleavedEditorial];
  }, [publishedModelsBySection]);

  const countsBySection = useMemo<Record<PortfolioSectionFilter, number>>(() => {
    const counts: Record<PortfolioSectionFilter, number> = {
      all: allEntries.length,
      coloring: 0,
      haircuts: 0,
      care: 0,
      styling: 0,
    };
    for (const entry of allEntries) {
      counts[entry.service.section] += 1;
    }
    return counts;
  }, [allEntries]);

  const cloudWorksCount = useMemo(
    () => allEntries.filter((entry) => entry.isCloudPublished).length,
    [allEntries]
  );

  // Categories available within the currently selected section
  const availableCategories = useMemo<string[]>(() => {
    if (selectedSection === 'all') return [];
    const seen = new Set<string>();
    const cats: string[] = [];
    for (const entry of allEntries) {
      if (entry.service.section !== selectedSection) continue;
      if (!seen.has(entry.service.category)) {
        seen.add(entry.service.category);
        cats.push(entry.service.category);
      }
    }
    return cats.length > 1 ? ['Все', ...cats] : [];
  }, [allEntries, selectedSection]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allEntries.filter((entry) => {
      if (selectedSection !== 'all' && entry.service.section !== selectedSection) {
        return false;
      }
      if (
        selectedSection !== 'all' &&
        selectedCategory !== 'Все' &&
        entry.service.category !== selectedCategory
      ) {
        return false;
      }
      if (onlyCloudWorks && !entry.isCloudPublished) {
        return false;
      }
      if (!q) return true;
      const { service, cloudDoc } = entry;
      return (
        service.title.toLowerCase().includes(q) ||
        (service.subtitle && service.subtitle.toLowerCase().includes(q)) ||
        service.category.toLowerCase().includes(q) ||
        service.description.toLowerCase().includes(q) ||
        SECTION_LABELS[service.section].toLowerCase().includes(q) ||
        Boolean(cloudDoc?.promptUsed?.toLowerCase().includes(q))
      );
    });
  }, [allEntries, selectedSection, selectedCategory, onlyCloudWorks, searchQuery]);

  const activeIndex = useMemo(() => {
    if (!activeKey) return -1;
    return filteredEntries.findIndex((entry) => entry.key === activeKey);
  }, [activeKey, filteredEntries]);

  const activeEntry = activeIndex >= 0 ? filteredEntries[activeIndex] : null;
  const isLightboxOpen = Boolean(activeEntry);

  const closeLightbox = useCallback(() => {
    setActiveKey(null);
    setIsZoomed(false);
  }, []);

  const stepLightbox = useCallback(
    (delta: number) => {
      if (filteredEntries.length <= 1 || activeIndex < 0) return;
      const nextIndex =
        (activeIndex + delta + filteredEntries.length) % filteredEntries.length;
      setActiveKey(filteredEntries[nextIndex].key);
      setIsZoomed(false);
      onFilterTap?.();
    },
    [activeIndex, filteredEntries, onFilterTap]
  );

  useEffect(() => {
    onLightboxOpenChange?.(isLightboxOpen);
    return () => {
      if (isLightboxOpen) {
        onLightboxOpenChange?.(false);
      }
    };
  }, [isLightboxOpen, onLightboxOpenChange]);

  useEffect(() => {
    if (lightboxCloseSignal > 0) {
      closeLightbox();
    }
  }, [lightboxCloseSignal, closeLightbox]);

  // Keyboard navigation & scroll lock when Lightbox is open
  useEffect(() => {
    if (!isLightboxOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeLightbox();
      } else if (event.key === 'ArrowRight') {
        stepLightbox(1);
      } else if (event.key === 'ArrowLeft') {
        stepLightbox(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, closeLightbox, stepLightbox]);

  const handleSelectSectionFilter = (next: PortfolioSectionFilter) => {
    setSelectedSection(next);
    setSelectedCategory('Все');
    setCategoryMenuOpen(false);
    onSectionFilterChange?.(next);
    onFilterTap?.();
  };

  const resetFilters = () => {
    setSelectedSection('all');
    setSelectedCategory('Все');
    setOnlyCloudWorks(false);
    setSearchQuery('');
    setCategoryMenuOpen(false);
    onSectionFilterChange?.('all');
    onFilterTap?.();
  };

  const activeCategoryOption =
    PORTFOLIO_CATEGORY_MENU.find((opt) => opt.id === selectedSection) ??
    PORTFOLIO_CATEGORY_MENU[0];
  const ActiveCategoryIcon = activeCategoryOption.icon;

  const isFeaturedBentoMode =
    selectedSection === 'all' &&
    !searchQuery.trim() &&
    !onlyCloudWorks &&
    filteredEntries.length >= 5;

  const getObjectPosition = (entry: PortfolioEntry) =>
    entry.service.section === 'care' ? 'object-center' : 'object-top';

  const formatWorkCounter = (index: number, total: number) =>
    `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#D9A773]/14 pb-7">
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#D9A773]">
            <span>Портфолио студии</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{allEntries.length} работ</span>
            <span aria-hidden="true">·</span>
            <span>4 направления</span>
            {cloudWorksCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {cloudWorksCount} в облаке студии
                </span>
              </>
            )}
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium text-[#F5F0EB] leading-[1.08]">
            Галерея выполненных работ
          </h1>
          <p className="text-sm sm:text-base text-[#A69C93] leading-relaxed">
            Кураторская коллекция результатов студии в высоком разрешении: сложные растяжки цвета, точная архитектура стрижек, глубокие спа-ритуалы и подиумные укладки. Нажмите на любой кадр, чтобы рассмотреть детали и записаться на выбранную технику.
          </p>
        </div>

        {/* Discreet Master Studio Entry (Visible only when Master PIN is unlocked) */}
        {isMasterUnlocked && (
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-[#1C1917] border border-[#D9A773]/30 shrink-0">
            <div className="space-y-0.5 pr-2">
              <p className="text-xs font-medium text-[#D9A773]">
                Режим мастера активен
              </p>
              <p className="text-xs text-[#A69C93] tabular-nums">
                Опубликовано в облаке: {cloudWorksCount} работ
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onOpenMasterStudio(
                  selectedSection === 'all' ? 'coloring' : selectedSection
                )
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#D9A773] text-[#141211] text-xs font-semibold hover:bg-[#E6BD90] transition-colors whitespace-nowrap min-h-[44px]"
            >
              <Sparkles className="w-4 h-4" />
              Добавить работу в студии
            </button>
          </div>
        )}
      </div>

      {/* Category Filter Menu & Search Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Mobile Category Filter Dropdown Menu */}
          <div ref={categoryMenuRef} className="relative sm:hidden">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={categoryMenuOpen}
              aria-label="Выбрать категорию портфолио"
              onClick={() => {
                setCategoryMenuOpen((prev) => !prev);
                onFilterTap?.();
              }}
              className="w-full h-12 px-4 rounded-xl bg-[#1C1917] border border-[#D9A773]/28 flex items-center justify-between gap-3 text-sm text-[#F5F0EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A773]"
            >
              <span className="inline-flex items-center gap-2.5 min-w-0">
                <ActiveCategoryIcon className="w-4 h-4 text-[#D9A773] shrink-0" />
                <span className="font-medium truncate">
                  {activeCategoryOption.label}
                </span>
                <span className="text-xs text-[#A69C93] tabular-nums shrink-0">
                  ({countsBySection[selectedSection]})
                </span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#D9A773] shrink-0 transition-transform duration-200 ${
                  categoryMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {categoryMenuOpen && (
              <div
                role="listbox"
                aria-label="Категории портфолио"
                className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 rounded-2xl bg-[#1C1917] border border-[#D9A773]/28 shadow-2xl overflow-hidden divide-y divide-[#D9A773]/10"
              >
                {PORTFOLIO_CATEGORY_MENU.map((option) => {
                  const Icon = option.icon;
                  const isActive = selectedSection === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => handleSelectSectionFilter(option.id)}
                      className={`w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left transition-colors min-h-[52px] ${
                        isActive
                          ? 'bg-[#D9A773]/14 text-[#F5F0EB]'
                          : 'text-[#A69C93] hover:bg-[#231F1C] hover:text-[#F5F0EB]'
                      }`}
                    >
                      <span className="flex items-start gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            isActive ? 'text-[#D9A773]' : 'text-[#A69C93]'
                          }`}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-[#F5F0EB] leading-snug">
                            {option.label}
                          </span>
                          <span className="block text-xs text-[#A69C93] truncate mt-0.5">
                            {option.description}
                          </span>
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-2 shrink-0">
                        <span className="text-xs text-[#A69C93] tabular-nums">
                          {countsBySection[option.id]}
                        </span>
                        {isActive && (
                          <Check className="w-4 h-4 text-[#D9A773]" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop & Tablet Category Filter Menu Bar */}
          <div
            role="tablist"
            aria-label="Меню фильтрации по категориям услуг"
            className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-[#1C1917] border border-[#D9A773]/16 overflow-x-auto no-scrollbar"
          >
            {PORTFOLIO_CATEGORY_MENU.map((option) => {
              const Icon = option.icon;
              const isActive = selectedSection === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  data-category={option.id}
                  onClick={() => handleSelectSectionFilter(option.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A773] ${
                    isActive
                      ? 'bg-[#D9A773] text-[#141211]'
                      : 'text-[#A69C93] hover:text-[#F5F0EB] hover:bg-[#231F1C]'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-[#141211]' : 'text-[#D9A773]/80'
                    }`}
                  />
                  <span>{option.label}</span>
                  <span
                    className={`tabular-nums text-[11px] ${
                      isActive ? 'text-[#141211]/75' : 'text-[#A69C93]/75'
                    }`}
                  >
                    {countsBySection[option.id]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72 xl:w-80 shrink-0">
            <Search className="w-4 h-4 text-[#A69C93] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по технике или эффекту..."
              aria-label="Поиск по портфолио"
              className="w-full h-11 pl-10 pr-9 rounded-xl bg-[#1C1917] border border-[#D9A773]/16 text-sm text-[#F5F0EB] placeholder:text-[#A69C93]/70 focus:outline-none focus:border-[#D9A773] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Очистить поиск"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#A69C93] hover:text-[#F5F0EB] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Active Category Summary Strip (when filtered to Coloring, Haircuts, Care, or Styling) */}
        {selectedSection !== 'all' && (
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-[#D9A773]/12 text-xs sm:text-sm">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[#A69C93]">
              <span className="font-medium text-[#F5F0EB]">
                {SECTION_LABELS[selectedSection]}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                Показано {filteredEntries.length} из{' '}
                {countsBySection[selectedSection]}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums text-[#D9A773]">
                {SECTION_PRICE_SUMMARY[selectedSection]}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => onSelectSection(selectedSection)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D9A773] hover:text-[#E6BD90] transition-colors whitespace-nowrap"
              >
                <span>Прайс раздела</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <span aria-hidden="true" className="text-[#D9A773]/25">
                /
              </span>
              <button
                type="button"
                onClick={() => handleSelectSectionFilter('all')}
                className="text-xs text-[#A69C93] hover:text-[#F5F0EB] transition-colors whitespace-nowrap"
              >
                Все направления
              </button>
            </div>
          </div>
        )}

        {/* Secondary Category Filter Strip & Cloud Filter */}
        {(availableCategories.length > 0 || cloudWorksCount > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {availableCategories.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <SlidersHorizontal className="w-4 h-4 text-[#A69C93] shrink-0 mr-1 hidden sm:block" />
                {availableCategories.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        onFilterTap?.();
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors min-h-[38px] border ${
                        active
                          ? 'bg-[#231F1C] text-[#D9A773] border-[#D9A773]/55'
                          : 'bg-transparent text-[#A69C93] border-[#D9A773]/14 hover:text-[#F5F0EB] hover:border-[#D9A773]/30'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div />
            )}

            {cloudWorksCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setOnlyCloudWorks((prev) => !prev);
                  onFilterTap?.();
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors min-h-[38px] border ${
                  onlyCloudWorks
                    ? 'bg-[#D9A773]/18 text-[#D9A773] border-[#D9A773]/60'
                    : 'bg-[#1C1917] text-[#A69C93] border-[#D9A773]/14 hover:text-[#F5F0EB]'
                }`}
              >
                Только новые работы студии ({cloudWorksCount})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Gallery Grid / Loading / Empty State */}
      {modelsLoading && allEntries.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="aspect-[3/4] rounded-2xl bg-[#1C1917] border border-[#D9A773]/12 animate-pulse"
            />
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="rounded-2xl bg-[#1C1917] border border-[#D9A773]/14 p-10 text-center space-y-4">
          <p className="font-serif text-2xl text-[#F5F0EB]">
            По выбранным параметрам работы не найдены
          </p>
          <p className="text-sm text-[#A69C93]">
            Попробуйте изменить направление, очистить строку поиска или вернуться ко всей коллекции.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-5 py-2.5 rounded-lg border border-[#D9A773]/35 text-sm font-medium text-[#D9A773] hover:bg-[#D9A773] hover:text-[#141211] transition-colors min-h-[44px]"
          >
            Показать все работы
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntries.map((entry, idx) => {
            const isSpotlight = isFeaturedBentoMode && idx === 0;
            const imageBroken = failedImages[entry.key];

            return (
              <article
                key={entry.key}
                className={`group relative rounded-2xl overflow-hidden bg-[#1C1917] border border-[#D9A773]/14 hover:border-[#D9A773]/40 transition-all duration-200 hover:-translate-y-0.5 ${
                  isSpotlight
                    ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2'
                    : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveKey(entry.key);
                    setIsZoomed(false);
                    onFilterTap?.();
                  }}
                  aria-label={`Открыть работу: ${entry.service.title}`}
                  className={`relative block w-full text-left overflow-hidden bg-[#191614] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D9A773] ${
                    isSpotlight
                      ? 'aspect-[3/4] lg:aspect-auto lg:h-full lg:min-h-[680px]'
                      : 'aspect-[3/4]'
                  }`}
                >
                  {!imageBroken ? (
                    <img
                      src={entry.imageUrl}
                      alt={`${SECTION_LABELS[entry.service.section]}: ${entry.service.title}`}
                      loading={idx < 4 ? 'eager' : 'lazy'}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [entry.key]: true,
                        }))
                      }
                      className={`w-full h-full object-cover ${getObjectPosition(
                        entry
                      )} transition-transform duration-500 ease-out group-hover:scale-[1.03]`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-[#231F1C] via-[#1B1816] to-[#141211]">
                      <span className="font-serif text-5xl text-[#D9A773]/30 leading-none select-none">
                        M
                      </span>
                      <p className="mt-4 font-serif text-xl text-[#F5F0EB]/80 max-w-[16rem]">
                        {entry.service.title}
                      </p>
                      <p className="mt-1 text-xs text-[#A69C93]">
                        {SECTION_LABELS[entry.service.section]}
                      </p>
                    </div>
                  )}

                  {/* Measured Contrast Scrim for WCAG AA Caption Legibility */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#141211]/92 via-[#141211]/28 to-transparent"
                  />

                  {/* Subtle Expand Affordance */}
                  <span
                    aria-hidden="true"
                    className="absolute top-4 left-4 w-9 h-9 rounded-lg bg-[#141211]/72 backdrop-blur-md border border-[#D9A773]/24 flex items-center justify-center text-[#F5F0EB] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200"
                  >
                    <Maximize2 className="w-4 h-4 text-[#D9A773]" />
                  </span>

                  {/* Clean Unboxed Editorial Metadata Overlay */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 ${
                      isSpotlight ? 'p-6 sm:p-8' : 'p-5'
                    } space-y-2`}
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#F5F0EB]/80">
                      <span className="text-[#D9A773] font-medium">
                        {SECTION_LABELS[entry.service.section]}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{entry.service.category}</span>
                      {entry.isCloudPublished && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#E6BD90]">Новое в студии</span>
                        </>
                      )}
                    </div>

                    <h2
                      className={`font-serif font-medium text-[#F5F0EB] leading-snug ${
                        isSpotlight
                          ? 'text-2xl sm:text-4xl max-w-xl'
                          : 'text-xl sm:text-2xl'
                      }`}
                    >
                      {entry.service.title}
                    </h2>

                    {isSpotlight && entry.service.subtitle && (
                      <p className="text-sm text-[#F5F0EB]/78 max-w-lg leading-relaxed hidden sm:block">
                        {entry.service.subtitle} — {entry.service.description}
                      </p>
                    )}

                    <div className="pt-1 flex items-center justify-between gap-4 text-xs text-[#A69C93]">
                      <span className="tabular-nums text-[#F5F0EB]/90 font-medium">
                        {formatPriceRange(
                          entry.service.priceMin,
                          entry.service.priceMax
                        )}
                      </span>
                      <span className="tabular-nums">{entry.service.duration}</span>
                    </div>
                  </div>
                </button>

                {/* Discreet Master Studio Edit Trigger */}
                {isMasterUnlocked && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenMasterStudio(entry.service.section, entry.service.id);
                    }}
                    className="absolute top-3.5 right-3.5 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141211]/88 backdrop-blur-md border border-[#D9A773]/40 text-xs font-medium text-[#F5F0EB] hover:bg-[#D9A773] hover:text-[#141211] transition-colors min-h-[38px]"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Обновить
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Fullscreen High-Resolution Lightbox Modal */}
      {activeEntry && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="portfolio-lightbox-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0A09]/94 backdrop-blur-md p-0 sm:p-4 lg:p-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLightbox();
          }}
        >
          <div className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-6xl bg-[#141211] sm:rounded-2xl border-0 sm:border sm:border-[#D9A773]/22 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-2xl">
            {/* Top-right High-Contrast Close Button */}
            <button
              type="button"
              onClick={closeLightbox}
              aria-label="Закрыть просмотр"
              className="fixed sm:absolute top-3 right-3 z-30 w-11 h-11 rounded-xl bg-[#141211]/88 backdrop-blur-md border border-[#D9A773]/30 flex items-center justify-center text-[#F5F0EB] hover:bg-[#D9A773] hover:text-[#141211] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A773]"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Stage: High-Resolution Image Viewer */}
            <div className="lg:col-span-7 relative bg-[#0F0D0C] flex items-center justify-center min-h-[54vh] sm:min-h-[60vh] lg:min-h-[640px] lg:max-h-[92vh] overflow-hidden border-b lg:border-b-0 lg:border-r border-[#D9A773]/14">
              {!failedImages[activeEntry.key] ? (
                <div className="w-full h-full flex items-center justify-center overflow-auto">
                  <img
                    src={activeEntry.imageUrl}
                    alt={`${SECTION_LABELS[activeEntry.service.section]}: ${activeEntry.service.title}`}
                    referrerPolicy="no-referrer"
                    onClick={() => setIsZoomed((prev) => !prev)}
                    className={`transition-transform duration-300 ease-out cursor-zoom-in ${
                      isZoomed
                        ? 'scale-150 cursor-zoom-out max-h-[88vh] w-auto object-contain'
                        : 'max-h-[78vh] lg:max-h-[88vh] w-full h-full object-contain'
                    }`}
                  />
                </div>
              ) : (
                <div className="p-12 text-center space-y-3">
                  <span className="font-serif text-6xl text-[#D9A773]/30">M</span>
                  <p className="font-serif text-2xl text-[#F5F0EB]">
                    {activeEntry.service.title}
                  </p>
                </div>
              )}

              {/* Prev / Next Gallery Arrows */}
              {filteredEntries.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => stepLightbox(-1)}
                    aria-label="Предыдущая работа"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-[#141211]/82 backdrop-blur-md border border-[#D9A773]/28 flex items-center justify-center text-[#F5F0EB] hover:border-[#D9A773] hover:text-[#D9A773] transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepLightbox(1)}
                    aria-label="Следующая работа"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-[#141211]/82 backdrop-blur-md border border-[#D9A773]/28 flex items-center justify-center text-[#F5F0EB] hover:border-[#D9A773] hover:text-[#D9A773] transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Zoom Toggle Control */}
              {!failedImages[activeEntry.key] && (
                <button
                  type="button"
                  onClick={() => setIsZoomed((prev) => !prev)}
                  className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141211]/82 backdrop-blur-md border border-[#D9A773]/24 text-xs text-[#F5F0EB] hover:border-[#D9A773] hover:text-[#D9A773] transition-colors min-h-[38px]"
                >
                  {isZoomed ? (
                    <>
                      <ZoomOut className="w-3.5 h-3.5" />
                      <span>Уменьшить</span>
                    </>
                  ) : (
                    <>
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Увеличить детали</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Right Panel: Editorial Dossier & Direct Booking */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-6 lg:overflow-y-auto lg:max-h-[92vh]">
              <div className="space-y-5">
                {/* Counter & Navigation Row */}
                <div className="flex items-center justify-between gap-3 pr-10">
                  <span className="text-xs text-[#A69C93] tabular-nums">
                    Работа {formatWorkCounter(activeIndex, filteredEntries.length)}
                  </span>
                  {activeEntry.isCloudPublished && (
                    <span className="text-xs text-[#D9A773]">
                      Студия MAGDANA · Облако
                    </span>
                  )}
                </div>

                {/* Unboxed Taxonomy & Title */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#A69C93]">
                    <span className="text-[#D9A773] font-medium">
                      {SECTION_LABELS[activeEntry.service.section]}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{activeEntry.service.category}</span>
                    {activeEntry.service.isTop && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Выбор гостей</span>
                      </>
                    )}
                  </div>

                  <h2
                    id="portfolio-lightbox-title"
                    className="font-serif text-3xl sm:text-4xl font-medium text-[#F5F0EB] leading-[1.12]"
                  >
                    {activeEntry.service.title}
                  </h2>

                  {activeEntry.service.subtitle && (
                    <p className="text-sm text-[#D9A773]/90 font-medium">
                      {activeEntry.service.subtitle}
                    </p>
                  )}
                </div>

                <p className="text-sm text-[#A69C93] leading-relaxed">
                  {activeEntry.service.description}
                </p>

                {/* Studio Art-Direction Credit if published from Master Studio */}
                {activeEntry.cloudDoc?.promptUsed && (
                  <div className="pt-4 border-t border-[#D9A773]/12 space-y-1">
                    <p className="text-xs text-[#A69C93]">Детали образа</p>
                    <p className="text-xs text-[#F5F0EB]/85 leading-relaxed">
                      {activeEntry.cloudDoc.promptUsed}
                    </p>
                  </div>
                )}

                {/* Specs Strip */}
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-[#D9A773]/14">
                  <div>
                    <p className="text-[11px] text-[#A69C93]">Ориентир стоимости</p>
                    <p className="mt-1 text-base font-semibold text-[#F5F0EB] tabular-nums">
                      {formatPriceRange(
                        activeEntry.service.priceMin,
                        activeEntry.service.priceMax
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#A69C93]">Время в студии</p>
                    <p className="mt-1 text-base font-medium text-[#F5F0EB] tabular-nums">
                      {activeEntry.service.duration}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = activeEntry.service;
                    closeLightbox();
                    onBookService(target);
                  }}
                  className="w-full py-3.5 px-5 rounded-xl bg-[#D9A773] text-[#141211] text-sm font-semibold hover:bg-[#E6BD90] active:scale-[0.99] transition-all min-h-[48px]"
                >
                  Записаться на эту услугу
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const targetSection = activeEntry.service.section;
                    closeLightbox();
                    onSelectSection(targetSection);
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-[#D9A773]/25 text-xs sm:text-sm font-medium text-[#F5F0EB] hover:border-[#D9A773] hover:text-[#D9A773] transition-colors inline-flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <span>
                    Все услуги раздела «{SECTION_LABELS[activeEntry.service.section]}»
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {isMasterUnlocked && (
                  <button
                    type="button"
                    onClick={() => {
                      const { section, id } = activeEntry.service;
                      closeLightbox();
                      onOpenMasterStudio(section, id);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1C1917] border border-[#D9A773]/22 text-xs font-medium text-[#A69C93] hover:text-[#D9A773] hover:border-[#D9A773]/50 transition-colors inline-flex items-center justify-center gap-2 min-h-[42px]"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Изменить фото в студии мастера</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
