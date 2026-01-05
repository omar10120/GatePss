# Deployment Guide - Majis Gate Pass System

## Overview

This guide covers deploying the Gate Pass System to production environments.

## Pre-Deployment Checklist

### Security
- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET (minimum 32 characters)
- [ ] Set up production database with strong credentials
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up firewall rules
- [ ] Enable database backups
- [ ] Review and restrict CORS settings
- [ ] Set up rate limiting on public endpoints

### Configuration
- [ ] Update all environment variables for production
- [ ] Set `USE_MOCK_SOHAR_API=false`
- [ ] Configure production SMTP settings
- [ ] Set correct `NEXT_PUBLIC_APP_URL`
- [ ] Configure Sohar Port API credentials
- [ ] Set up admin email addresses

### Database
- [ ] Create production MySQL database
- [ ] Run migrations: `npm run db:migrate`
- [ ] Seed initial data: `npm run db:seed`
- [ ] Set up automated backups
- [ ] Configure connection pooling

### Testing
- [ ] Test all API endpoints
- [ ] Test email delivery
- [ ] Test file uploads
- [ ] Test Sohar Port API integration
- [ ] Test authentication and authorization
- [ ] Test on mobile devices
- [ ] Test in both English and Arabic

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

#### Prerequisites
- Vercel account
- GitHub/GitLab repository
- External MySQL database (PlanetScale, AWS RDS, etc.)

#### Steps

1. **Prepare Database**
   ```bash
   # Use a managed MySQL service like PlanetScale or AWS RDS
   # Get connection string
   ```

2. **Push to Git**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

3. **Deploy to Vercel**
   - Go to vercel.com
   - Import your repository
   - Configure environment variables (copy from .env)
   - Deploy

4. **Configure Environment Variables in Vercel**
   - Go to Project Settings > Environment Variables
   - Add all variables from .env file
   - Update DATABASE_URL with production database

5. **Run Database Migrations**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login
   vercel login

   # Run migrations
   vercel env pull .env.local
   npx prisma migrate deploy
   npx prisma generate
   ```

#### Vercel Configuration

Create `vercel.json`:
```json
{
  "buildCommand": "prisma generate && next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### Option 2: AWS EC2

#### Prerequisites
- AWS account
- EC2 instance (t3.medium or larger recommended)
- Ubuntu 22.04 LTS

#### Steps

1. **Launch EC2 Instance**
   - Choose Ubuntu 22.04 LTS
   - Instance type: t3.medium (2 vCPU, 4GB RAM)
   - Configure security group:
     - SSH (22) - Your IP
     - HTTP (80) - 0.0.0.0/0
     - HTTPS (443) - 0.0.0.0/0
     - MySQL (3306) - Internal only

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install MySQL
   sudo apt install -y mysql-server

   # Install Nginx
   sudo apt install -y nginx

   # Install PM2 (Process Manager)
   sudo npm install -g pm2
   ```

4. **Configure MySQL**
   ```bash
   sudo mysql_secure_installation

   # Create database
   sudo mysql -u root -p
   ```
   ```sql
   CREATE DATABASE gate_pass_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'gatepass'@'localhost' IDENTIFIED BY 'strong_password';
   GRANT ALL PRIVILEGES ON gate_pass_system.* TO 'gatepass'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

5. **Deploy Application**
   ```bash
   # Clone repository
   cd /var/www
   sudo git clone <your-repo-url> gate-pass-system
   cd gate-pass-system

   # Install dependencies
   sudo npm install

   # Create .env file
   sudo nano .env
   # Paste production environment variables

   # Run migrations
   sudo npx prisma generate
   sudo npx prisma migrate deploy

   # Seed database
   sudo npm run db:seed

   # Build application
   sudo npm run build

   # Start with PM2
   sudo pm2 start npm --name "gate-pass" -- start
   sudo pm2 save
   sudo pm2 startup
   ```

6. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/gate-pass
   ```

   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       client_max_body_size 10M;
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/gate-pass /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Set Up SSL with Let's Encrypt**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

8. **Configure Firewall**
   ```bash
   sudo ufw allow 'Nginx Full'
   sudo ufw allow OpenSSH
   sudo ufw enable
   ```

### Option 3: Docker Deployment

#### Dockerfile

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mysql://gatepass:password@db:3306/gate_pass_system
      - JWT_SECRET=${JWT_SECRET}
      - SOHAR_PORT_API_URL=${SOHAR_PORT_API_URL}
      - SOHAR_PORT_API_KEY=${SOHAR_PORT_API_KEY}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
    depends_on:
      - db
    volumes:
      - ./public/uploads:/app/public/uploads

  db:
    image: mysql:8
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=gate_pass_system
      - MYSQL_USER=gatepass
      - MYSQL_PASSWORD=password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

Deploy with Docker:
```bash
docker-compose up -d
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run db:seed
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check application is running
curl https://your-domain.com

# Check API health
curl https://your-domain.com/api/health

# Test login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@majis.com","password":"Admin@123"}'
```

### 2. Set Up Monitoring

#### PM2 Monitoring (if using PM2)
```bash
pm2 monit
pm2 logs gate-pass
```

#### Set Up Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 3. Database Backups

#### Automated MySQL Backup Script

Create `/usr/local/bin/backup-db.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

mysqldump -u gatepass -p'password' gate_pass_system > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

Make executable and add to cron:
```bash
chmod +x /usr/local/bin/backup-db.sh
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-db.sh
```

### 4. Set Up Alerts

Configure email alerts for:
- Application crashes
- Database connection failures
- High error rates
- Disk space warnings

### 5. Performance Optimization

#### Enable Caching
```nginx
# In Nginx config
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### Database Optimization
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_created_at ON requests(created_at);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);
```

## Maintenance

### Regular Tasks

**Daily:**
- Monitor application logs
- Check error rates
- Verify email delivery

**Weekly:**
- Review activity logs
- Check disk space
- Review database performance

**Monthly:**
- Update dependencies
- Review security patches
- Analyze usage patterns
- Clean up old files

### Updating the Application

```bash
# Pull latest code
cd /var/www/gate-pass-system
sudo git pull

# Install dependencies
sudo npm install

# Run migrations
sudo npx prisma migrate deploy
sudo npx prisma generate

# Rebuild
sudo npm run build

# Restart application
sudo pm2 restart gate-pass
```

## Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs gate-pass

# Check Node.js version
node --version

# Check environment variables
pm2 env gate-pass
```

### Database Connection Issues
```bash
# Test MySQL connection
mysql -u gatepass -p gate_pass_system

# Check MySQL status
sudo systemctl status mysql

# View MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### High Memory Usage
```bash
# Check memory
free -h

# Restart application
pm2 restart gate-pass

# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## Security Best Practices

1. **Keep System Updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use Strong Passwords**
   - Database passwords: 20+ characters
   - JWT secret: 32+ characters
   - Admin passwords: Enforce complexity

3. **Enable Firewall**
   ```bash
   sudo ufw status
   sudo ufw enable
   ```

4. **Regular Backups**
   - Database: Daily
   - Files: Weekly
   - Test restore procedures

5. **Monitor Logs**
   - Application logs
   - Access logs
   - Error logs
   - Security logs

6. **SSL/TLS**
   - Use HTTPS only
   - Redirect HTTP to HTTPS
   - Keep certificates updated

## Support

For deployment issues:
1. Check application logs
2. Review this guide
3. Verify environment variables
4. Test database connection
5. Check firewall settings

---

**Last Updated:** November 2024
