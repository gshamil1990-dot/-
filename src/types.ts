export type TabId = 'home' | 'coloring' | 'haircuts' | 'care' | 'styling' | 'portfolio';

export type ServiceSection = 'coloring' | 'haircuts' | 'care' | 'styling';

export interface ServiceItem {
  id: string;
  section: ServiceSection;
  title: string;
  subtitle?: string;
  category: string;
  isTop?: boolean;
  priceMin: number;
  priceMax: number;
  duration: string;
  description: string;
  defaultImage?: string;
  basePrompt?: string;
}

export interface ServiceModelDoc {
  itemId: string;
  techniqueId?: string;
  haircutId?: string;
  careId?: string;
  stylingId?: string;
  imageDataUrl: string;
  promptUsed: string;
  source: 'ai' | 'upload';
  isPublished: boolean;
  approvedBy: string;
  updatedAt?: Date | null;
}

export interface BookingPrefill {
  serviceId?: string;
  serviceTitle?: string;
  section?: ServiceSection;
}
