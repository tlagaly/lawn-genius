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