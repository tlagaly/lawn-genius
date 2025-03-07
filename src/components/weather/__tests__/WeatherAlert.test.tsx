import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeatherAlert } from '../WeatherAlert';
import { WeatherAlert as WeatherAlertType, Location } from '@/lib/weather/types';
import { api } from '@/lib/trpc/client';

// Mock the tRPC client
jest.mock('@/lib/trpc/client', () => ({
  api: {
    weather: {
      getRescheduleOptions: {
        useQuery: jest.fn(() => ({
          data: [
            {
              date: new Date('2025-03-08'),
              score: 4,
              conditions: {
                temperature: 20,
                humidity: 50,
                precipitation: 0,
                windSpeed: 5,
                conditions: 'Clear',
              },
            },
          ],
        })),
      },
    },
  },
}));

describe('WeatherAlert', () => {
  const mockLocation: Location = {
    latitude: 41.8781,
    longitude: -87.6298,
    timezone: 'America/Chicago',
  };

  const mockAlert: WeatherAlertType = {
    id: 'alert-1',
    treatmentId: 'treatment-1',
    treatmentType: 'Fertilization',
    type: 'temperature',
    severity: 'warning',
    message: 'Temperature is too high for treatment',
    suggestedDate: new Date('2025-03-07'),
    createdAt: new Date(),
    location: mockLocation,
    originalDate: new Date('2025-03-06'),
  };

  const mockProps = {
    alert: mockAlert,
    treatmentType: 'Fertilization',
    location: mockLocation,
    originalDate: new Date('2025-03-06'),
    onReschedule: jest.fn(),
    onDismiss: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders alert with correct severity styling', () => {
    render(<WeatherAlert {...mockProps} />);

    const alertElement = screen.getByText('Weather Alert').parentElement?.parentElement;
    expect(alertElement).toHaveClass('bg-yellow-100');
    expect(screen.getByText(mockAlert.message)).toBeInTheDocument();
  });

  it('renders critical alert with appropriate styling', () => {
    const criticalProps = {
      ...mockProps,
      alert: { ...mockAlert, severity: 'critical' as const },
    };
    render(<WeatherAlert {...criticalProps} />);

    const alertElement = screen.getByText('Weather Alert').parentElement?.parentElement;
    expect(alertElement).toHaveClass('bg-red-100');
  });

  it('shows dismiss button when onDismiss is provided', () => {
    render(<WeatherAlert {...mockProps} />);

    const dismissButton = screen.getByRole('button', { name: /Dismiss/i });
    fireEvent.click(dismissButton);
    expect(mockProps.onDismiss).toHaveBeenCalled();
  });

  it('does not show dismiss button when onDismiss is not provided', () => {
    const propsWithoutDismiss = {
      ...mockProps,
      onDismiss: undefined,
    };
    render(<WeatherAlert {...propsWithoutDismiss} />);

    expect(screen.queryByRole('button', { name: /Dismiss/i })).not.toBeInTheDocument();
  });

  it('shows reschedule options when button is clicked', () => {
    render(<WeatherAlert {...mockProps} />);

    const rescheduleButton = screen.getByText(/View rescheduling options/i);
    fireEvent.click(rescheduleButton);

    // Check that the options are displayed
    expect(screen.getByText(/Score: 4\/5/)).toBeInTheDocument();
    expect(screen.getByText(/Clear, 20°C/)).toBeInTheDocument();
  });

  it('calls onReschedule when a new date is selected', () => {
    render(<WeatherAlert {...mockProps} />);

    // Open reschedule options
    fireEvent.click(screen.getByText(/View rescheduling options/i));

    // Select a new date
    fireEvent.click(screen.getByText(/Score: 4\/5/).parentElement?.parentElement as HTMLElement);

    expect(mockProps.onReschedule).toHaveBeenCalledWith(new Date('2025-03-08'));
  });

  it('handles missing onReschedule prop', () => {
    const propsWithoutReschedule = {
      ...mockProps,
      onReschedule: undefined,
    };
    render(<WeatherAlert {...propsWithoutReschedule} />);

    expect(screen.queryByText(/View rescheduling options/i)).not.toBeInTheDocument();
  });

  it('disables buttons while rescheduling', async () => {
    render(<WeatherAlert {...mockProps} />);

    // Open reschedule options
    fireEvent.click(screen.getByText(/View rescheduling options/i));

    // Click reschedule button
    const rescheduleButton = screen.getByText(/Score: 4\/5/).parentElement?.parentElement as HTMLElement;
    fireEvent.click(rescheduleButton);

    // Verify buttons are disabled during loading
    expect(rescheduleButton).toBeDisabled();
    expect(screen.getByText(/View rescheduling options/i)).toBeDisabled();
  });

  it('displays treatment type', () => {
    render(<WeatherAlert {...mockProps} />);
    expect(screen.getByText(/Fertilization/)).toBeInTheDocument();
  });

  it('displays location timezone', () => {
    render(<WeatherAlert {...mockProps} />);
    expect(screen.getByText(/America\/Chicago/)).toBeInTheDocument();
  });
});