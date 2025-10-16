# Library Management System - Backend

A comprehensive NestJS backend for the Library Management System, providing RESTful APIs for book catalog management, member management, and loan operations.

## 🚀 Tech Stack

- **Framework:** NestJS 11.x
- **Language:** TypeScript 5.x
- **Runtime:** Node.js 20.x LTS
- **Package Manager:** pnpm
- **Database:** PostgreSQL 15.x (with Prisma ORM)
- **Authentication:** Better Auth (session-based)
- **Email:** Nodemailer + Mailtrap
- **Testing:** Jest + Supertest
- **Validation:** class-validator + class-transformer

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js:** v20.x LTS or higher ([Download](https://nodejs.org/))
- **pnpm:** v9.x or higher ([Install](https://pnpm.io/installation))
- **Docker & Docker Compose:** (Recommended) OR **PostgreSQL:** v15.x ([Download](https://www.postgresql.org/download/))

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fullstack-library-management/backend
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Update the `.env` file with your actual configuration:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/library_db

# Frontend
FRONTEND_URL=http://localhost:5173

# Sentry (Error Tracking)
SENTRY_DSN=

# SMTP Configuration (Email)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_password
SMTP_FROM_EMAIL=admin-library@mail.com
```

### 4. Database Setup

**Option A: Using Docker (Recommended)**

Run the automated setup script:

```bash
# Make sure Docker is running first!
./setup-docker-db.sh
```

This script will:
- ✅ Start PostgreSQL in a Docker container
- ✅ Update your `.env` file
- ✅ Run database migrations
- ✅ Seed the database with sample data

Or manually:

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Update .env file
cp .env.docker .env

# Run migrations
pnpm prisma migrate deploy

# Seed database
pnpm prisma db seed
```

**Option B: Using Local PostgreSQL**

Create the database:

```bash
createdb library_db
```

Or using PostgreSQL CLI:

```sql
CREATE DATABASE library_db;
```

## 🏃 Running the Application

### Development Mode

```bash
pnpm run dev
```

The server will start at `http://localhost:3000` with hot-reload enabled.

### Production Build

```bash
# Build the application
pnpm run build

# Start the production server
pnpm run start
```

### Debug Mode

```bash
pnpm run start:debug
```

## 🧪 Testing

### Run Unit Tests

```bash
pnpm run test
```

### Run Tests in Watch Mode

```bash
pnpm run test:watch
```

### Run Tests with Coverage

```bash
pnpm run test:cov
```

### Run End-to-End Tests

```bash
pnpm run test:e2e
```

## 🔍 Code Quality

### Linting

```bash
# Check for linting errors
pnpm run lint

# Fix linting errors automatically
pnpm run lint:fix
```

### Formatting

```bash
# Format code
pnpm run format

# Check code formatting
pnpm run format:check
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── app.controller.ts       # Root controller
│   ├── app.service.ts          # Root service
│   └── ...
├── test/                       # E2E tests
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore file
├── eslint.config.mjs           # ESLint configuration
├── nest-cli.json               # NestJS CLI configuration
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

## 📚 Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm run dev` | Start development server with hot-reload |
| `pnpm run build` | Build the application for production |
| `pnpm run start` | Start the production server |
| `pnpm run lint` | Run ESLint to check code quality |
| `pnpm run lint:fix` | Fix ESLint errors automatically |
| `pnpm run format` | Format code with Prettier |
| `pnpm run format:check` | Check code formatting |
| `pnpm run test` | Run unit tests |
| `pnpm run test:watch` | Run tests in watch mode |
| `pnpm run test:cov` | Run tests with coverage report |
| `pnpm run test:e2e` | Run end-to-end tests |

## 🔐 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `development` |
| `PORT` | Server port | Yes | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `FRONTEND_URL` | Frontend application URL (for CORS) | Yes | `http://localhost:5173` |
| `SENTRY_DSN` | Sentry error tracking DSN | No | - |
| `SMTP_HOST` | SMTP server host | Yes | `smtp.mailtrap.io` |
| `SMTP_PORT` | SMTP server port | Yes | `2525` |
| `SMTP_USER` | SMTP username | Yes | - |
| `SMTP_PASS` | SMTP password | Yes | - |
| `SMTP_FROM_EMAIL` | Email sender address | Yes | `admin-library@mail.com` |

## 🌐 API Documentation

Once the server is running, you can access the API documentation at:

- **Swagger UI:** `http://localhost:3000/api/docs`

## 🐛 Troubleshooting

### Port Already in Use

If port 3000 is already in use, change the `PORT` variable in your `.env` file.

### Database Connection Error

Ensure PostgreSQL is running and the `DATABASE_URL` in your `.env` file is correct.

```bash
# Check PostgreSQL status
pg_ctl status

# Start PostgreSQL (if not running)
pg_ctl start
```

### Module Not Found Errors

Clear the cache and reinstall dependencies:

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📝 Development Guidelines

### TypeScript Strict Mode

This project uses TypeScript strict mode. Ensure your code adheres to all strict type checks.

### Code Style

- Follow the ESLint and Prettier configurations
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Write unit tests for business logic

### Git Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run linting and tests
4. Commit with clear messages
5. Create a pull request

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the UNLICENSED License.

## 📞 Support

For support, please contact the development team or create an issue in the repository.

---

**Happy Coding! 🚀**
