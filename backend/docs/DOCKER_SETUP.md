# Docker Setup for PostgreSQL Database

This guide explains how to run PostgreSQL in a Docker container for the Library Management System backend.

## Prerequisites

- Docker installed on your machine
- Docker Compose installed
- No local PostgreSQL running on port 5432 (or change the port in docker-compose.yml)

## Quick Start

### 1. Start PostgreSQL Container

```bash
# Start PostgreSQL only
docker-compose up -d postgres

# Or start with pgAdmin (database GUI)
docker-compose --profile tools up -d
```

### 2. Verify Container is Running

```bash
# Check running containers
docker-compose ps

# Check logs
docker-compose logs postgres

# Check database health
docker-compose exec postgres pg_isready -U library_user -d library_db
```

### 3. Update Environment Variables

Copy the Docker environment configuration:

```bash
cp .env.docker .env
```

Or manually update your `.env` file with:
```env
DATABASE_URL=postgresql://library_user:library_password@localhost:5432/library_db
```

### 4. Run Migrations

```bash
# Apply database migrations
pnpm prisma migrate deploy

# Or reset and seed (development only)
pnpm prisma migrate reset
```

### 5. Seed Database

```bash
pnpm prisma db seed
```

## Container Management

### Start Containers
```bash
docker-compose up -d
```

### Stop Containers
```bash
docker-compose down
```

### Stop and Remove Data (CAUTION: Deletes all database data!)
```bash
docker-compose down -v
```

### Restart Containers
```bash
docker-compose restart
```

### View Logs
```bash
# All services
docker-compose logs -f

# PostgreSQL only
docker-compose logs -f postgres
```

## Database Access

### 1. Using psql in Docker Container

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U library_user -d library_db

# Execute single command
docker-compose exec postgres psql -U library_user -d library_db -c "SELECT COUNT(*) FROM \"user\";"
```

### 2. Using psql from Host Machine

```bash
psql -h localhost -p 5432 -U library_user -d library_db
# Password: library_password
```

### 3. Using pgAdmin (Web GUI)

If you started with `--profile tools`:

1. Open browser: http://localhost:5050
2. Login:
   - Email: `admin@library.com`
   - Password: `admin123`
3. Add server:
   - Host: `postgres` (or `host.docker.internal` from host)
   - Port: `5432`
   - Username: `library_user`
   - Password: `library_password`
   - Database: `library_db`

### 4. Using Prisma Studio

```bash
pnpm prisma studio
```

Opens at: http://localhost:5555

## Backup & Restore

### Create Backup

```bash
# Backup to file
docker-compose exec postgres pg_dump -U library_user library_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Or using docker cp
docker-compose exec postgres pg_dump -U library_user library_db -f /tmp/backup.sql
docker cp library-postgres:/tmp/backup.sql ./backup.sql
```

### Restore Backup

```bash
# From host
cat backup.sql | docker-compose exec -T postgres psql -U library_user -d library_db

# Or copy to container first
docker cp backup.sql library-postgres:/tmp/backup.sql
docker-compose exec postgres psql -U library_user -d library_db -f /tmp/backup.sql
```

## Database Credentials

**PostgreSQL:**
- Host: `localhost` (or `postgres` from other containers)
- Port: `5432`
- Database: `library_db`
- User: `library_user`
- Password: `library_password`

**pgAdmin (optional):**
- URL: http://localhost:5050
- Email: `admin@library.com`
- Password: `admin123`

## Troubleshooting

### Port Already in Use

If port 5432 is already in use by local PostgreSQL:

**Option 1:** Stop local PostgreSQL
```bash
# macOS (Homebrew)
brew services stop postgresql@14

# Linux
sudo systemctl stop postgresql
```

**Option 2:** Change Docker port in `docker-compose.yml`
```yaml
ports:
  - '5433:5432'  # Use port 5433 on host
```

Then update `DATABASE_URL` in `.env`:
```env
DATABASE_URL=postgresql://library_user:library_password@localhost:5433/library_db
```

### Container Won't Start

```bash
# Check logs
docker-compose logs postgres

# Remove containers and volumes, start fresh
docker-compose down -v
docker-compose up -d
```

### Connection Refused

```bash
# Wait for database to be ready
docker-compose exec postgres pg_isready -U library_user -d library_db

# Check if container is running
docker-compose ps

# Check network connectivity
docker-compose exec postgres nc -zv localhost 5432
```

### Reset Everything

```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Start fresh
docker-compose up -d

# Re-run migrations and seed
pnpm prisma migrate deploy
pnpm prisma db seed
```

## Development Workflow

1. Start Docker containers: `docker-compose up -d`
2. Run backend: `pnpm run start:dev`
3. Make changes, migrations auto-apply in dev mode
4. Stop containers when done: `docker-compose down`

## Production Notes

For production deployment:
- Change default passwords
- Use environment variables for secrets
- Set up proper backup strategy
- Consider managed database services (AWS RDS, Google Cloud SQL, etc.)
- Enable SSL connections
- Implement connection pooling (PgBouncer)
