import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm font-medium text-red-800">加载出错</p>
            <p className="text-xs text-red-600 mt-1">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="mt-3 text-sm text-red-600 underline"
            >
              重试
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
