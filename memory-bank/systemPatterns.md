# System Patterns

## Code Organization

### Directory Structure
```
src/
  ├── app/           # Next.js App Router pages
  ├── components/    # React components
  ├── lib/          # Utilities and services
  ├── types/        # TypeScript types
  └── server/       # Server-side code
```

### Naming Conventions
1. Components
   - PascalCase for component files (e.g., LawnProfileForm.tsx)
   - Suffix with type (e.g., UserContext.tsx, AuthProvider.tsx)
   - Group by feature in directories

2. Utilities
   - camelCase for utility files
   - Descriptive, action-based names
   - Group by functionality

3. Types
   - Suffix interfaces with type (e.g., UserData, LawnProfile)
   - Use consistent prefixes (e.g., Create-, Update-, Delete-)
   - Keep in feature-specific files

## Component Patterns

### Component Structure

## TypeScript Patterns

### Type Definition Best Practices
```typescript
// Prefer undefined over null for optional values
interface GoodPattern {
  optionalField?: string;    // ✓ Use undefined
  arrayField?: string[];     // ✓ Optional array
}

interface AvoidPattern {
  optionalField: string | null;  // ✗ Avoid null
  arrayField: string[] | null;   // ✗ Avoid null arrays
}
```

### State Updates with TypeScript
```typescript
// Explicit return types for state updates
const [state, setState] = useState<MyType>();

// Good: Explicit type annotation
setState((prev): MyType => ({
  ...prev,
  field: newValue
}));

// Avoid: Implicit return type
setState(prev => ({
  ...prev,
  field: newValue
}));
```

### API Contract Alignment
```typescript
// Define API types first, then implement
export interface ApiContract {
  input: {
    field: string;
    optionalField?: string; // Use undefined consistently
  };
  output: {
    result: string;
  };
}

// Frontend and backend share types
const apiCall = async (input: ApiContract['input']): Promise<ApiContract['output']> => {
  // Implementation
};
```

### Type Safety Guidelines
1. API Contract First
   - Define shared types between frontend and backend
   - Use consistent nullability (prefer undefined)
   - Document breaking changes
   - Validate types at API boundaries

2. State Management
   - Use explicit type annotations in state updates
   - Define clear interfaces for component state
   - Avoid type assertions unless absolutely necessary
   - Document any type assertions with comments

3. Component Design
   - Consider type requirements during design phase
   - Create reusable type utilities
   - Keep type definitions close to usage
   - Use strict TypeScript configuration

4. Type Transformations
   - Create utility functions for common transformations
   - Handle nullable values consistently
   - Validate data at boundaries
   - Use type guards for runtime safety

5. Error Prevention
   - Review type definitions during code review
   - Use strict null checks
   - Document type expectations
   - Write type-safe utility functions

### Common Pitfalls
```typescript
// Avoid mixing null and undefined
// ✗ Bad
type Inconsistent = {
  field1: string | null;
  field2?: string;
}

// ✓ Good
type Consistent = {
  field1?: string;
  field2?: string;
}

// Avoid type assertions without validation
// ✗ Bad
const data = someData as MyType;

// ✓ Good
function isMyType(data: unknown): data is MyType {
  // Validation logic
  return true;
}
const data = validateMyType(someData);
```

```typescript
// Imports grouped by type
import { type dependencies } from 'external'
import { type internal } from '@/internal'

// Types at the top
interface Props {
  // Props definition
}

// Component definition
export function ComponentName({ prop1, prop2 }: Props) {
  // Hook calls
  // State management
  // Event handlers
  // Render logic
}
```

### State Management
1. Server State
   - Use React Query for API data
   - Implement stale-while-revalidate
   - Handle loading/error states

2. Client State
   - Use Zustand for global state
   - React state for component-level
   - Derive state when possible

### Form Handling
1. Structure
   - Form component wrapper
   - Field-level components
   - Validation schema
   - Submit handler

2. Validation
   - Zod schemas
   - Field-level validation
   - Form-level validation
   - Error messaging

## API Patterns

### TRPC Procedures
1. Structure
```typescript
export const exampleRouter = router({
  list: protectedProcedure
    .input(schema)
    .query(async ({ ctx, input }) => {
      // Implementation
    }),
  // Other procedures
})
```

2. Error Handling
```typescript
try {
  // Operation
} catch (error) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Specific error message',
    cause: error
  })
}
```

### Authentication
1. Protected Routes
```typescript
export const protectedProcedure = procedure.use(isAuthed)

export const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      session: ctx.session
    }
  })
})
```

2. Session Handling
```typescript
export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id
      }
    })
  }
}
```

## Database Patterns

### Prisma Operations
1. Query Structure
```typescript
const result = await prisma.model.findMany({
  where: {
    // Conditions
  },
  include: {
    // Relations
  },
  orderBy: {
    // Sorting
  }
})
```

2. Error Handling
```typescript
try {
  await prisma.$transaction(async (tx) => {
    // Operations
  })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific error
  }
  throw error
}
```

## Testing Patterns

### Unit Tests
```typescript
describe('Component/Function', () => {
  it('should handle specific case', () => {
    // Arrange
    // Act
    // Assert
  })
})
```

### Integration Tests
```typescript
describe('Feature', () => {
  beforeAll(async () => {
    // Setup
  })

  afterAll(async () => {
    // Cleanup
  })

  it('should work end-to-end', async () => {
    // Implementation
  })
})
```

## Error Handling Patterns

### Client-Side
```typescript
try {
  const result = await mutation.mutateAsync(data)
  toast.success('Operation successful')
} catch (error) {
  toast.error(getErrorMessage(error))
}
```

### Server-Side
```typescript
export function handleServerError(error: unknown): ApiError {
  if (error instanceof CustomError) {
    return {
      code: error.code,
      message: error.message
    }
  }
  return {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  }
}
```

## Scheduling Patterns

### Recurring Schedule Structure
```typescript
interface RecurringSchedule {
  pattern: {
    frequency: 'daily' | 'weekly' | 'monthly'
    interval: number
    weekdays?: number[]
    monthDay?: number
    endType: 'never' | 'after_occurrences' | 'on_date'
    occurrences?: number
    endDate?: Date
  }
  exceptions: {
    originalDate: Date
    newDate?: Date
    isCancelled: boolean
  }[]
}
```

### Pattern Generation
```typescript
function generateOccurrences(pattern: RecurringPattern, startDate: Date, endDate: Date): Date[] {
  // Implementation based on frequency
  switch (pattern.frequency) {
    case 'daily':
      return generateDailyOccurrences(pattern, startDate, endDate)
    case 'weekly':
      return generateWeeklyOccurrences(pattern, startDate, endDate)
    case 'monthly':
      return generateMonthlyOccurrences(pattern, startDate, endDate)
  }
}
```

### Exception Handling
```typescript
function applyExceptions(dates: Date[], exceptions: RecurrenceException[]): Date[] {
  return dates.map(date => {
    const exception = findException(date, exceptions)
    if (!exception) return date
    if (exception.isCancelled) return null
    return exception.newDate
  }).filter(Boolean)
}
```

## Weather Integration Patterns

### Weather Check Structure
```typescript
interface WeatherCheck {
  date: Date
  location: {
    latitude: number
    longitude: number
    timezone: string
  }
  conditions: {
    temperature: number
    humidity: number
    precipitation: number
    windSpeed: number
  }
  treatmentType: string
}
```

### Weather Optimization
```typescript
function optimizeSchedule(schedule: Schedule, weatherData: WeatherData[]): Schedule {
  return {
    ...schedule,
    treatments: schedule.treatments.map(treatment => {
      const weather = findWeatherForDate(treatment.date, weatherData)
      const score = calculateWeatherScore(weather, treatment.type)
      
      if (score < WEATHER_THRESHOLD) {
        return findAlternativeDate(treatment, weatherData)
      }
      return treatment
    })
  }
}
```

### Weather Monitoring
```typescript
function monitorWeatherConditions(schedule: Schedule): void {
  // Monitor upcoming treatments
  schedule.treatments.forEach(treatment => {
    if (isUpcoming(treatment.date)) {
      startWeatherMonitoring(treatment)
    }
  })
}

function handleWeatherAlert(alert: WeatherAlert): void {
  if (alert.severity === 'critical') {
    createException(alert.treatmentId, alert.suggestedDate)
    notifyUser(alert)
  }
}
```

## UI/UX Patterns

### Loading States
1. Skeleton Loading
```tsx
{isLoading ? <Skeleton /> : <Content />}
```

2. Button Loading
```tsx
<Button
  disabled={isLoading}
  onClick={handleAction}
>
  {isLoading ? 'Processing...' : 'Submit'}
</Button>
```

### Error States
1. Form Errors
```tsx
{errors.field && (
  <ErrorMessage>{errors.field.message}</ErrorMessage>
)}
```

2. API Errors
```tsx
{error && (
  <Alert variant="error">{error.message}</Alert>
)}
```

### Responsive Design
```tsx
<div className="
  grid
  grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
  gap-4
">
  {/* Content */}
</div>