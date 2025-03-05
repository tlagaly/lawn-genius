# Component Registry

## Authentication Components
- LoginForm: User login interface with email/password and Google OAuth support
- RegisterForm: New user registration with default notification preferences
- ForgotPasswordForm: Password reset request

## Navigation Components
- MainNav: Main navigation bar
- Footer: Site footer
- DashboardNav: Dashboard navigation menu

## Lawn Management Components
- LawnProfileForm: Create/edit lawn profiles
- LawnProfileList: Display lawn profiles
- LawnProfileDetail: Show detailed lawn information

## Schedule Management Components
- ScheduleForm: Create and edit treatment schedules with smart weather-based scheduling
- ScheduleCalendar: Calendar view of treatments with weather forecasts and condition indicators
- TreatmentList: Manage treatments with effectiveness tracking and weather analysis

## Weather Components
- WeatherAlert: Display individual weather alerts with rescheduling options
- WeatherAlertList: Manage and display multiple weather alerts
- WeatherAlerts: Dashboard integration for weather alert system

## Notification Components
- NotificationPreferences: UI component for managing notification settings including:
  - Email notifications toggle
  - Push notifications with browser permission handling
  - Notification frequency (immediate/daily/weekly)
  - Weather condition monitoring selection
  - Alert threshold configuration
- NotificationHistory: Component for displaying and managing notification history with:
  - Read/unread status
  - Notification type icons
  - Timestamp formatting
  - Mark as read functionality

## Provider Components
- TRPCProvider: Provides tRPC client context with:
  - Query client setup
  - HTTP batch link configuration
  - SuperJSON transformer

## UI Components
- Various reusable UI components

## Pages
- Landing page (/)
- Dashboard (/dashboard)
- Lawn management (/dashboard/lawn)
- Notifications (/dashboard/notifications)
- Authentication pages:
  - Login (/auth/login)
  - Register (/auth/register)
  - Forgot Password (/auth/forgot-password)