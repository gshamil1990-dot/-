import { ArrowRight } from 'lucide-react';
import { EDITORIAL_ASSETS, SECTION_PRICE_SUMMARY } from '../data/catalog';
import type { ServiceSection, TabId } from '../types';

interface HomeViewProps {
  guestFirstName: string;
  onSelectTab: (tab: TabId) => void;
  onOpenBooking: () => void;
  onOpenPortfolioCategory?: (section?: ServiceSection) => void;
}

export function HomeView({
  guestFirstName,
  onSelectTab,
  onOpenBooking,
  onOpenPortfolioCategory,
}: HomeViewProps) {
  return (
    <div className="space-y-20 md:space-y-28">
      {/* Hero Section: Asymmetric Editorial Split */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left Copy Column */}
          <div className="lg:col-span-7 flex flex-col justify-between py-2 lg:py-6 space-y-10">
            <div className="space-y-6">
              <p className="text-xs sm:text-sm text-[#D9A773] tracking-wide">
                {guestFirstName
                  ? `Добро пожаловать, ${guestFirstName} · Авторская студия колористики`
                  : 'Авторская студия колористики и стиля Магданы'}
              </p>

              <h1 className="font-serif text-[clamp(2.5rem,5.2vw,4.4rem)] font-medium leading-[1.05] text-[#F5F0EB] tracking-[-0.01em] max-w-2xl">
                Искусство цвета, формы и живого блеска волос
              </h1>

              <p className="text-base sm:text-lg text-[#A69C93] leading-relaxed max-w-xl">
                Сложные техники окрашивания без потери качества, индивидуальная архитектура стрижек, глубокая спа-реконструкция и безупречные образы для особых событий.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={onOpenBooking}
                  className="px-7 py-3.5 rounded-lg bg-[#D9A773] text-[#141211] text-sm font-semibold hover:bg-[#E6BD90] active:scale-[0.98] transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6BD90] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141211]"
                >
                  Записаться на визит
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab('coloring')}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg border border-[#D9A773]/28 text-sm font-medium text-[#F5F0EB] hover:border-[#D9A773] hover:text-[#D9A773] transition-colors whitespace-nowrap"
                >
                  Каталог техник
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quiet Unboxed Editorial Metrics Strip */}
            <div className="pt-8 border-t border-[#D9A773]/14 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="font-serif text-2xl sm:text-3xl text-[#F5F0EB] tabular-nums">26</p>
                <p className="text-xs text-[#A69C93] mt-1">Техник окрашивания</p>
              </div>
              <div>
                <p className="font-serif text-2xl sm:text-3xl text-[#F5F0EB] tabular-nums">20</p>
                <p className="text-xs text-[#A69C93] mt-1">Архитектурных стрижек</p>
              </div>
              <div>
                <p className="font-serif text-2xl sm:text-3xl text-[#F5F0EB] tabular-nums">12</p>
                <p className="text-xs text-[#A69C93] mt-1">Спа-ритуалов ухода</p>
              </div>
              <div>
                <p className="font-serif text-2xl sm:text-3xl text-[#F5F0EB] tabular-nums">25</p>
                <p className="text-xs text-[#A69C93] mt-1">Укладок и причёсок</p>
              </div>
            </div>
          </div>

          {/* Right Editorial Portrait Column */}
          <div className="lg:col-span-5">
            <div className="relative h-[440px] sm:h-[520px] lg:h-full lg:min-h-[540px] rounded-2xl overflow-hidden bg-[#1C1917] border border-[#D9A773]/15">
              <img
                src={EDITORIAL_ASSETS.hero}
                alt="Авторское многомерное окрашивание AirTouch в студии Magdana"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#141211]/85 via-[#141211]/15 to-transparent"
              />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-[#D9A773]">Фирменный почерк</p>
                  <p className="font-serif text-xl sm:text-2xl text-[#F5F0EB] mt-0.5">
                    AirTouch · Cashmere Blonde
                  </p>
                </div>
                <span className="text-xs text-[#F5F0EB]/80 tabular-nums whitespace-nowrap">
                  от 8 000 ₽
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Curated Service Segments */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#D9A773]/12 pb-6">
          <div className="space-y-2">
            <p className="text-xs text-[#D9A773]">Направления студии</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#F5F0EB]">
              Три ключевых сегмента услуг
            </h2>
          </div>
          <p className="text-sm text-[#A69C93] max-w-md">
            Откройте интересующее направление, чтобы изучить полный перечень техник, время выполнения и диапазон стоимости.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Segment 1: Coloring */}
          <article className="group flex flex-col rounded-2xl overflow-hidden bg-[#1C1917] border border-[#D9A773]/14 hover:border-[#D9A773]/38 transition-all duration-200 hover:-translate-y-0.5">
            <button
              type="button"
              onClick={() => onSelectTab('coloring')}
              className="relative aspect-[3/4] w-full overflow-hidden bg-[#231F1C] text-left focus-visible:outline-none"
            >
              <img
                src={EDITORIAL_ASSETS.coloring}
                alt="Окрашивание волос: AirTouch, Шатуш, Балаяж"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#141211]/90 via-[#141211]/20 to-transparent"
              />
              <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-xs text-[#F5F0EB]/85">
                <span>26 техник</span>
                <span className="tabular-nums text-[#D9A773]">
                  {SECTION_PRICE_SUMMARY.coloring}
                </span>
              </div>
            </button>

            <div className="p-6 flex flex-col flex-1 justify-between space-y-5">
              <div className="space-y-2">
                <h3 className="font-serif text-2xl font-medium text-[#F5F0EB]">
                  01. Окрашивание и цвет
                </h3>
                <p className="text-sm text-[#A69C93] leading-relaxed">
                  AirTouch, Шатуш, Французский балаяж, шитьё седины, тотальный и кашемировый блонд, кислотное глазирование.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('coloring')}
                className="inline-flex items-center justify-between w-full pt-4 border-t border-[#D9A773]/12 text-sm font-medium text-[#D9A773] hover:text-[#E6BD90] transition-colors min-h-[44px]"
              >
                <span>Перейти в Окрашивание</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </article>

          {/* Segment 2: Haircuts & Spa Care */}
          <article className="group flex flex-col rounded-2xl overflow-hidden bg-[#1C1917] border border-[#D9A773]/14 hover:border-[#D9A773]/38 transition-all duration-200 hover:-translate-y-0.5">
            <button
              type="button"
              onClick={() => onSelectTab('haircuts')}
              className="relative aspect-[3/4] w-full overflow-hidden bg-[#231F1C] text-left focus-visible:outline-none"
            >
              <img
                src={EDITORIAL_ASSETS.haircutsCare}
                alt="Архитектурные стрижки и спа-уход за волосами"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#141211]/90 via-[#141211]/20 to-transparent"
              />
              <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-xs text-[#F5F0EB]/85">
                <span>20 стрижек · 12 спа-уходов</span>
                <span className="tabular-nums text-[#D9A773]">
                  {SECTION_PRICE_SUMMARY.haircuts}
                </span>
              </div>
            </button>

            <div className="p-6 flex flex-col flex-1 justify-between space-y-5">
              <div className="space-y-2">
                <h3 className="font-serif text-2xl font-medium text-[#F5F0EB]">
                  02. Стрижки и спа-уход
                </h3>
                <p className="text-sm text-[#A69C93] leading-relaxed">
                  Итальянский и французский боб, умная стрижка по росту волос, белковая реконструкция, холодный ботокс и 5D-блеск.
                </p>
              </div>
              <div className="pt-4 border-t border-[#D9A773]/12 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => onSelectTab('haircuts')}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#D9A773] hover:text-[#E6BD90] transition-colors min-h-[44px]"
                >
                  <span>Стрижки</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span aria-hidden="true" className="text-[#D9A773]/30">/</span>
                <button
                  type="button"
                  onClick={() => onSelectTab('care')}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#F5F0EB]/85 hover:text-[#D9A773] transition-colors min-h-[44px]"
                >
                  <span>Спа-уход</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </article>

          {/* Segment 3: Styling */}
          <article className="group flex flex-col rounded-2xl overflow-hidden bg-[#1C1917] border border-[#D9A773]/14 hover:border-[#D9A773]/38 transition-all duration-200 hover:-translate-y-0.5">
            <button
              type="button"
              onClick={() => onSelectTab('styling')}
              className="relative aspect-[3/4] w-full overflow-hidden bg-[#231F1C] text-left focus-visible:outline-none"
            >
              <img
                src={EDITORIAL_ASSETS.styling}
                alt="Вечерние и дневные укладки: Голливудская волна, пучки, плетения"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#141211]/90 via-[#141211]/20 to-transparent"
              />
              <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-xs text-[#F5F0EB]/85">
                <span>25 образов</span>
                <span className="tabular-nums text-[#D9A773]">
                  {SECTION_PRICE_SUMMARY.styling}
                </span>
              </div>
            </button>

            <div className="p-6 flex flex-col flex-1 justify-between space-y-5">
              <div className="space-y-2">
                <h3 className="font-serif text-2xl font-medium text-[#F5F0EB]">
                  03. Укладки и образы
                </h3>
                <p className="text-sm text-[#A69C93] leading-relaxed">
                  Голливудская волна, объёмный брашинг, текстурные и гладкие пучки, шёлковые хвосты, косы и эффект жидкого стекла.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('styling')}
                className="inline-flex items-center justify-between w-full pt-4 border-t border-[#D9A773]/12 text-sm font-medium text-[#D9A773] hover:text-[#E6BD90] transition-colors min-h-[44px]"
              >
                <span>Перейти в Укладки</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* Curated Studio Portfolio Showcase Bridge */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#D9A773]/12 pb-6">
          <div className="space-y-2">
            <p className="text-xs text-[#D9A773]">Избранные результаты</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#F5F0EB]">
              Портфолио выполненных работ
            </h2>
          </div>
          <button
            type="button"
            onClick={() =>
              onOpenPortfolioCategory
                ? onOpenPortfolioCategory()
                : onSelectTab('portfolio')
            }
            className="inline-flex items-center gap-2 text-sm font-medium text-[#D9A773] hover:text-[#E6BD90] transition-colors whitespace-nowrap self-start md:self-auto min-h-[44px]"
          >
            <span>Открыть всю галерею</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {(
            [
              {
                sectionKey: 'coloring',
                image: EDITORIAL_ASSETS.brazilianBlonde,
                section: 'Окрашивание',
                title: 'Бразильский блонд',
                position: 'object-top',
              },
              {
                sectionKey: 'haircuts',
                image: EDITORIAL_ASSETS.haircutBluntBob,
                section: 'Стрижки',
                title: 'Графичное каре',
                position: 'object-top',
              },
              {
                sectionKey: 'care',
                image: EDITORIAL_ASSETS.careLiquidGlass,
                section: 'Спа-уход',
                title: 'Жидкое стекло 5D',
                position: 'object-center',
              },
              {
                sectionKey: 'styling',
                image: EDITORIAL_ASSETS.stylingBlowout,
                section: 'Укладки',
                title: '90s Blowout',
                position: 'object-top',
              },
            ] as const
          ).map((work) => (
            <button
              key={work.title}
              type="button"
              onClick={() =>
                onOpenPortfolioCategory
                  ? onOpenPortfolioCategory(work.sectionKey)
                  : onSelectTab('portfolio')
              }
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#1C1917] border border-[#D9A773]/14 hover:border-[#D9A773]/38 text-left transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A773]"
            >
              <img
                src={work.image}
                alt={`${work.section}: ${work.title}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover ${work.position} transition-transform duration-500 group-hover:scale-[1.03]`}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#141211]/90 via-[#141211]/20 to-transparent"
              />
              <div className="absolute bottom-4 left-4 right-4 space-y-0.5">
                <p className="text-[11px] text-[#D9A773]">{work.section}</p>
                <p className="font-serif text-lg sm:text-xl text-[#F5F0EB] leading-snug">
                  {work.title}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
