import { SECTION_LABELS } from '../data/catalog';
import type { PortfolioSectionFilter } from '../components/PortfolioView';
import type { ServiceSection, TabId } from '../types';

declare global {
  interface Window {
    __MAGDANA_OFFLINE__?: boolean;
  }
}

export const TAB_ROUTES: Record<TabId, string> = {
  home: '/',
  coloring: '/coloring',
  haircuts: '/haircuts',
  care: '/care',
  styling: '/styling',
  portfolio: '/portfolio',
};

const ROUTE_TO_TAB: Record<string, TabId> = {
  '/': 'home',
  '/coloring': 'coloring',
  '/haircuts': 'haircuts',
  '/care': 'care',
  '/styling': 'styling',
  '/portfolio': 'portfolio',
};

const VALID_PORTFOLIO_SECTIONS: ReadonlySet<string> = new Set<ServiceSection>([
  'coloring',
  'haircuts',
  'care',
  'styling',
]);

interface RouteSeoMeta {
  title: string;
  description: string;
}

const ROUTE_SEO: Record<TabId, RouteSeoMeta> = {
  home: {
    title: 'MAGDANA — Студия колористики, стрижек и стиля',
    description:
      'Авторское окрашивание AirTouch, Шатуш и Балаяж, архитектурные стрижки, спа-реконструкция и вечерние укладки в студии MAGDANA. Онлайн-запись.',
  },
  coloring: {
    title: 'Окрашивание волос — MAGDANA | AirTouch, Шатуш, Балаяж',
    description:
      '26 авторских и классических техник колористики в студии MAGDANA: AirTouch, балаяж, шитьё седины, блонд и кислотное 5D-глазирование. Цены от 8 000 ₽.',
  },
  haircuts: {
    title: 'Стрижки — MAGDANA | Каре, боб, бабочка и Smart Cut',
    description:
      '20 выверенных архитектурных стрижек с учётом овала лица и роста волос: прямой боб, французский и итальянский боб, стрижка бабочка. От 2 000 ₽.',
  },
  care: {
    title: 'Спа-уход и реконструкция волос — MAGDANA',
    description:
      '12 профессиональных программ восстановления волос: белковая реконструкция, холодный ботокс, керапластика и эффект жидкого стекла. От 2 000 ₽.',
  },
  styling: {
    title: 'Укладки и причёски — MAGDANA | Вечерние и дневные образы',
    description:
      '25 вечерних, свадебных и дневных укладок в студии MAGDANA: голливудская волна, 90s blowout, гладкие пучки, шёлковые хвосты и плетения. От 1 500 ₽.',
  },
  portfolio: {
    title: 'Портфолио работ — MAGDANA | Галерея результатов студии',
    description:
      'Кураторская галерея выполненных работ студии MAGDANA: окрашивание, стрижки, спа-уход и укладки с фильтрацией по категориям и онлайн-записью.',
  },
};

export function isOfflineFileRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.__MAGDANA_OFFLINE__ === true ||
    window.location.protocol === 'file:'
  );
}

function normalizePath(rawPath: string): string {
  const cleaned = rawPath.replace(/\/+$/, '') || '/';
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
}

export function parseRouteFromLocation(): {
  tab: TabId;
  portfolioSection: PortfolioSectionFilter;
} {
  if (typeof window === 'undefined') {
    return { tab: 'home', portfolioSection: 'all' };
  }

  let pathPart = '/';
  let searchPart = '';

  const useHash =
    isOfflineFileRuntime() || window.location.hash.startsWith('#/');

  if (useHash && window.location.hash.startsWith('#/')) {
    const rawHash = window.location.hash.slice(1);
    const qIdx = rawHash.indexOf('?');
    if (qIdx >= 0) {
      pathPart = rawHash.slice(0, qIdx);
      searchPart = rawHash.slice(qIdx + 1);
    } else {
      pathPart = rawHash;
    }
  } else if (!isOfflineFileRuntime()) {
    pathPart = window.location.pathname;
    searchPart = window.location.search.replace(/^\?/, '');
  }

  const normalized = normalizePath(pathPart);
  const tab: TabId = ROUTE_TO_TAB[normalized] ?? 'home';

  let portfolioSection: PortfolioSectionFilter = 'all';
  if (tab === 'portfolio' && searchPart) {
    const params = new URLSearchParams(searchPart);
    const cat = params.get('category');
    if (cat && VALID_PORTFOLIO_SECTIONS.has(cat)) {
      portfolioSection = cat as ServiceSection;
    }
  }

  return { tab, portfolioSection };
}

export function syncLocationToRoute(
  tab: TabId,
  portfolioSection: PortfolioSectionFilter = 'all',
  replace = false
): void {
  if (typeof window === 'undefined') return;

  const baseRoute = TAB_ROUTES[tab];
  const querySuffix =
    tab === 'portfolio' && portfolioSection !== 'all'
      ? `?category=${portfolioSection}`
      : '';
  const targetUrl = `${baseRoute}${querySuffix}`;

  if (isOfflineFileRuntime()) {
    const targetHash = `#${targetUrl}`;
    if (window.location.hash !== targetHash) {
      if (replace) {
        window.location.replace(targetHash);
      } else {
        window.location.hash = targetHash;
      }
    }
    return;
  }

  const currentUrl = `${normalizePath(window.location.pathname)}${window.location.search}`;
  if (currentUrl === targetUrl) return;

  try {
    if (replace) {
      window.history.replaceState({ tab, portfolioSection }, '', targetUrl);
    } else {
      window.history.pushState({ tab, portfolioSection }, '', targetUrl);
    }
  } catch {
    // Fallback safely if History API is restricted in an embedded sandbox
    window.location.hash = `#${targetUrl}`;
  }
}

function setMetaContent(selector: string, content: string): void {
  const el = document.querySelector<HTMLMetaElement>(selector);
  if (el) {
    el.setAttribute('content', content);
  }
}

export function updateDocumentSeo(
  tab: TabId,
  portfolioSection: PortfolioSectionFilter = 'all'
): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const base = ROUTE_SEO[tab];
  const title =
    tab === 'portfolio' && portfolioSection !== 'all'
      ? `Портфолио: ${SECTION_LABELS[portfolioSection]} — MAGDANA`
      : base.title;

  document.title = title;
  setMetaContent('meta[name="description"]', base.description);
  setMetaContent('meta[property="og:title"]', title);
  setMetaContent('meta[property="og:description"]', base.description);
  setMetaContent('meta[name="twitter:title"]', title);
  setMetaContent('meta[name="twitter:description"]', base.description);

  if (!isOfflineFileRuntime()) {
    const canonicalUrl = `${window.location.origin}${window.location.pathname}`;
    setMetaContent('meta[property="og:url"]', canonicalUrl);

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }
}

let cachedApiPromise: Promise<boolean> | null = null;

/**
 * Checks whether the optional Node.js Express backend (/api/health) is reachable.
 * Returns false on static hosting (Timeweb, Beget, Cloudflare Pages) and offline file:// mode.
 */
export function detectApiAvailability(forceRefresh = false): Promise<boolean> {
  if (isOfflineFileRuntime()) {
    return Promise.resolve(false);
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return Promise.resolve(false);
  }
  if (!forceRefresh && cachedApiPromise) {
    return cachedApiPromise;
  }

  cachedApiPromise = (async () => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2200);
    try {
      const res = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!res.ok) return false;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return false;
      const data = (await res.json()) as { ok?: boolean };
      return data.ok === true;
    } catch {
      return false;
    } finally {
      window.clearTimeout(timer);
    }
  })();

  return cachedApiPromise;
}
