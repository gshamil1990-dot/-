import { useMemo, useState } from 'react';
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Camera,
  SlidersHorizontal,
} from 'lucide-react';
import { formatPriceRange, SECTION_PRICE_SUMMARY } from '../data/catalog';
import type { ServiceItem, ServiceModelDoc, ServiceSection } from '../types';

interface ServiceCatalogViewProps {
  section: ServiceSection;
  title: string;
  lead: string;
  items: ServiceItem[];
  categories?: readonly string[];
  enableTopSix?: boolean;
  enableSearch?: boolean;
  enableModelStudio?: boolean;
  studioButtonLabel?: string;
  publishedModels?: Record<string, ServiceModelDoc>;
  modelsLoading?: boolean;
  isMasterUnlocked?: boolean;
  onOpenMasterStudio?: (itemId?: string) => void;
  onBookService: (item: ServiceItem) => void;
  onFilterTap?: () => void;
}

export function ServiceCatalogView({
  section,
  title,
  lead,
  items,
  categories,
  enableTopSix = false,
  enableSearch = false,
  enableModelStudio = false,
  studioButtonLabel = 'Студия фото моделей',
  publishedModels = {},
  modelsLoading = false,
  isMasterUnlocked = false,
  onOpenMasterStudio,
  onBookService,
  onFilterTap,
}: ServiceCatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [expandedAll, setExpandedAll] = useState(!enableTopSix);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const isFiltered = searchQuery.trim().length > 0 || selectedCategory !== 'Все';

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === 'Все' || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, selectedCategory]);

  const visibleItems = useMemo(() => {
    if (!enableTopSix || expandedAll || isFiltered) {
      return filteredItems;
    }
    const topItems = filteredItems.filter((item) => item.isTop);
    return topItems.length >= 6 ? topItems.slice(0, 6) : filteredItems.slice(0, 6);
  }, [enableTopSix, expandedAll, isFiltered, filteredItems]);

  const approvedCount = useMemo(() => {
    if (!enableModelStudio) return 0;
    return items.filter((item) => Boolean(publishedModels[item.id]?.imageDataUrl)).length;
  }, [enableModelStudio, items, publishedModels]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Все');
    onFilterTap?.();
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 space-y-8">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#D9A773]/14 pb-7">
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#D9A773]">
            <span>Каталог студии</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{items.length} услуг</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{SECTION_PRICE_SUMMARY[section]}</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium text-[#F5F0EB] leading-[1.08]">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-[#A69C93] leading-relaxed">
            {lead}
          </p>
        </div>

        {/* Master Studio Entry Bar (Visible ONLY when unlocked by PIN) */}
        {enableModelStudio && isMasterUnlocked && onOpenMasterStudio && (
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-[#1C1917] border border-[#D9A773]/30">
            <div className="space-y-0.5 pr-2">
              <p className="text-xs font-medium text-[#D9A773]">
                Режим мастера активен
              </p>
              <p className="text-xs text-[#A69C93] tabular-nums">
                В облаке утверждено фото: {approvedCount} из {items.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenMasterStudio()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#D9A773] text-[#141211] text-xs font-semibold hover:bg-[#E6BD90] transition-colors whitespace-nowrap min-h-[44px]"
            >
              <Sparkles className="w-4 h-4" />
              {studioButtonLabel}
            </button>
          </div>
        )}
      </div>

      {/* Search & Category Filter Toolbar */}
      {(enableSearch || (categories && categories.length > 0)) && (
        <div className="space-y-4">
          {enableSearch && (
            <div className="relative max-w-xl">
              <Search className="w-4 h-4 text-[#A69C93] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию, технике или эффекту..."
                aria-label="Поиск по каталогу"
                className="w-full h-12 pl-11 pr-10 rounded-xl bg-[#1C1917] border border-[#D9A773]/16 text-sm text-[#F5F0EB] placeholder:text-[#A69C93]/70 focus:outline-none focus:border-[#D9A773] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Очистить поиск"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#A69C93] hover:text-[#F5F0EB] rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {categories && categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <SlidersHorizontal className="w-4 h-4 text-[#A69C93] shrink-0 mr-1 hidden sm:block" />
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      onFilterTap?.();
                    }}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors min-h-[40px] border ${
                      active
                        ? 'bg-[#D9A773] text-[#141211] border-[#D9A773]'
                        : 'bg-[#1C1917] text-[#A69C93] border-[#D9A773]/14 hover:text-[#F5F0EB] hover:border-[#D9A773]/35'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Results Grid or Empty State */}
      {visibleItems.length === 0 ? (
        <div className="rounded-2xl bg-[#1C1917] border border-[#D9A773]/14 p-10 text-center space-y-4">
          <p className="font-serif text-2xl text-[#F5F0EB]">
            По вашему запросу ничего не найдено
          </p>
          <p className="text-sm text-[#A69C93]">
            Попробуйте другое слово или сбросьте выбранную категорию.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-5 py-2.5 rounded-lg border border-[#D9A773]/35 text-sm font-medium text-[#D9A773] hover:bg-[#D9A773] hover:text-[#141211] transition-colors"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleItems.map((item) => {
            const cloudModel = enableModelStudio ? publishedModels[item.id] : undefined;
            const resolvedImage = cloudModel?.imageDataUrl || item.defaultImage;
            const showVisualFrame = enableModelStudio;
            const imageBroken = failedImages[item.id];
            const fallbackSubtitle =
              section === 'haircuts'
                ? 'Подбор формы с учётом овала лица и типа волос'
                : section === 'care'
                  ? 'Индивидуальная спа-программа восстановления волос'
                  : section === 'styling'
                    ? 'Стойкий салонный стайлинг и подбор формы под образ'
                    : 'Индивидуальный подбор оттенка на консультации';

            return (
              <article
                key={item.id}
                className="group flex flex-col rounded-2xl overflow-hidden bg-[#1C1917] border border-[#D9A773]/14 hover:border-[#D9A773]/36 transition-all duration-200 hover:-translate-y-0.5"
              >
                {showVisualFrame && (
                  <div className="relative aspect-[3/4] w-full bg-[#191614] overflow-hidden border-b border-[#D9A773]/10">
                    {modelsLoading && !resolvedImage ? (
                      <div className="w-full h-full animate-pulse bg-[#231F1C]" />
                    ) : resolvedImage && !imageBroken ? (
                      <>
                        <img
                          src={resolvedImage}
                          alt={
                            section === 'haircuts'
                              ? `Модель со стрижкой ${item.title}`
                              : section === 'care'
                                ? `Спа-уход: ${item.title}`
                                : section === 'styling'
                                  ? `Укладка и причёска: ${item.title}`
                                  : `Модель с техникой окрашивания ${item.title}`
                          }
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedImages((prev) => ({ ...prev, [item.id]: true }))
                          }
                          className={`w-full h-full object-cover ${
                            section === 'care' ? 'object-center' : 'object-top'
                          } transition-transform duration-500 group-hover:scale-[1.03]`}
                        />
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-[#141211]/70 via-transparent to-transparent"
                        />
                      </>
                    ) : (
                      /* Elegant Editorial Fallback Container (Zero-Broken-Image Policy) */
                      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-[#231F1C] via-[#1B1816] to-[#141211]">
                        <span className="font-serif text-5xl text-[#D9A773]/30 leading-none select-none">
                          M
                        </span>
                        <p className="mt-4 font-serif text-lg text-[#F5F0EB]/75 max-w-[16rem]">
                          {item.title}
                        </p>
                        <p className="mt-1.5 text-xs text-[#A69C93]/75">
                          {fallbackSubtitle}
                        </p>
                      </div>
                    )}

                    {/* Discreet Master Action Trigger on Studio-Enabled Cards */}
                    {isMasterUnlocked && onOpenMasterStudio && (
                      <button
                        type="button"
                        onClick={() => onOpenMasterStudio(item.id)}
                        className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141211]/88 backdrop-blur-md border border-[#D9A773]/40 text-xs font-medium text-[#F5F0EB] hover:bg-[#D9A773] hover:text-[#141211] transition-colors min-h-[38px]"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {cloudModel ? 'Изменить фото' : 'Создать фото'}
                      </button>
                    )}
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1 justify-between space-y-5">
                  <div className="space-y-2.5">
                    {/* Clean Unboxed Metadata with Typographic Separator */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#A69C93]">
                      <span className="text-[#D9A773]">{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{item.duration}</span>
                      {item.isTop && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Выбор гостей</span>
                        </>
                      )}
                    </div>

                    <h2 className="font-serif text-2xl font-medium text-[#F5F0EB] leading-snug">
                      {item.title}
                    </h2>

                    {item.subtitle && (
                      <p className="text-xs text-[#D9A773]/85 font-medium">
                        {item.subtitle}
                      </p>
                    )}

                    <p className="text-sm text-[#A69C93] leading-relaxed pt-0.5">
                      {item.description}
                    </p>
                  </div>

                  {/* Aligned Price & Booking Action Footer */}
                  <div className="pt-4 border-t border-[#D9A773]/12 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] text-[#A69C93]">Ориентир стоимости</p>
                      <p className="text-base font-semibold text-[#F5F0EB] tabular-nums">
                        {formatPriceRange(item.priceMin, item.priceMax)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onBookService(item)}
                      className="px-4 py-2.5 rounded-lg border border-[#D9A773]/40 text-xs sm:text-sm font-medium text-[#D9A773] hover:bg-[#D9A773] hover:text-[#141211] active:scale-[0.98] transition-all whitespace-nowrap min-h-[42px]"
                    >
                      Записаться
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Top-6 Expand / Collapse Control */}
      {enableTopSix && !isFiltered && filteredItems.length > 6 && (
        <div className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setExpandedAll((prev) => !prev);
              onFilterTap?.();
            }}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#1C1917] border border-[#D9A773]/30 text-sm font-medium text-[#F5F0EB] hover:border-[#D9A773] hover:text-[#D9A773] transition-colors min-h-[48px]"
          >
            {expandedAll ? (
              <>
                <span>Свернуть до Топ-6</span>
                <ChevronUp className="w-4 h-4 text-[#D9A773]" />
              </>
            ) : (
              <>
                <span>Показать все {filteredItems.length} позиций</span>
                <ChevronDown className="w-4 h-4 text-[#D9A773]" />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
