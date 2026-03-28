'use client'
import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Custom fallback UI. If omitted, a default error card is shown. */
  fallback?: ReactNode
  /** Optional label for the error card heading (e.g. "Board", "AI Generator") */
  context?: string
}

interface State {
  hasError: boolean
  message: string
}

/**
 * ErrorBoundary — catches render-time errors in its subtree and shows a
 * recovery UI instead of a blank screen.
 *
 * Placement:
 *   - Root: wraps the whole <AppShell> — catches anything not caught lower
 *   - Feature: wraps Kanban board and AI generator individually so one
 *     section crashing doesn't take down the whole app
 *
 * Usage:
 *   <ErrorBoundary context="Board">
 *     <KanbanBoard />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // In production, wire this to your error monitoring service (Sentry, etc.)
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      const context = this.props.context ?? 'This section'
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-white font-semibold text-lg mb-1">{context} encountered an error</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-sm">
            Something went wrong while rendering this section. Your data is safe.
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Try again
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg p-3 max-w-md text-left overflow-auto">
              {this.state.message}
            </pre>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
