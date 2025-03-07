import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeatherAlertList } from '../WeatherAlertList';
import { WeatherAlert, Location } from '@/lib/weather/types';
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

describe('WeatherAlertList', () => {
  const mockLocation: Location = {
    latitude: 41.8781,
    longitude: -87.6298,
    timezone: 'America/Chicago',
  };

  const mockAlerts: WeatherAlert[] = [
    {
      id: 'alert-1',
      treatmentId: 'treatment-1',
      treatmentType: 'Fertilization',
      type: 'temperature',
      severity: 'critical',
      message: 'Temperature is too high for fertilization',
      createdAt: new Date('2025-03-06T10:00:00'),
      location: mockLocation,
      originalDate: new Date('2025-03-06'),
    },
    {
      id: 'alert-2',
      treatmentId: 'treatment-2',
      treatmentType: 'Mowing',
      type: 'wind',
      severity: 'warning',
      message: 'High winds expected during mowing time',
      createdAt: new Date('2025-03-06T09:00:00'),
      location: mockLocation,
      originalDate: new Date('2025-03-06'),
    },
    {
      id: 'alert-3',
      treatmentId: 'treatment-3',
      treatmentType: 'Seeding',
      type: 'precipitation',
      severity: 'warning',
      message: 'Light rain forecast during seeding',
      createdAt: new Date('2025-03-06T11:00:00'),
      location: mockLocation,
      originalDate: new Date('2025-03-06'),
    },
  ];

  const mockOnReschedule = jest.fn().mockImplementation(() => Promise.resolve());

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all alerts', () => {
    render(<WeatherAlertList alerts={mockAlerts} onReschedule={mockOnReschedule} />);

    mockAlerts.forEach(alert => {
      expect(screen.getByText(alert.message)).toBeInTheDocument();
    });
    expect(screen.getByText(`Weather Alerts (${mockAlerts.length})`)).toBeInTheDocument();
  });

  it('returns null when no alerts are provided', () => {
    const { container } = render(<WeatherAlertList alerts={[]} onReschedule={mockOnReschedule} />);
    expect(container.firstChild).toBeNull();
  });

  it('allows dismissing alerts', () => {
    render(<WeatherAlertList alerts={mockAlerts} onReschedule={mockOnReschedule} />);

    // Initially shows all alerts
    expect(screen.getAllByRole('heading', { name: /Weather Alert/i })).toHaveLength(3);

    // Dismiss first alert
    const dismissButtons = screen.getAllByRole('button', { name: /Dismiss/i });
    fireEvent.click(dismissButtons[0]);

    // Should now show one less alert
    expect(screen.getAllByRole('heading', { name: /Weather Alert/i })).toHaveLength(2);
    expect(screen.queryByText('Temperature is too high for fertilization')).not.toBeInTheDocument();
  });

  it('calls onReschedule with correct parameters', async () => {
    render(<WeatherAlertList alerts={mockAlerts} onReschedule={mockOnReschedule} />);

    // Open reschedule options for first alert
    const rescheduleButtons = screen.getAllByText(/View rescheduling options/i);
    fireEvent.click(rescheduleButtons[0]);

    // Select new date
    const dateOption = screen.getByText(/Score: 4\/5/).parentElement?.parentElement as HTMLElement;
    fireEvent.click(dateOption);

    expect(mockOnReschedule).toHaveBeenCalledWith('treatment-1', new Date('2025-03-08'));
  });

  it('resets dismissed alerts when alerts prop changes', () => {
    const { rerender } = render(<WeatherAlertList alerts={mockAlerts} onReschedule={mockOnReschedule} />);

    // Dismiss an alert
    const dismissButtons = screen.getAllByRole('button', { name: /Dismiss/i });
    fireEvent.click(dismissButtons[0]);

    // Verify alert is dismissed
    expect(screen.queryByText('Temperature is too high for fertilization')).not.toBeInTheDocument();

    // Update alerts prop
    const newAlerts = [...mockAlerts];
    rerender(<WeatherAlertList alerts={newAlerts} onReschedule={mockOnReschedule} />);

    // Verify all alerts are shown again
    mockAlerts.forEach(alert => {
      expect(screen.getByText(alert.message)).toBeInTheDocument();
    });
  });

  it('displays treatment types for each alert', () => {
    render(<WeatherAlertList alerts={mockAlerts} onReschedule={mockOnReschedule} />);

    expect(screen.getByText(/Fertilization/)).toBeInTheDocument();
    expect(screen.getByText(/Mowing/)).toBeInTheDocument();
    expect(screen.getByText(/Seeding/)).toBeInTheDocument();
  });
});