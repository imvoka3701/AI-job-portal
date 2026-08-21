import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "./Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-red-200 rounded-xl bg-red-50/50 max-w-lg mx-auto mt-12">
          <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-red-100 text-red-500">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Đã có lỗi xảy ra</h3>
          <p className="text-sm text-gray-500 mb-6 text-balance">
            {this.state.error?.message || "Rất tiếc, hệ thống gặp sự cố trong quá trình tải giao diện. Vui lòng thử lại sau."}
          </p>
          <Button onClick={this.handleReset} variant="outline" className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            Tải lại trang
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
