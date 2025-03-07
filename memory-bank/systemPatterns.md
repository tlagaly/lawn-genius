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

## Authentication Patterns

### Development Auth Bypass
```typescript
// Configuration for development authentication
export const devAuthConfig = {
  testUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    name: 'Test User'
  },
  sessionDuration: 30 * 24 * 60 * 60 * 1000 // 30 days
}

// Development-only authentication bypass
export const authOptions: NextAuthOptions = {
  ...baseConfig,
  callbacks: {
    session: async ({ session, token }) => {
      if (process.env.NODE_ENV === 'development') {
        // Auto-extend session in development
        session.expires = new Date(
          Date.now() + devAuthConfig.sessionDuration
        ).toISOString()
      }
      return session
    }
  }
}

// Middleware with development bypass
export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'development') {
    const hasAuthCookie = request.cookies.has('next-auth.session-token')
    if (!hasAuthCookie) {
      return handleDevAuth(request)
    }
  }
  return protectedRouteHandler(request)
}

// Development authentication handler
async function handleDevAuth(request: NextRequest) {
  // Auto-login with test account
  const response = await signIn('credentials', {
    email: devAuthConfig.testUser.email,
    password: devAuthConfig.testUser.password,
    redirect: false
  })

  if (response?.error) {
    console.error('Dev auth failed:', response.error)
    return new Response('Auth Error', { status: 500 })
  }

  return NextResponse.redirect(request.url)
}
```

### Protected Routes
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

### Session Handling
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

## Weather Integration Patterns

### Weather Service Configuration
```typescript
interface WeatherConfig {
  apiKey: string
  updateInterval: number
  alertThresholds: {
    temperature: number
    precipitation: number
    wind: number
  }
  scoreWeights: {
    temperature: number
    humidity: number
    precipitation: number
    wind: number
  }
}

const weatherConfig: WeatherConfig = {
  apiKey: process.env.OPENWEATHER_API_KEY,
  updateInterval: 30 * 60 * 1000, // 30 minutes
  alertThresholds: {
    temperature: 32, // Celsius
    precipitation: 0.5, // mm/hour
    wind: 20 // km/h
  },
  scoreWeights: {
    temperature: 0.4,
    humidity: 0.2,
    precipitation: 0.3,
    wind: 0.1
  }
}
```

### Weather Monitoring System
```typescript
class WeatherMonitor {
  private schedules: Map<string, Schedule> = new Map()
  private alerts: Map<string, WeatherAlert[]> = new Map()

  constructor(private config: WeatherConfig) {
    this.startMonitoring()
  }

  private async startMonitoring() {
    setInterval(async () => {
      for (const [id, schedule] of this.schedules) {
        await this.checkWeather(schedule)
      }
    }, this.config.updateInterval)
  }

  private async checkWeather(schedule: Schedule) {
    const weather = await this.fetchWeather(schedule.location)
    const score = this.calculateScore(weather)
    
    if (this.needsAlert(score)) {
      this.createAlert(schedule, weather)
    }
  }

  private calculateScore(weather: WeatherData): number {
    return Object.entries(this.config.scoreWeights)
      .reduce((score, [key, weight]) => {
        return score + (weather[key] * weight)
      }, 0)
  }
}
```

### Schedule Optimization
```typescript
interface OptimizationResult {
  score: number
  suggestedDate?: Date
  reason?: string
}

function optimizeSchedule(
  schedule: Schedule,
  forecast: WeatherForecast[]
): Schedule {
  return {
    ...schedule,
    treatments: schedule.treatments.map(treatment => {
      const result = findOptimalDate(treatment, forecast)
      
      if (result.score < WEATHER_THRESHOLD) {
        return {
          ...treatment,
          date: result.suggestedDate,
          adjustmentReason: result.reason
        }
      }
      return treatment
    })
  }
}

function findOptimalDate(
  treatment: Treatment,
  forecast: WeatherForecast[]
): OptimizationResult {
  const scores = forecast
    .map(day => ({
      date: day.date,
      score: calculateTreatmentScore(treatment, day)
    }))
    .sort((a, b) => b.score - a.score)

  return {
    score: scores[0].score,
    suggestedDate: scores[0].date,
    reason: 'Optimal weather conditions'
  }
}
```

### Machine Learning Patterns

```typescript
// Type-safe weather metrics
interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  conditions: string;
  [key: string]: number | string;
}

// Type guard for weather metrics
function isWeatherMetric(key: string): key is keyof WeatherData {
  return [
    'temperature',
    'humidity',
    'precipitation',
    'windSpeed',
    'conditions'
  ].includes(key);
}

// ML Service with confidence scoring
class WeatherMLService {
  private config: MLConfig = {
    minDataPoints: 50,
    confidenceThreshold: 0.7,
    trainingInterval: 24,
    featureWeights: {
      temperature: 1.0,
      humidity: 0.8,
      precipitation: 1.0,
      windSpeed: 0.6,
      soilMoisture: 0.9
    }
  };

  // Type-safe metric handling
  private calculateBaseScore(weatherData: WeatherData): number {
    let score = 0;
    let totalWeight = 0;

    for (const [feature, weight] of Object.entries(this.config.featureWeights)) {
      if (isWeatherMetric(feature) && typeof weatherData[feature] === 'number') {
        score += this.normalizeFeature(feature, weatherData[feature] as number) * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  // Metric-specific confidence scoring
  private calculateMetricConfidence(feature: string, value: number): number {
    let confidence = 0.9;

    switch (feature) {
      case 'temperature':
        if (value < 0 || value > 100) confidence *= 0.8;
        break;
      case 'humidity':
        if (value < 20) confidence *= 0.85;
        break;
      case 'windSpeed':
        if (value > 20) confidence *= 0.75;
        break;
    }

    return Math.max(confidence, this.config.confidenceThreshold);
  }

  // Quality-filtered training data
  async addTrainingData(data: TrainingData): Promise<void> {
    await prisma.weatherTrainingData.create({
      data: {
        weatherData: data.weatherConditions,
        treatmentType: data.treatmentType,
        effectiveness: data.effectiveness,
        dataQuality: 1.0,
        confidence: 0.9
      }
    });
  }
}
```

### Enhanced UI Component Patterns

```typescript
// Accessible Tooltip Pattern
function AccessibleTooltip({ content, children }: TooltipProps) {
  return (
    <Tooltip content={content}>
      <button
        type="button"
        className="bg-transparent hover:bg-accent/50 px-2 py-1 rounded transition-colors"
        onClick={(e) => e.stopPropagation()}
        aria-label={`Information: ${content}`}
      >
        {children}
      </button>
    </Tooltip>
  );
}

// Enhanced Image Component
function OptimizedImage({
  src,
  alt,
  description,
  priority = false
}: ImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative">
      {loading && (
        <div className="animate-pulse space-y-2 w-full h-full">
          <div className="h-full w-full bg-accent/20 rounded" />
        </div>
      )}
      
      <Image
        src={!error ? src : '/fallback.jpg'}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1080px) 50vw, 33vw"
        className={`
          object-cover
          transition-all duration-300
          ${loading ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}
        `}
        onError={() => {
          console.error(`Failed to load image: ${src}`);
          setError(true);
          setLoading(false);
        }}
        onLoad={() => setLoading(false)}
        priority={priority}
        quality={90}
      />

      {description && !loading && !error && (
        <AccessibleTooltip content={description}>
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2">
            {description.length > 50
              ? `${description.slice(0, 47)}...`
              : description}
          </div>
        </AccessibleTooltip>
      )}
    </div>
  );
}
```

### Alert System
```typescript
interface WeatherAlert {
  id: string
  scheduleId: string
  treatmentId: string
  severity: 'warning' | 'critical'
  condition: {
    type: 'temperature' | 'precipitation' | 'wind'
    value: number
    threshold: number
  }
  suggestedAction: {
    type: 'reschedule' | 'cancel' | 'modify'
    details: string
  }
  createdAt: Date
  expiresAt: Date
}

class AlertManager {
  private alerts: WeatherAlert[] = []

  createAlert(data: Omit<WeatherAlert, 'id' | 'createdAt'>): WeatherAlert {
    const alert = {
      ...data,
      id: generateId(),
      createdAt: new Date()
    }
    
    this.alerts.push(alert)
    this.notifyUsers(alert)
    return alert
  }

  private async notifyUsers(alert: WeatherAlert) {
    if (alert.severity === 'critical') {
      await Promise.all([
        this.sendPushNotification(alert),
        this.sendEmail(alert)
      ])
    }
  }
}
```

## Component Patterns

### Loading States
```tsx
function LoadingState({ children, isLoading, skeleton }: LoadingStateProps) {
  if (isLoading) {
    return skeleton || <DefaultSkeleton />
  }
  return children
}
```

### Error Handling
```tsx
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null)

  if (error) {
    return (
      <div className="error-container">
        <h3>Something went wrong</h3>
        <p>{error.message}</p>
        <button onClick={() => setError(null)}>Try again</button>
      </div>
    )
  }

  return children
}
```

### Form Patterns
```tsx
function FormWrapper<T extends FieldValues>({
  children,
  onSubmit,
  schema
}: FormWrapperProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema)
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {children}
      </form>
    </Form>
  )
}
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