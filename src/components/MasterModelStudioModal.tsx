import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { User } from 'firebase/auth';
import {
  X,
  Sparkles,
  Check,
  RefreshCw,
  Upload,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Loader2,
  LogOut,
} from 'lucide-react';
import {
  CARE_SERVICES,
  COLORING_SERVICES,
  HAIRCUT_SERVICES,
  STYLING_SERVICES,
} from '../data/catalog';
import {
  publishServiceModel,
  removeServiceModel,
  signInMasterWithGoogle,
  signOutMaster,
} from '../lib/firebase';
import type { ServiceModelDoc, ServiceSection } from '../types';

interface MasterModelStudioModalProps {
  isOpen: boolean;
  section: ServiceSection;
  initialItemId?: string;
  masterPin: string;
  apiAvailable?: boolean;
  firebaseUser: User | null;
  publishedModels: Record<string, ServiceModelDoc>;
  onClose: () => void;
  onSuccessFeedback: () => void;
  onErrorFeedback: () => void;
}

const COLORING_TONE_OPTIONS = [
  'Жемчужно-шампань блонд',
  'Тёплый медово-карамельный',
  'Холодный скандинавский платиновый',
  'Сливочный кашемировый беж',
  'Глубокий эспрессо с золотыми бликами',
  'Нежный розовый кварц (пастель)',
];

const COLORING_LENGTH_OPTIONS = [
  'Длинные мягкие салон-волны',
  'Идеально гладкое зеркальное полотно',
  'Удлинённый боб до ключиц',
  'Объёмная укладка на брашинг',
];

const COLORING_LIGHTING_OPTIONS = [
  'Тёплый золотой контровой свет студии',
  'Мягкий рассеянный editorial-свет',
  'Контрастный подиумный свет Vogue',
];

const HAIRCUT_ANGLE_OPTIONS = [
  'Три четверти (акцент на силуэт и линию среза)',
  'Анфас (симметрия формы и обрамление лица)',
  'Профиль (геометрия затылка и длины)',
  'Лёгкое движение волос в кадре',
];

const HAIRCUT_TONE_OPTIONS = [
  'Глубокий эспрессо',
  'Тёплый каштановый шатен',
  'Благородный натуральный русый',
  'Светлый жемчужный блонд',
  'Натуральный чёрный глянец',
];

const HAIRCUT_TEXTURE_OPTIONS = [
  'Зеркальный гладкий срез',
  'Естественная воздушная текстура',
  'Мягкий салонный объём на брашинг',
  'Лёгкие небрежные волны',
];

const CARE_EFFECT_OPTIONS = [
  'Зеркальное «жидкое стекло» и идеальная гладкость',
  'Шёлковая плотность и упругость без пушения',
  'Упругие увлажнённые локоны и кудри',
  'Идеально запаянные гладкие кончики',
];

const CARE_TONE_OPTIONS = [
  'Восстановленный жемчужный блонд',
  'Тёплый шёлковый каштан',
  'Глубокий тёмный эспрессо-глянец',
  'Благородный серебристый (Anti-Age)',
];

const CARE_ATMOSPHERE_OPTIONS = [
  'Флакон с пипеткой и каплями эликсира на камне',
  'Стеклянные ампулы-бустеры с золотым концентратом',
  'Тяжёлая баночка маски из тёмного стекла и латуни',
  'Матовый флакон с золотым дозатором или носиком',
];

interface StylingPromptPreset {
  id: string;
  label: string;
  summary: string;
  result: string;
  tool: string;
  direction: string;
}

const STYLING_EDITORIAL_PRESETS: readonly StylingPromptPreset[] = [
  {
    id: 'waves-profile',
    label: 'Волны ¾ со спины',
    summary: 'Глянцевые S-волны и мягкий поворот',
    result: 'Скульптурные глянцевые S-волны (Голливуд)',
    tool: 'Три четверти со спины (акцент на силуэт причёски)',
    direction:
      'Three-quarter rear-side editorial portrait highlighting sweeping glossy S-waves cascading down the back with warm champagne-gold rim light',
  },
  {
    id: 'blowout-volume',
    label: 'Объём и брашинг',
    summary: 'Пышный корень и подкрученные концы',
    result: 'Воздушный объём и мягкие локоны на брашинг',
    tool: 'Полуоборот спиной (акцент на объём и длину)',
    direction:
      'Three-quarter back portrait showcasing bouncy lifted crown volume and plush feathered inward-curled blowout layers',
  },
  {
    id: 'updo-silhouette',
    label: 'Пучок и ракушка',
    summary: 'Архитектура собранной причёски',
    result: 'Собранная фактура пучка, ракушки или 3D-плетения',
    tool: 'Чистый ракурс со спины и затылка',
    direction:
      'Clean rear three-quarter couture portrait highlighting intricate sculpted chignon, twist, or braid architecture and bare shoulders',
  },
  {
    id: 'sleek-gloss',
    label: 'Зеркальный глянец',
    summary: 'Идеально гладкое полотно или хвост',
    result: 'Зеркальное прямое полотно «жидкое стекло»',
    tool: 'Профиль и три четверти (акцент на зеркальный блеск)',
    direction:
      'Ultra-sleek high-contrast rear three-quarter portrait emphasizing liquid-glass specular sheen and clean wrapped silhouette',
  },
];

const STYLING_RESULT_OPTIONS = [
  'Скульптурные глянцевые S-волны (Голливуд)',
  'Воздушный объём и мягкие локоны на брашинг',
  'Зеркальное прямое полотно «жидкое стекло»',
  'Собранная фактура пучка, ракушки или 3D-плетения',
  'Расслабленные текстурные волны (Beach / Surf)',
  'Влажный подиумный глянец (Editorial Wet Look)',
];

const STYLING_ANGLE_OPTIONS = [
  'Три четверти со спины (акцент на силуэт причёски)',
  'Чистый ракурс со спины и затылка',
  'Полуоборот спиной (акцент на объём и длину)',
  'Профиль и три четверти (акцент на зеркальный блеск)',
];

const STYLING_TONE_OPTIONS = [
  'Тёплый каштаново-карамельный',
  'Жемчужно-шампань блонд',
  'Глубокий тёмный эспрессо-глянец',
  'Медово-золотистый русый',
];

export function MasterModelStudioModal({
  isOpen,
  section,
  initialItemId,
  masterPin,
  apiAvailable = true,
  firebaseUser,
  publishedModels,
  onClose,
  onSuccessFeedback,
  onErrorFeedback,
}: MasterModelStudioModalProps) {
  const isHaircuts = section === 'haircuts';
  const isCare = section === 'care';
  const isStyling = section === 'styling';
  const catalogItems = isHaircuts
    ? HAIRCUT_SERVICES
    : isCare
      ? CARE_SERVICES
      : isStyling
        ? STYLING_SERVICES
        : COLORING_SERVICES;

  const [itemId, setItemId] = useState(initialItemId || catalogItems[0].id);

  // Coloring controls
  const [coloringTone, setColoringTone] = useState(COLORING_TONE_OPTIONS[0]);
  const [hairLength, setHairLength] = useState(COLORING_LENGTH_OPTIONS[0]);
  const [lighting, setLighting] = useState(COLORING_LIGHTING_OPTIONS[0]);

  // Haircut controls
  const [haircutAngle, setHaircutAngle] = useState(HAIRCUT_ANGLE_OPTIONS[0]);
  const [haircutTone, setHaircutTone] = useState(HAIRCUT_TONE_OPTIONS[0]);
  const [haircutTexture, setHaircutTexture] = useState(HAIRCUT_TEXTURE_OPTIONS[0]);

  // Care controls
  const [careEffect, setCareEffect] = useState(CARE_EFFECT_OPTIONS[0]);
  const [careTone, setCareTone] = useState(CARE_TONE_OPTIONS[0]);
  const [careAtmosphere, setCareAtmosphere] = useState(CARE_ATMOSPHERE_OPTIONS[0]);

  // Styling controls (editorial hair texture on dark stone + professional tools, faceless)
  const [stylingPresetId, setStylingPresetId] = useState(STYLING_EDITORIAL_PRESETS[0].id);
  const [stylingResult, setStylingResult] = useState(STYLING_EDITORIAL_PRESETS[0].result);
  const [stylingTool, setStylingTool] = useState(STYLING_EDITORIAL_PRESETS[0].tool);
  const [stylingTone, setStylingTone] = useState(STYLING_TONE_OPTIONS[0]);

  const activeStylingPreset = useMemo(
    () =>
      STYLING_EDITORIAL_PRESETS.find((preset) => preset.id === stylingPresetId) ||
      STYLING_EDITORIAL_PRESETS[0],
    [stylingPresetId]
  );

  const handleSelectStylingPreset = (preset: StylingPromptPreset) => {
    setStylingPresetId(preset.id);
    setStylingResult(preset.result);
    setStylingTool(preset.tool);
  };

  const [customNote, setCustomNote] = useState('');

  const [candidateImage, setCandidateImage] = useState<string | null>(null);
  const [candidatePrompt, setCandidatePrompt] = useState<string>('');
  const [candidateSource, setCandidateSource] = useState<'ai' | 'upload'>('ai');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const validInitial =
      initialItemId && catalogItems.some((item) => item.id === initialItemId)
        ? initialItemId
        : catalogItems[0].id;
    setItemId(validInitial);
    setCandidateImage(null);
    setErrorMessage(null);
    setStatusMessage(null);
  }, [isOpen, section, initialItemId, catalogItems]);

  const selectedItem = useMemo(
    () => catalogItems.find((item) => item.id === itemId) || catalogItems[0],
    [catalogItems, itemId]
  );

  const currentPublished = publishedModels[selectedItem.id];

  if (!isOpen) return null;

  const handleSelectItem = (nextId: string) => {
    setItemId(nextId);
    setCandidateImage(null);
    setErrorMessage(null);
    setStatusMessage(null);
  };

  const handleGoogleAuth = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      await signInMasterWithGoogle();
      onSuccessFeedback();
      setStatusMessage('Аккаунт администратора подключён. Теперь можно утверждать фото в Firebase.');
    } catch (err) {
      onErrorFeedback();
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Не удалось выполнить вход через Google.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const payload = isHaircuts
        ? {
            section: 'haircuts',
            techniqueTitle: selectedItem.title,
            techniqueSubtitle: selectedItem.subtitle,
            basePrompt: selectedItem.basePrompt,
            angle: haircutAngle,
            tone: haircutTone,
            hairTexture: haircutTexture,
            customNote,
          }
        : isCare
          ? {
              section: 'care',
              techniqueTitle: selectedItem.title,
              techniqueSubtitle: selectedItem.subtitle,
              basePrompt: selectedItem.basePrompt,
              careEffect,
              tone: careTone,
              careAtmosphere,
              customNote,
            }
          : isStyling
            ? {
                section: 'styling',
                techniqueTitle: selectedItem.title,
                techniqueSubtitle: selectedItem.subtitle,
                basePrompt: selectedItem.basePrompt,
                stylingPreset: activeStylingPreset.direction,
                stylingResult,
                stylingTool,
                tone: stylingTone,
                customNote,
              }
            : {
                section: 'coloring',
                techniqueTitle: selectedItem.title,
                techniqueSubtitle: selectedItem.subtitle,
                basePrompt: selectedItem.basePrompt,
                tone: coloringTone,
                hairLength,
                lighting,
                customNote,
              };

      const response = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Pin': masterPin,
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        imageDataUrl?: string;
        promptUsed?: string;
        error?: string;
      };

      if (!response.ok || !data.imageDataUrl) {
        setErrorMessage(
          data.error || 'Не удалось сгенерировать фото модели.'
        );
        onErrorFeedback();
        return;
      }

      setCandidateImage(data.imageDataUrl);
      setCandidatePrompt(data.promptUsed || selectedItem.title);
      setCandidateSource('ai');
      onSuccessFeedback();
      setStatusMessage('Вариант готов — оцените результат и нажмите «Утвердить для каталога».');
    } catch {
      onErrorFeedback();
      setErrorMessage('Ошибка сети при обращении к студии генерации.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Выберите файл изображения (JPG, PNG или WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCandidateImage(reader.result);
        setCandidatePrompt(`Фотография работы мастера · ${selectedItem.title}`);
        setCandidateSource('upload');
        setErrorMessage(null);
        setStatusMessage('Фотография загружена в предпросмотр. Нажмите «Утвердить», чтобы опубликовать её.');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApproveAndPublish = async () => {
    if (!candidateImage) return;
    if (!firebaseUser) {
      setErrorMessage('Сначала нажмите «Войти через Google», чтобы подтвердить права на публикацию в Firebase.');
      onErrorFeedback();
      return;
    }

    setIsPublishing(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await publishServiceModel(section, {
        itemId: selectedItem.id,
        imageDataUrl: candidateImage,
        promptUsed: candidatePrompt || selectedItem.title,
        source: candidateSource,
      });
      onSuccessFeedback();
      setCandidateImage(null);
      setStatusMessage(`Фотография для «${selectedItem.title}» утверждена и видна всем гостям.`);
    } catch (err) {
      onErrorFeedback();
      const raw = err instanceof Error ? err.message : String(err);
      if (raw.includes('Missing or insufficient permissions')) {
        setErrorMessage(
          'У текущего Google-аккаунта нет прав администратора на запись в каталог. Войдите под аккаунтом владельца студии.'
        );
      } else {
        setErrorMessage('Не удалось опубликовать фото в Firebase. Попробуйте повторить.');
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRemovePublished = async () => {
    if (!firebaseUser || !currentPublished) return;
    setIsPublishing(true);
    setErrorMessage(null);
    try {
      await removeServiceModel(section, selectedItem.id);
      onSuccessFeedback();
      setStatusMessage('Опубликованное фото удалено из облака.');
    } catch {
      onErrorFeedback();
      setErrorMessage('Не удалось удалить фото из Firebase.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-5xl max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#1C1917] border border-[#D9A773]/25 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1C1917]/95 backdrop-blur-md px-6 py-4 border-b border-[#D9A773]/16 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-xs text-[#D9A773]">
              Встроенная студия акцепта и генерации · Firebase Cloud
            </p>
            <h2
              id="studio-modal-title"
              className="font-serif text-2xl sm:text-3xl font-medium text-[#F5F0EB]"
            >
              {isHaircuts
                ? 'Студия фото стрижек'
                : isCare
                  ? 'Студия фото спа-ухода'
                  : isStyling
                    ? 'Студия фото укладок'
                    : 'Студия фото моделей'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {firebaseUser ? (
              <div className="flex items-center gap-2.5 text-xs text-[#A69C93] bg-[#141211] border border-[#D9A773]/20 rounded-lg px-3 py-2">
                <ShieldCheck className="w-4 h-4 text-[#D9A773] shrink-0" />
                <span className="max-w-[160px] truncate text-[#F5F0EB]">
                  {firebaseUser.email}
                </span>
                <button
                  type="button"
                  onClick={() => void signOutMaster()}
                  title="Сменить Google-аккаунт"
                  className="text-[#A69C93] hover:text-[#D9A773] pl-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isSigningIn}
                className="px-4 py-2 rounded-lg bg-[#D9A773]/15 border border-[#D9A773]/40 text-xs font-medium text-[#D9A773] hover:bg-[#D9A773] hover:text-[#141211] transition-colors whitespace-nowrap"
              >
                {isSigningIn ? 'Вход...' : 'Войти через Google (публикация)'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть студию"
              className="w-10 h-10 flex items-center justify-center rounded-xl text-[#A69C93] hover:text-[#F5F0EB] hover:bg-[#231F1C]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Service & Prompt Controls */}
          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="studio-item"
                className="block text-xs font-medium text-[#A69C93]"
              >
                {isHaircuts
                  ? `Форма стрижки (${catalogItems.length} позиций)`
                  : isCare
                    ? `Спа-процедура (${catalogItems.length} позиций)`
                    : isStyling
                      ? `Укладка или причёска (${catalogItems.length} позиций)`
                      : `Техника окрашивания (${catalogItems.length} позиций)`}
              </label>
              <select
                id="studio-item"
                value={itemId}
                onChange={(e) => handleSelectItem(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-[#141211] border border-[#D9A773]/20 text-sm text-[#F5F0EB] focus:outline-none focus:border-[#D9A773]"
              >
                {catalogItems.map((item) => {
                  const hasCloud = Boolean(publishedModels[item.id]?.imageDataUrl);
                  return (
                    <option key={item.id} value={item.id}>
                      {hasCloud ? '✓ ' : ''}
                      {item.title}
                    </option>
                  );
                })}
              </select>
            </div>

            {isHaircuts ? (
              <>
                <div className="space-y-2">
                  <label htmlFor="studio-angle" className="block text-xs font-medium text-[#A69C93]">
                    Ракурс съёмки
                  </label>
                  <select
                    id="studio-angle"
                    value={haircutAngle}
                    onChange={(e) => setHaircutAngle(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#141211] border border-[#D9A773]/18 text-sm text-[#F5F0EB] focus:outline-none focus:border-[#D9A773]"
                  >
                    {HAIRCUT_ANGLE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="studio-haircut-tone"
                      className="block text-xs font-medium text-[#A69C93]"
                    >
                      Оттенок волос модели
                    </label>
                    <select
                      id="studio-haircut-tone"
                      value={haircutTone}
                      onChange={(e) => setHaircutTone(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#141211] border border-[#D9A773]/18 text-sm text-[#F5F0EB] focus:outline-none focus:border-[#D9A773]"
                    >
                      {HAIRCUT_TONE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="studio-texture"
                      className="block text-xs font-medium text-[#A69C93]"
                    >
                      Текстура и укладка
                    </label>
                    <select
                      id="studio-texture"
                      value={haircutTexture}
                      onChange={(e) => setHaircutTexture(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#141211] border border-[#D9A773]/18 text-sm text-[#F5F0EB] focus:outline-none focus:border-[#D9A773]"
                    >
                      {HAIRCUT_TEXTURE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : isCare ? (
              <>
                <div className="space-y-2">
                  <label htmlFor="studio-care-effect" className="block text-xs font-medium text-[#A69C93]">
                    Текстура и эффект полотна (без лиц)
                  </label>
                  <select
                    id="studio-care-effect"
                    value={careEffect}
                    onChange={(e) => setCareEffect(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#141211] border border-[#D9A773]/18 text-sm text-[#F5F0EB] focus:outline-none focus:border-[#D9A773]"
                  >
                    {CARE_EFFECT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="studio-care-tone"
                      className="block text-xs font-medium text-[#A69C93]"
                    >
                      Оттенок пряди волос
                    </label>
                    <select
                      id="studio-care-tone"
                      value={careTone}
                      onChange={(e) => setCareTone(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#141211] border border-[#D9A773]/18 text-sm text-[#F5F0EB] focus:outline-none focus:border-[#D9A773]"
                    >
                      {CARE_TONE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="studio-care-atmosphere"
                      className="block text-xs font-medium text-[#A69C93]"
                    >
                      Формат сосуда на тёмном камне
                    </label>
                    <select
                      id="studio-care-atmosphere"
                      value={careAtmosphere}
                      onChange={(e) => setCareAtmosphere(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#141211] border border-[#D9A773]/18 text-sm text-[#F5F0EB] focus:outline-none focus:border-[#D9A773]"
                    >
                      {CARE_ATMOSPHERE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : isStyling ? (
              <>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-[#A69C93]">
                      Editorial-пресет съёмки
                    </span>
                    <span className="text-[#D9A773]">Модель со спины / ¾</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {STYLING_EDITORIAL_PRESETS.map((preset) => {
                      const active = stylingPresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectStylingPreset(preset)}
                          className={`text-left px-3 py-2.5 rounded-xl border transition-colors min-h-[44px] ${
                            active
                              ? 'bg-[#D9A773]/15 border-[#D9A773] text-[#F5F0EB]'
                              : 'bg-[#141211] border-[#D9A773]/18 text-[#A69C93] hover:border-[#D9A773]/40 hover:text-[#F5F0EB]'
                          }`}
                        >
                          <span className="block text-xs font-medium leading-tight">
                            {preset.label}
                          </span>
                          <span className="block text-[11px] text-[#A69C93] mt-0.5 line-clamp-1">
                            {preset.summary}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-[#A69C93]/85 leading-relaxed">
                    Реалистичный студийный портрет модели со спины или в три четверти в фирменном тёмном стиле MAGDANA.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="studio-styling-result" className="block text-xs font-medium text-[#A69C93]">
                    Результат и фактура укладки
                  </label>
                  <select
                    id="studio-styling-result"
                    value={stylingResult}
                    onChange={(e) => setStylingResult(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#141211] border border-[#D9A773]/18 text-sm text-[#F5F0EB] focus:outline-none focus:border-[#D9A773]"
                  >
                    {STYLING_RESULT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="studio-styling-tool"
                      className="block text-xs font-medium text-[#A69C93]"
                    >
                      Ракурс съёмки модели
                    </label>
                    <select
                      id="studio-styling-tool"
                      value={stylingTool}
                      onChange={(e) => setStylingTool(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#141211] border border-[#D9A773]/18 text-sm text-[#F5F0EB] focus:outline-none focus:border-[#D9A773]"
                    >
                      {STYLING_ANGLE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="studio-styling-tone"
                      className="block text-xs font-medium text-[#A69C93]"
                    >
                      Оттенок полотна волос
                    </label>
                    <select
                      id="studio-styling-tone"
                      value={stylingTone}
                      onChange={(e) => setStylingTone(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#141211] border border-[#D9A773]/18 text-sm text-[#F5F0EB] focus:outline-none focus:border-[#D9A773]"
                    >
                      {STYLING_TONE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label htmlFor="studio-tone" className="block text-xs font-medium text-[#A69C93]">
                    Оттенок и нюанс цвета
                  </label>
                  <select
                    id="studio-tone"
                    value={coloringTone}
                    onChange={(e) => setColoringTone(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#141211] border border-[#D9A773]/18 text-sm text-[#F5F0EB] focus:outline-none focus:border-[#D9A773]"
                  >
                    {COLORING_TONE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="studio-length"
                      className="block text-xs font-medium text-[#A69C93]"
                    >
                      Длина и укладка модели
                    </label>
                    <select
                      id="studio-length"
                      value={hairLength}
                      onChange={(e) => setHairLength(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#141211] border border-[#D9A773]/18 text-sm text-[#F5F0EB] focus:outline-none focus:border-[#D9A773]"
                    >
                      {COLORING_LENGTH_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="studio-lighting"
                      className="block text-xs font-medium text-[#A69C93]"
                    >
                      Свет и атмосфера кадра
                    </label>
                    <select
                      id="studio-lighting"
                      value={lighting}
                      onChange={(e) => setLighting(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#141211] border border-[#D9A773]/18 text-sm text-[#F5F0EB] focus:outline-none focus:border-[#D9A773]"
                    >
                      {COLORING_LIGHTING_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label htmlFor="studio-note" className="block text-xs font-medium text-[#A69C93]">
                Дополнительное пожелание к образу (опционально)
              </label>
              <textarea
                id="studio-note"
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder={
                  isHaircuts
                    ? 'Например: чёткий пробор, акцент на чёлке или мягкий изгиб у скул...'
                    : isCare
                      ? 'Например: две капли золотого масла на камне или хрустальный флакон рядом с прядью...'
                      : isStyling
                        ? 'Например: мягкие пряди у шеи, акцент на объёме затылка или тёплый золотой контур...'
                        : 'Например: светлые пряди у лица, лёгкий поворот в профиль...'
                }
                maxLength={250}
                className="w-full p-3.5 rounded-xl bg-[#141211] border border-[#D9A773]/18 text-sm text-[#F5F0EB] placeholder:text-[#A69C93]/60 focus:outline-none focus:border-[#D9A773] resize-none"
              />
            </div>

            <div className="space-y-3 pt-1">
              {apiAvailable && masterPin ? (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || isPublishing}
                  className="w-full h-12 rounded-xl bg-[#D9A773] text-[#141211] text-sm font-semibold hover:bg-[#E6BD90] disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isCare
                        ? 'Генерируем фото ухода...'
                        : isStyling
                          ? 'Генерируем фото укладки...'
                          : 'Генерируем фото модели...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {isCare
                        ? 'Сгенерировать фото ухода'
                        : isStyling
                          ? 'Сгенерировать фото укладки'
                          : 'Сгенерировать фото модели'}
                    </>
                  )}
                </button>
              ) : (
                <div className="rounded-xl bg-[#141211] border border-[#D9A773]/18 px-4 py-3 text-xs text-[#A69C93] leading-relaxed">
                  Сайт работает в режиме статического хостинга: загружайте свои фотографии работ ниже и публикуйте их в облако Firebase. Для AI-генерации подключите Node.js-сервер.
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleUploadFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating || isPublishing}
                className={`w-full h-11 rounded-xl text-xs sm:text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 ${
                  apiAvailable && masterPin
                    ? 'bg-[#141211] border border-[#D9A773]/25 text-[#F5F0EB] hover:border-[#D9A773] hover:text-[#D9A773]'
                    : 'bg-[#D9A773] text-[#141211] font-semibold hover:bg-[#E6BD90]'
                }`}
              >
                <Upload
                  className={`w-4 h-4 ${
                    apiAvailable && masterPin ? 'text-[#D9A773]' : 'text-[#141211]'
                  }`}
                />
                Загрузить своё фото работы
              </button>
            </div>
          </div>

          {/* Right Column: Review & Acceptance Stage */}
          <div className="lg:col-span-7 space-y-5">
            {errorMessage && (
              <div className="flex items-start gap-2.5 text-xs text-rose-200 bg-rose-950/45 border border-rose-500/35 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {statusMessage && (
              <div className="flex items-start gap-2.5 text-xs text-[#E6BD90] bg-[#D9A773]/12 border border-[#D9A773]/30 rounded-xl px-4 py-3">
                <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#D9A773]" />
                <span>{statusMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Current Published Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#A69C93]">
                  <span>Сейчас в каталоге</span>
                  {currentPublished && (
                    <span className="text-[#D9A773]">В облаке Firebase</span>
                  )}
                </div>
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#141211] border border-[#D9A773]/16">
                  {currentPublished?.imageDataUrl || selectedItem.defaultImage ? (
                    <img
                      src={
                        currentPublished?.imageDataUrl ||
                        selectedItem.defaultImage
                      }
                      alt={selectedItem.title}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover ${
                        isCare ? 'object-center' : 'object-top'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-xs text-[#A69C93]">
                      <span className="font-serif text-3xl text-[#D9A773]/35 mb-2">
                        M
                      </span>
                      <span>
                        {isHaircuts
                          ? 'Для этой стрижки пока нет опубликованного фото'
                          : isCare
                            ? 'Для этой спа-процедуры пока нет опубликованного фото'
                            : isStyling
                              ? 'Для этой укладки пока нет опубликованного фото'
                              : 'Для этой техники пока нет опубликованного фото'}
                      </span>
                    </div>
                  )}
                </div>
                {currentPublished && (
                  <button
                    type="button"
                    onClick={handleRemovePublished}
                    disabled={isPublishing}
                    className="inline-flex items-center gap-1.5 text-xs text-[#A69C93] hover:text-rose-300 transition-colors pt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Удалить опубликованное фото
                  </button>
                )}
              </div>

              {/* Candidate Acceptance Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#A69C93]">
                  <span>Новый вариант на акцепт</span>
                  {candidateImage && (
                    <span className="text-[#D9A773]">
                      {candidateSource === 'ai' ? 'Сгенерировано ИИ' : 'Загружено'}
                    </span>
                  )}
                </div>
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#141211] border border-[#D9A773]/28">
                  {isGenerating ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                      <Loader2 className="w-7 h-7 text-[#D9A773] animate-spin" />
                      <p className="text-xs text-[#A69C93]">
                        {isStyling
                          ? `Создаём студийный портрет причёски для «${selectedItem.title}»...`
                          : isCare
                            ? `Создаём editorial-кадр ухода на тёмном камне для «${selectedItem.title}»...`
                            : `Создаём editorial-портрет для «${selectedItem.title}»...`}
                      </p>
                    </div>
                  ) : candidateImage ? (
                    <img
                      src={candidateImage}
                      alt={
                        isStyling
                          ? `Новый студийный портрет укладки: ${selectedItem.title}`
                          : isCare
                            ? `Новый editorial-кадр ухода: ${selectedItem.title}`
                            : 'Новый кандидат фото модели'
                      }
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover ${
                        isCare ? 'object-center' : 'object-top'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-xs text-[#A69C93] space-y-2">
                      <Sparkles className="w-6 h-6 text-[#D9A773]/50" />
                      <span>
                        {isStyling
                          ? 'Выберите пресет и нажмите «Сгенерировать фото укладки» или загрузите фото работы'
                          : isCare
                            ? 'Нажмите «Сгенерировать фото ухода» или загрузите фото работы, чтобы сравнить и утвердить кадр'
                            : 'Нажмите «Сгенерировать фото модели» или загрузите фото работы, чтобы сравнить и утвердить образ'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Acceptance Action Bar */}
            {candidateImage && (
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleApproveAndPublish}
                  disabled={isPublishing || isGenerating}
                  className="flex-1 min-w-[200px] h-12 px-5 rounded-xl bg-[#D9A773] text-[#141211] text-sm font-semibold hover:bg-[#E6BD90] disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Публикация в Firebase...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Утвердить и опубликовать для всех
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || isPublishing}
                  className="h-12 px-4 rounded-xl bg-[#141211] border border-[#D9A773]/28 text-sm font-medium text-[#F5F0EB] hover:border-[#D9A773] hover:text-[#D9A773] transition-colors inline-flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Ещё вариант
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
