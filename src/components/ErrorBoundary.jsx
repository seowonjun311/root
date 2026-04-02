import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

/**
 * Error Boundary Component for route-level errors
 * Catches chunk load failures and redirects to Home tab with graceful recovery
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    
    // Increment error counter for recovery tracking
    this.setState(prev => ({
      errorCount: prev.errorCount + 1,
    }));

    // After 3 consecutive errors, force navigate to home
    if (this.state.errorCount >= 2) {
      console.warn('[ErrorBoundary] Multiple errors detected, forcing home navigation');
      this.props.onResetToHome?.();
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorCount: 0 });
    this.props.onResetToHome?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallbackUI 
          error={this.state.error} 
          onRetry={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Fallback UI for lazy-loaded chunk errors or network failures
 */
function ErrorFallbackUI({ error, onRetry }) {
  const isChunkLoadError = error?.message?.includes('Failed to fetch') || 
                           error?.message?.includes('NetworkError') ||
                           error?.message?.includes('Loading chunk');

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="max-w-sm mx-4 p-6 bg-card rounded-2xl border border-border shadow-lg text-center">
        <AlertTriangle className="w-10 h-10 mx-auto mb-4 text-destructive" />
        
        <h2 className="text-lg font-bold text-foreground mb-2">
          {isChunkLoadError ? '페이지 로드 오류' : '오류 발생'}
        </h2>
        
        <p className="text-sm text-muted-foreground mb-4">
          {isChunkLoadError 
            ? '페이지를 불러올 수 없습니다. 네트워크 연결을 확인해 주세요.'
            : '예상치 못한 오류가 발생했습니다.'}
        </p>

        {import.meta.env.DEV && (
          <p className="text-xs text-muted-foreground bg-secondary/30 rounded p-2 mb-4 text-left font-mono">
            {error?.message || '알 수 없는 오류'}
          </p>
        )}

        <button
          onClick={onRetry}
          className="w-full h-10 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors active:scale-95"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default ErrorBoundary;