# Component Registry

## Navigation Components

### MainNav
**Location**: `src/components/navigation/MainNav.tsx`
**Type**: Client Component
**Purpose**: Main navigation bar with responsive design
**Features**:
- Responsive navigation with mobile menu
- Active link highlighting using usePathname
- Brand logo and navigation links
- Mobile-friendly hamburger menu

**Props**: None
**State**: None (uses Next.js routing hooks)
**Dependencies**:
- next/link
- next/navigation (usePathname)

### Footer
**Location**: `src/components/navigation/Footer.tsx`
**Type**: Client Component
**Purpose**: Site-wide footer with company information and links
**Features**:
- Company information section
- Quick links navigation
- Contact information
- Responsive grid layout

**Props**: None
**State**: None
**Dependencies**:
- next/link

## Page Components

### HomePage
**Location**: `src/app/page.tsx`
**Type**: Server Component
**Features**:
- Hero section with CTA buttons
- Features grid
- Service highlights

### ServicesPage
**Location**: `src/app/services/page.tsx`
**Type**: Server Component
**Features**:
- Service cards grid
- Service descriptions
- Custom metadata

### SchedulePage
**Location**: `src/app/schedule/page.tsx`
**Type**: Server Component
**Features**:
- Booking form
- Service selection
- Contact information fields
- Custom metadata

### AboutPage
**Location**: `src/app/about/page.tsx`
**Type**: Server Component
**Features**:
- Company mission
- Values grid
- Team information
- Custom metadata

### ContactPage
**Location**: `src/app/contact/page.tsx`
**Type**: Server Component
**Features**:
- Contact form
- Company information
- Business hours
- Custom metadata

## Layout Components

### RootLayout
**Location**: `src/app/layout.tsx`
**Type**: Server Component
**Features**:
- Global layout structure
- Font configuration (Geist)
- Navigation integration
- Footer integration
- Metadata configuration

## Pending Components
- Form validation components
- Toast notifications
- Loading states
- Error boundaries
- Authentication components
- Dashboard components