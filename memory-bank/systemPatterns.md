# System Patterns

## User Profile Management

### Component Patterns
1. Form Components
   ```typescript
   // Split into logical units
   - ProfileForm     // Basic information
   - PrivacySettings // Privacy controls
   - ImageUpload     // Profile picture
   
   // Common structure
   export function ComponentName() {
     const [isEditing, setIsEditing] = useState(false);
     const { data, isLoading } = api.user.someQuery.useQuery();
     const mutation = api.user.someMutation.useMutation({
       onSuccess: () => handleSuccess(),
       onError: () => handleError(),
     });
   }
   ```

2. Form Validation
   ```typescript
   // Zod schema definition
   const validationSchema = z.object({
     field: z.string().min(2).max(50),
   });
   
   // React Hook Form usage
   const {
     register,
     handleSubmit,
     formState: { errors },
   } = useForm({
     resolver: zodResolver(validationSchema),
   });
   ```

3. Toast Notifications
   ```typescript
   // Success notifications
   toast.success('Operation completed');
   
   // Error notifications
   toast.error(error.message);
   ```

### TRPC Patterns
1. Router Structure
   ```typescript
   export const userRouter = createTRPCRouter({
     // Query procedures
     getData: protectedProcedure
       .query(async ({ ctx }) => {
         // Implementation
       }),
     
     // Mutation procedures
     updateData: protectedProcedure
       .input(validationSchema)
       .mutation(async ({ ctx, input }) => {
         // Implementation
       }),
   });
   ```

2. Error Handling
   ```typescript
   try {
     // Operation
   } catch (error) {
     throw new TRPCError({
       code: 'INTERNAL_SERVER_ERROR',
       message: 'Operation failed',
     });
   }
   ```

### Auth Patterns
1. Protected Routes
   ```typescript
   // Middleware configuration
   export const config = {
     matcher: [
       '/dashboard/:path*',
       '/api/trpc/:path*',
     ],
   };
   ```

2. JWT Handling
   ```typescript
   // Development mode
   encode: ({ token }) => {
     const encodedToken = Buffer.from(JSON.stringify(token))
       .toString('base64');
     return encodedToken;
   }
   ```

### UI Patterns
1. Loading States
   ```typescript
   if (isLoading) {
     return <div>Loading...</div>;
   }
   ```

2. Form Layout
   ```tsx
   <form className="space-y-6">
     <div className="space-y-4">
       {/* Form fields */}
     </div>
     <div className="flex justify-end space-x-4">
       {/* Action buttons */}
     </div>
   </form>
   ```

3. Responsive Design
   ```tsx
   <div className="grid gap-8 md:grid-cols-[300px,1fr]">
     {/* Responsive layout */}
   </div>
   ```

## Previous Patterns
[Previous patterns remain unchanged]

## Notes
- Patterns focus on maintainability
- Consistent error handling
- Type safety emphasized
- Responsive design considered
- User feedback prioritized