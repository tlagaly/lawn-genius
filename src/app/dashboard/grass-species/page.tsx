"use client";

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { SpeciesSelection } from '@/components/grass-species/SpeciesSelection';

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="text-center py-8">
      <h2 className="text-xl font-semibold text-red-600 mb-4">Something went wrong</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

export default function GrassSpeciesPage() {
  const handleSpeciesSelect = (species: any) => {
    console.log('Selected species:', species);
    // This will be handled by the parent lawn profile form
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Grass Species Selection
          </h1>
          <p className="text-gray-600">
            Choose the ideal grass species for your lawn based on your climate and maintenance preferences.
          </p>
        </div>

        {/* Species Selection Component */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<LoadingSpinner />}>
            <SpeciesSelection
              onSpeciesSelect={handleSpeciesSelect}
            />
          </Suspense>
        </ErrorBoundary>

        {/* Additional Information */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Why Choose the Right Grass Species?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Climate Adaptation
              </h3>
              <p className="text-gray-600">
                Different grass species thrive in specific climate conditions.
                Choosing a species well-suited to your region ensures better
                growth and resilience.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Maintenance Requirements
              </h3>
              <p className="text-gray-600">
                Each species has unique maintenance needs. Select a grass that
                matches your desired level of lawn care commitment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}