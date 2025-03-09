# Domain Acquisition and Setup

## Domain Details
- Domain: lawnsync.ai
- Registrar: Namecheap
- Purchase Date: March 8, 2025
- Renewal: $92.98/year

## Next Steps

### 1. DNS Configuration (Today)
- [ ] Configure A records:
  ```
  lawnsync.ai         -> Vercel Production
  www.lawnsync.ai     -> Vercel Production
  staging.lawnsync.ai -> Vercel Staging
  api.lawnsync.ai     -> Vercel API
  ```
- [ ] Add CNAME records for Vercel
- [ ] Configure email records (SPF, DKIM, DMARC)

### 2. SSL Setup (Today)
- [ ] Generate SSL certificates through Let's Encrypt
- [ ] Configure SSL in Vercel
- [ ] Verify SSL installation
- [ ] Enable HSTS

### 3. Vercel Configuration (Today)
- [ ] Add domain to Vercel project
- [ ] Configure domain settings
- [ ] Set up automatic SSL
- [ ] Configure staging subdomain

### 4. Application Updates (Today)
- [ ] Update environment variables with new domain
- [ ] Configure OAuth redirect URIs
- [ ] Update API endpoints
- [ ] Configure email settings

### 5. Testing (Tomorrow)
- [ ] Verify DNS propagation
- [ ] Test SSL certificates
- [ ] Validate staging environment
- [ ] Test production deployment
- [ ] Verify email functionality
- [ ] Test OAuth flows

## Technical Details

### DNS Records to Configure
```
# A Records
@ -> Vercel IP
www -> Vercel IP
staging -> Vercel IP
api -> Vercel IP

# CNAME Records
cname.vercel-dns.com

# TXT Records
@ -> v=spf1 include:_spf.google.com ~all
```

### Environment Variables to Update
```env
# Production
NEXT_PUBLIC_URL=https://lawnsync.ai
NEXTAUTH_URL=https://lawnsync.ai
API_URL=https://api.lawnsync.ai

# Staging
NEXT_PUBLIC_URL=https://staging.lawnsync.ai
NEXTAUTH_URL=https://staging.lawnsync.ai
API_URL=https://staging.api.lawnsync.ai
```

### OAuth Configuration
- Update Google OAuth redirect URIs
- Update email service domain verification
- Configure CORS for new domains

## Security Measures

### 1. DNS Security
- [ ] Enable DNSSEC
- [ ] Configure CAA records
- [ ] Set up DNS monitoring

### 2. SSL Security
- [ ] Enable HSTS
- [ ] Configure SSL monitoring
- [ ] Set up SSL renewal alerts

### 3. Domain Security
- [ ] Enable domain lock
- [ ] Set up domain monitoring
- [ ] Configure domain expiry alerts

## Timeline

### Today (March 8, 2025)
- Configure initial DNS records
- Set up SSL certificates
- Configure Vercel
- Update application settings

### Tomorrow (March 9, 2025)
- Complete DNS propagation
- Verify all configurations
- Run full test suite
- Document final setup

## Notes
- Keep Namecheap account details secure
- Monitor DNS propagation (can take 24-48 hours)
- Test all subdomains individually
- Verify SSL certificate installation
- Document all configuration changes