import React, { useState } from 'react';
import { useMonitoring, withPerformanceTracking } from '@/hooks/useMonitoring';

interface Props {
  title: string;
}

function BaseComponent({ title }: Props) {
  const [count, setCount] = useState(0);
  const { trackInteraction } = useMonitoring();

  const handleClick = () => {
    trackInteraction('button_click', {
      component: 'MonitoredComponent',
      count: count + 1,
    });
    setCount(prev => prev + 1);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <p className="mb-4">Count: {count}</p>
      <button
        onClick={handleClick}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Increment
      </button>
    </div>
  );
}

// Wrap the component with performance tracking
export const MonitoredComponent = withPerformanceTracking(BaseComponent, 'MonitoredComponent');

// Example usage in another component:
/*
import { MonitoredComponent } from './MonitoredComponent';

function ParentComponent() {
  return (
    <div>
      <h1>Monitoring Example</h1>
      <MonitoredComponent title="Performance Tracked Component" />
    </div>
  );
}
*/

// Example of monitoring error boundaries:
export class MonitoredErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Use the monitoring service to track the error
    const monitoring = require('@/lib/monitoring').monitoring;
    monitoring.trackError(error, {
      componentStack: errorInfo.componentStack,
      source: 'error_boundary',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-500 rounded-lg">
          <h2 className="text-lg font-semibold text-red-500 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600">
            The error has been logged and our team has been notified.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Example of using the error boundary:
/*
function App() {
  return (
    <MonitoredErrorBoundary>
      <MonitoredComponent title="Protected Component" />
    </MonitoredErrorBoundary>
  );
}
*/