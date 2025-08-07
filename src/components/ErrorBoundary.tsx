import React, { Component, ErrorInfo, ReactNode } from 'react';
import SimpleModelViewer from './SimpleModelViewer';

interface Props {
  children: ReactNode;
  modelUrl: string;
  className?: string;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('3D Viewer Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SimpleModelViewer 
          modelUrl={this.props.modelUrl}
          className={this.props.className}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
