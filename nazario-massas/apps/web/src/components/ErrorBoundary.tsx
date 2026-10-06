import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '@/components/ui/Feedback';

interface Props {
  children: ReactNode;
  /** Changing this key resets the boundary (e.g. on navigation). */
  resetKey?: string;
}

export class ErrorBoundary extends Component<Props, { error?: Error }> {
  override state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  override componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: undefined });
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="container-page pt-32 pb-24">
          <ErrorState message="Recarregue a página para tentar novamente." onRetry={() => window.location.reload()} />
        </div>
      );
    }
    return this.props.children;
  }
}
