import React, { useEffect } from 'react';
import { useMonitoring } from './index';

export function withPerformanceTracking<P extends JSX.IntrinsicAttributes>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  const displayName = `withPerformanceTracking(${componentName})`;

  const WithPerformanceTracking: React.FC<P> = (props) => {
    const startTime = performance.now();
    const { trackRenderTime } = useMonitoring();

    useEffect(() => {
      trackRenderTime(componentName, startTime);
    }, []);

    return React.createElement(WrappedComponent, props);
  };

  WithPerformanceTracking.displayName = displayName;

  return WithPerformanceTracking;
}