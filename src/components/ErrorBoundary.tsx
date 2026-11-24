import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'Непредвиденная ошибка интерфейса',
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#141211] text-[#F5F0EB] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#1C1917] border border-[#D9A773]/20 rounded-2xl p-8 text-center space-y-4">
            <h1 className="font-serif text-3xl font-medium text-[#F5F0EB]">
              Произошла ошибка
            </h1>
            <p className="text-sm text-[#A69C93] leading-relaxed">
              Не удалось отобразить раздел. Обновите страницу, чтобы восстановить работу приложения.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-[#D9A773] text-[#141211] text-sm font-semibold hover:bg-[#E6BD90] transition-colors"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
