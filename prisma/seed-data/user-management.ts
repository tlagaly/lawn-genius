import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedUserManagement(prisma: PrismaClient) {
  console.log('Creating user management seed data...');

  const users = [
    {
      base: {
        email: 'test@example.com',
        name: 'Test User',
        password: await bcrypt.hash('TestPassword123!', 10),
        emailVerified: new Date(),
        emailNotifications: true,
        pushNotifications: false,
        notifyFrequency: 'immediate'
      },
      profile: {
        displayName: 'Test User',
        bio: 'Passionate about lawn care and sustainable gardening.',
        location: 'Austin, TX',
        profession: 'Landscape Designer',
        expertise: ['lawn maintenance', 'irrigation systems'],
        certifications: ['Master Gardener'],
        privacySettings: {
          profileVisibility: 'public',
          showEmail: false,
          showLocation: true
        }
      },
      preferences: {
        theme: 'system',
        language: 'en',
        timezone: 'America/Chicago',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        measurementSystem: 'imperial',
        accessibility: {
          highContrast: false,
          largeText: false
        },
        dashboardLayout: {
          widgets: ['weather', 'schedule', 'lawn-health']
        }
      },
      settings: {
        primaryEmail: 'test@example.com',
        backupEmail: 'backup@example.com',
        emailVerified: true,
        twoFactorEnabled: false,
        marketingEmails: true,
        serviceUpdates: true,
        securityAlerts: true,
        sessionTimeout: 30,
        maxSessions: 5
      },
      loginRecord: {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        device: 'Desktop',
        location: 'Austin, TX, USA',
        status: 'success'
      }
    },
    {
      base: {
        email: 'pro@example.com',
        name: 'Pro User',
        password: await bcrypt.hash('ProPassword123!', 10),
        emailVerified: new Date(),
        emailNotifications: true,
        pushNotifications: true,
        notifyFrequency: 'daily'
      },
      profile: {
        displayName: 'Pro Landscaper',
        bio: 'Professional landscaper with 10+ years of experience.',
        location: 'Dallas, TX',
        profession: 'Professional Landscaper',
        organization: 'Green Thumb Landscaping',
        expertise: ['commercial landscaping', 'turf management', 'irrigation'],
        certifications: ['Licensed Landscape Professional', 'Irrigation Specialist'],
        privacySettings: {
          profileVisibility: 'public',
          showEmail: true,
          showLocation: true
        }
      },
      preferences: {
        theme: 'light',
        language: 'en',
        timezone: 'America/Chicago',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '24h',
        measurementSystem: 'imperial',
        accessibility: {
          highContrast: false,
          largeText: false
        },
        dashboardLayout: {
          widgets: ['schedule', 'weather', 'clients', 'equipment']
        }
      },
      settings: {
        primaryEmail: 'pro@example.com',
        backupEmail: 'pro-backup@example.com',
        emailVerified: true,
        twoFactorEnabled: true,
        twoFactorMethod: 'app',
        marketingEmails: false,
        serviceUpdates: true,
        securityAlerts: true,
        sessionTimeout: 60,
        maxSessions: 3
      },
      loginRecord: {
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        device: 'Mobile',
        location: 'Dallas, TX, USA',
        status: 'success'
      }
    }
  ];

  // Create users and their related data
  for (const userData of users) {
    try {
      await prisma.$transaction(async (tx) => {
        // Create base user
        const user = await tx.user.create({
          data: userData.base
        });

        // Create related records using raw SQL
        await tx.$executeRaw`
          INSERT INTO "UserProfile" ("id", "userId", "displayName", "bio", "location", "profession", "expertise", "certifications", "privacySettings", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${user.id}, ${userData.profile.displayName}, ${userData.profile.bio}, ${userData.profile.location}, ${userData.profile.profession}, 
                 ${userData.profile.expertise}::text[], ${userData.profile.certifications}::text[], ${JSON.stringify(userData.profile.privacySettings)}::jsonb,
                 NOW(), NOW());
        `;

        await tx.$executeRaw`
          INSERT INTO "UserPreferences" ("id", "userId", "theme", "language", "timezone", "dateFormat", "timeFormat", "measurementSystem", "accessibility", "dashboardLayout", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${user.id}, ${userData.preferences.theme}, ${userData.preferences.language}, ${userData.preferences.timezone},
                 ${userData.preferences.dateFormat}, ${userData.preferences.timeFormat}, ${userData.preferences.measurementSystem},
                 ${JSON.stringify(userData.preferences.accessibility)}::jsonb, ${JSON.stringify(userData.preferences.dashboardLayout)}::jsonb,
                 NOW(), NOW());
        `;

        await tx.$executeRaw`
          INSERT INTO "AccountSettings" ("id", "userId", "primaryEmail", "backupEmail", "emailVerified", "twoFactorEnabled", "marketingEmails", "serviceUpdates", "securityAlerts", "sessionTimeout", "maxSessions", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${user.id}, ${userData.settings.primaryEmail}, ${userData.settings.backupEmail}, ${userData.settings.emailVerified},
                 ${userData.settings.twoFactorEnabled}, ${userData.settings.marketingEmails}, ${userData.settings.serviceUpdates},
                 ${userData.settings.securityAlerts}, ${userData.settings.sessionTimeout}, ${userData.settings.maxSessions},
                 NOW(), NOW());
        `;

        await tx.$executeRaw`
          INSERT INTO "LoginRecord" ("id", "userId", "ipAddress", "userAgent", "device", "location", "status", "timestamp")
          VALUES (gen_random_uuid(), ${user.id}, ${userData.loginRecord.ipAddress}, ${userData.loginRecord.userAgent},
                 ${userData.loginRecord.device}, ${userData.loginRecord.location}, ${userData.loginRecord.status}, NOW());
        `;

        console.log(`✓ Created user and related data for: ${user.email}`);
      });
    } catch (error) {
      console.error(`Error creating user data:`, error);
      throw error;
    }
  }

  console.log('✓ User management seed data created');
}