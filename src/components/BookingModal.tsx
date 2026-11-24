import { useEffect, useMemo, useState } from 'react';
import { X, Send, MessageCircle, Phone, Check, Copy } from 'lucide-react';
import {
  ALL_SERVICES,
  CARE_SERVICES,
  COLORING_SERVICES,
  CONTACTS,
  formatPriceRange,
  HAIRCUT_SERVICES,
  STYLING_SERVICES,
} from '../data/catalog';
import type { BookingPrefill } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  prefill: BookingPrefill | null;
  defaultGuestName: string;
  onClose: () => void;
  onOpenTelegramChat: (text?: string) => void;
  onSuccessFeedback: () => void;
}

export function BookingModal({
  isOpen,
  prefill,
  defaultGuestName,
  onClose,
  onOpenTelegramChat,
  onSuccessFeedback,
}: BookingModalProps) {
  const [name, setName] = useState(defaultGuestName);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    prefill?.serviceId || COLORING_SERVICES[0].id
  );
  const [comment, setComment] = useState('');
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultGuestName && !name) {
        setName(defaultGuestName);
      }
      if (prefill?.serviceId) {
        setSelectedServiceId(prefill.serviceId);
      }
      setCopiedNotice(null);
    }
  }, [isOpen, prefill, defaultGuestName, name]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const selectedService = useMemo(
    () => ALL_SERVICES.find((s) => s.id === selectedServiceId) || ALL_SERVICES[0],
    [selectedServiceId]
  );

  if (!isOpen) return null;

  const buildBookingMessage = () => {
    const lines = [
      'Здравствуйте, Магдана! Хочу записаться в студию.',
      name.trim() ? `Имя: ${name.trim()}` : '',
      selectedService
        ? `Услуга: ${selectedService.title} (${formatPriceRange(
            selectedService.priceMin,
            selectedService.priceMax
          )})`
        : '',
      comment.trim() ? `Комментарий: ${comment.trim()}` : '',
    ].filter(Boolean);
    return lines.join('\n');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleTelegramSubmit = async () => {
    const msg = buildBookingMessage();
    await copyToClipboard(msg);
    onSuccessFeedback();
    onOpenTelegramChat(msg);
  };

  const handleWhatsAppSubmit = () => {
    const msg = buildBookingMessage();
    onSuccessFeedback();
    const url = `${CONTACTS.whatsapp}?text=${encodeURIComponent(msg)}`;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const handleMaxSubmit = async () => {
    const msg = buildBookingMessage();
    const copied = await copyToClipboard(msg);
    onSuccessFeedback();
    setCopiedNotice(
      copied
        ? 'Текст заявки скопирован — вставьте его в чате MAX'
        : 'Открываем чат MAX'
    );
    const a = document.createElement('a');
    a.href = CONTACTS.max;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const handleCopyOnly = async () => {
    const ok = await copyToClipboard(buildBookingMessage());
    if (ok) {
      onSuccessFeedback();
      setCopiedNotice('Текст заявки скопирован в буфер обмена');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#1C1917] border border-[#D9A773]/22 shadow-2xl">
        {/* Mobile grab handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <span className="w-10 h-1 rounded-full bg-[#D9A773]/30" />
        </div>

        <div className="px-6 pt-5 pb-4 border-b border-[#D9A773]/14 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-[#D9A773]">Онлайн-запись · MAGDANA</p>
            <h2
              id="booking-modal-title"
              className="font-serif text-3xl font-medium text-[#F5F0EB]"
            >
              Записаться на визит
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно записи"
            className="w-10 h-10 flex items-center justify-center rounded-xl text-[#A69C93] hover:text-[#F5F0EB] hover:bg-[#231F1C] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Guest Name Field */}
          <div className="space-y-2">
            <label htmlFor="booking-name" className="block text-xs font-medium text-[#A69C93]">
              Ваше имя
            </label>
            <input
              id="booking-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Как к вам обращаться?"
              maxLength={80}
              className="w-full h-12 px-4 rounded-xl bg-[#141211] border border-[#D9A773]/18 text-sm text-[#F5F0EB] placeholder:text-[#A69C93]/60 focus:outline-none focus:border-[#D9A773] transition-colors"
            />
          </div>

          {/* Service Selector */}
          <div className="space-y-2">
            <label htmlFor="booking-service" className="block text-xs font-medium text-[#A69C93]">
              Выберите услугу
            </label>
            <select
              id="booking-service"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-[#141211] border border-[#D9A773]/18 text-sm text-[#F5F0EB] focus:outline-none focus:border-[#D9A773] transition-colors"
            >
              <optgroup label="Окрашивание (8 000 – 20 000 ₽)">
                {COLORING_SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Стрижки (2 000 – 5 000 ₽)">
                {HAIRCUT_SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Спа-уход (2 000 – 5 000 ₽)">
                {CARE_SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Укладки и причёски (1 500 – 5 000 ₽)">
                {STYLING_SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </optgroup>
            </select>

            {selectedService && (
              <div className="flex items-center justify-between text-xs text-[#A69C93] pt-1 px-1">
                <span>Ориентир: {selectedService.duration}</span>
                <span className="text-[#D9A773] font-medium tabular-nums">
                  {formatPriceRange(selectedService.priceMin, selectedService.priceMax)}
                </span>
              </div>
            )}
          </div>

          {/* Free-form Comment */}
          <div className="space-y-2">
            <label htmlFor="booking-comment" className="block text-xs font-medium text-[#A69C93]">
              Свободный комментарий
            </label>
            <textarea
              id="booking-comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Длина волос, желаемый день или особые пожелания..."
              maxLength={400}
              className="w-full p-4 rounded-xl bg-[#141211] border border-[#D9A773]/18 text-sm text-[#F5F0EB] placeholder:text-[#A69C93]/60 focus:outline-none focus:border-[#D9A773] transition-colors resize-none"
            />
          </div>

          {copiedNotice && (
            <div className="flex items-center gap-2 text-xs text-[#D9A773] bg-[#D9A773]/10 border border-[#D9A773]/25 rounded-xl px-4 py-2.5">
              <Check className="w-4 h-4 shrink-0" />
              <span>{copiedNotice}</span>
            </div>
          )}

          {/* Messenger & Call Actions */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleTelegramSubmit}
              className="w-full h-12 rounded-xl bg-[#D9A773] text-[#141211] text-sm font-semibold hover:bg-[#E6BD90] active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2.5"
            >
              <Send className="w-4 h-4" />
              Написать в Telegram
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleWhatsAppSubmit}
                className="h-12 rounded-xl bg-[#141211] border border-[#D9A773]/25 text-sm font-medium text-[#F5F0EB] hover:border-[#D9A773] hover:text-[#D9A773] transition-colors inline-flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-[#D9A773]" />
                WhatsApp
              </button>

              <button
                type="button"
                onClick={handleMaxSubmit}
                className="h-12 rounded-xl bg-[#141211] border border-[#D9A773]/25 text-sm font-medium text-[#F5F0EB] hover:border-[#D9A773] hover:text-[#D9A773] transition-colors inline-flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-[#D9A773]" />
                MAX
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#D9A773]/12">
              <a
                href={CONTACTS.phoneHref}
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#F5F0EB]/85 hover:text-[#D9A773] transition-colors min-h-[40px]"
              >
                <Phone className="w-4 h-4 text-[#D9A773]" />
                <span className="tabular-nums">Позвонить: {CONTACTS.phoneDisplay}</span>
              </a>

              <button
                type="button"
                onClick={handleCopyOnly}
                className="inline-flex items-center gap-1.5 text-xs text-[#A69C93] hover:text-[#D9A773] transition-colors min-h-[40px]"
              >
                <Copy className="w-3.5 h-3.5" />
                Копировать текст
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
