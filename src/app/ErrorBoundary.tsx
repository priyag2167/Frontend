import { Component, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <main className="connection-error">
        <h1>This page could not be loaded</h1>
        <p>Reload the workspace to continue.</p>
        <button
          className="btn primary"
          onClick={() => window.location.reload()}
        >
          Reload workspace <ArrowUpRight size={16} />
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
