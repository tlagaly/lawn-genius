# Browser Testing Guide for Roo

## Authentication Bypass System

When testing flows in the browser, Roo should follow these steps:

1. **Before Starting Tests**
   - Ensure NEXT_PUBLIC_TEST_MODE="true" exists in .env
   - Ensure development server is running by checking:
     ```
     # If server is not running or needs rebuild:
     npm run build && npm run dev
     
     # Wait for the message "Ready in [time]"
     # The server must be fully started before testing
     ```

2. **Browser Testing Process**
   - Use browser_action tool to launch browser at http://localhost:3000
   - Navigate directly to any dashboard route (e.g., /dashboard)
   - Authentication will be automatically handled:
     * Test user will be created if needed
     * Session will be established automatically
     * No manual login required

3. **Test User Credentials**
   If needed for reference:
   - Email: test@example.com
   - Password: password123

4. **Example Usage**

```typescript
// Example of direct dashboard access
<browser_action>
<action>launch</action>
<url>http://localhost:3000/dashboard</url>
</browser_action>

// Example of testing protected feature
<browser_action>
<action>launch</action>
<url>http://localhost:3000/dashboard/lawn/new</url>
</browser_action>
```

5. **Important Notes**
   - No need to visit login page
   - No need to handle authentication flows
   - System only works in development environment
   - Test mode must be enabled in .env