# Demo Shop - Angular / NestJS

This repository contains an Angular frontend and NestJS API for the Demo Shop platform, a full-stack e-commerce reference implementation built with modern web technologies.

## Platform

The Demo Shop platform is split across interchangeable implementations:

**Angular + NestJS** · [.NET API](https://github.com/christian-wandling/demo-shop-dotnet-api) · [React UI](https://github.com/christian-wandling/demo-shop-react-ui) · [E2E](https://github.com/christian-wandling/demo-shop-e2e)

## Documentation

### Backend

- <a href="https://christian-wandling.github.io/demo-shop-angular-nestjs/compodoc/backend" target="_blank">API Documentation</a> - Complete API reference and backend architecture

### Frontend

- <a href="https://christian-wandling.github.io/demo-shop-angular-nestjs/compodoc/frontend" target="_blank">Frontend Documentation</a> - Component structure and frontend architecture
- <a href="https://67e3398bb6689fcab1248c6a-ktupstjvwo.chromatic.com" target="_blank">Storybook</a> - Interactive UI component library and visual testing
- <a href="https://67fdf0c9a95dbf7d8993b651-caleyrhptc.chromatic.com/" target="_blank">Playwright</a> - Interactive E2E test results
- <a href="https://christian-wandling.github.io/demo-shop-angular-nestjs/graph/frontend/#/projects/frontend">Dependency Graph</a> - Dependency graph of the frontend apps and libs

#### Libraries

- [Authentication](https://github.com/christian-wandling/demo-shop-angular-nestjs/tree/main/libs/auth/README.md) - User authentication and authorization flows
- [User](https://github.com/christian-wandling/demo-shop-angular-nestjs/tree/main/libs/user/README.md) - User management
- [Products](https://github.com/christian-wandling/demo-shop-angular-nestjs/tree/main/libs/product/README.md) - Product catalog, categories, and search functionality
- [Shopping](https://github.com/christian-wandling/demo-shop-angular-nestjs/tree/main/libs/cart/README.md) - Shopping cart implementation and session management
- [Order](https://github.com/christian-wandling/demo-shop-angular-nestjs/tree/main/libs/order/README.md) - Order processing, history, and management
- [Monitoring](https://github.com/christian-wandling/demo-shop-angular-nestjs/tree/main/libs/monitoring/README.md) - Application performance monitoring and logging
- [Navigation](https://github.com/christian-wandling/demo-shop-angular-nestjs/tree/main/libs/navigation/README.md) - Site navigation components and routing
- [Shared](https://github.com/christian-wandling/demo-shop-angular-nestjs/tree/main/libs/shared/README.md) - Common utilities and shared components
- [OpenApiGenerator](https://github.com/christian-wandling/demo-shop-angular-nestjs/tree/main/libs/api/README.md) - API client generation tools and configurations

## Tech Stack

### Frontend

- **Angular** - Progressive web framework
- **TypeScript** - Type-safe JavaScript
- **NgRx** - State Management
- **HTML2Canvas/jsPDF** - PDF generation
- **Tailwind CSS** - Styling

### Backend

- **NestJS** - Progressive Node.js framework
- **OpenAPI/Swagger** - API documentation
- **Prisma** - Modern ORM for database access
- **PostgreSQL** - Relational database

### Auth

- **Keycloak** - Secure Authentication

### Testing & Documentation

- **Jest** - Unit testing
- **Storybook** - UI component documentation & testing
- **Compodoc** - Automated documentation generation
- **Playwright** - E2E testing

### Monitoring & Code Quality

- **Sentry** - Error monitoring
- **SonarCloud** - Static analysis & quality gate

### Dev workflow

- **Commitlint/Commitizen** - Standardize commit messages
- **Husky** - Pre-commit hooks
- **ESLint/Lint-staged** - Automated linting
- **Prettier** - Automated code formatting

### DevOps & Infrastructure

- **Nx** - Mono-repo build system
- **Docker** - Containerization
- **Terraform** - Infrastructure as Code
- **GitHub CI/CD** - Continuous Integration/Continuous Deployment
- **AWS** - Cloud hosting platform

## Setup

### Prerequisites

- <a href="https://nodejs.org/en" target="_blank">Node.js 20</a> or later
- <a href="https://www.npmjs.com/" target="_blank">npm</a> or <a href="https://yarnpkg.com/" target="_blank">yarn</a>
- <a href="https://www.docker.com/" target="_blank">Docker</a>

### Installation

1. Clone the repository

```
git clone https://github.com/christian-wandling/demo-shop-angular-nestjs.git
```

2. Install dependencies

```
npm install
```

3. Set up environment variables

```
# Edit .env file with your configuration
cp .env.example .env
```

- You can choose to omit configuring sentry or see the section on setting up [sentry](#sentry-setup)
- `KEYCLOAK_REALM_PUBLIC_KEY` is filled in at step 7, once keycloak has generated it. Leave the placeholder for now.
- `API_PORT`, `FRONTEND_PORT`, `KEYCLOAK_PORT`, `DB_PORT` and `PGADMIN_PORT` set the host ports. Change one if another project already uses it. Changing `KEYCLOAK_PORT` also requires updating the keycloak url in `apps/frontend/src/environments/environment.ts`.

4. Create shared docker network (or remove network from compose file)

```
docker network create shared
```

5. Build & run the docker containers

```
# this will build and run docker containers for frontend, api, postgres, keycloak, pgadmin
npm start
```

6. Generate prisma client and push the schema to the database

```
npm run prisma:generate
npm run prisma:push
```

7. Give the api keycloak's public key

Access the keycloak server, click on the Public Key of RS256, and use its value in your `.env` file as `KEYCLOAK_REALM_PUBLIC_KEY`.

```
http://localhost:8080/admin/master/console/#/demo_shop/realm-settings/keys
```

Then restart the api.

```
docker compose restart api
```

8. Access the application

```
Frontend: http://localhost:4200
API: http://localhost:3000
Swagger Documentation: http://localhost:4200/api/docs
Keycloak: http://localhost:8080
PgAdmin: http://localhost:80
```

### Usage

1. Open the web app

```
http://localhost:4200
```

### Sentry Setup

1. Go to <a href="https://sentry.io/welcome/">sentry.io</a> to create an account and follow the steps to setup projects for frontend and api

2. Add configuration values to your .env file

3. Run the sentry wizard to complete the setup

```
npx @sentry/wizard@latest -i sourcemaps --saas
```

### Dotnet API Integration

An equivalent API created with ASP.NET Core is available in the following repository:

> <a href="https://github.com/christian-wandling/demo-shop-dotnet-api" target="_blank">github.com/christian-wandling/demo-shop-dotnet-api</a>

To use the API with this frontend, ensure both applications are running and connected via the shared Docker network.

### React UI Integration

An equivalent frontend built with React is available in the following repository:

> <a href="https://github.com/christian-wandling/demo-shop-react-ui" target="_blank">github.com/christian-wandling/demo-shop-react-ui</a>

To use the React frontend with this API, ensure both applications are running and connected via the shared Docker network.


## User management

### User registration via web app

1. Open the web app

```
http://localhost:4200
```

2. Click `Register` and create the user

### User creation via Keycloak admin console

1. Access the Keycloak server to add a user

```
http://localhost:8080/admin/master/console/#/demo_shop/users/add-user
```

2. To login use `KEYCLOAK_ADMIN` and `KEYCLOAK_ADMIN_PASSWORD` defined in your [.env](.env.example) file.

3. Fill `Email`, `First Name` and `Last name`

4. Navigate to the `Credentials` tab and use `Set Password` to create as password

5. Fill `Password` and `Password Confirmation` and deselect `Temporary`

## Database

### Seeding

```
npm run prisma:seed
```

The [seed](prisma/seed.ts) script will attempt to add entities to the database:

- products, if the product table is empty
- users, if any user in the keycloak has not been added to the user table
- orders, for any user that has no orders attached

2. Browse products

3. Sign in to access the shopping and order features

### Access with Prisma Studio

Open prisma studio via console

```
prisma studio
```

### Access with PgAdmin

1. Open PgAdmin in your browser

```
http://localhost:80
```

2. Enter the password you set for `PGADMIN_DEFAULT_PASSWORD` in your .env file

3. Register new server. You can give it any name.

4. In the connection tab of the server use `db` for host and for username and password use the values of `POSTGRES_USER` and `POSTGRES_PASSWORD` in your .env file

## Testing

To run all tests in this project use

```
npm run test
```

To test an app or lib use

```
nx test <name>
```

## Deployment

This repository includes a CI/CD pipeline for deploying a full-stack application to AWS with Cloudflare for DNS management and CDN services.

### Continuous Integration

- PR Workflow: When a PR is created to main, a test build is created with unit tests, linting, SonarQube, and GitHub code checks
- Main Branch CI: On merge to main, test builds and checks run again
- Versioning: Successful main branch builds trigger the version workflow, which:
  - Updates the version number using semantic versioning determined from commit messages
  - Generates a changelog from commit messages
  - Creates a new tag

### Continuous Deployment

- Trigger: New tag creation automatically triggers the CD workflow
- Build Phase: Docker images are built for both frontend and API components
- Infrastructure Deployment:
  - Network infrastructure is provisioned using Terraform
  - EC2 instance with custom GitHub runner is deployed
- Service Deployment via custom GitHub runner:
  - RDS database
  - EC2 instance for API
  - EC2 instance for frontend
  - EC2 instance for Keycloak
  - S3 bucket for assets
- Monitoring: Sourcemaps are uploaded to Sentry for error tracking

- External Services
  - Cloudflare: Manages DNS, SSL/TLS, and CDN services

### Prerequisites

- GitHub Setup

  - GitHub repository access with proper permissions
  - GitHub Actions secrets configured for AWS, Cloudflare, and Sentry credentials
  - Branch protection rules for main branch

- AWS Requirements:

  - AWS account with programmatic access
  - IAM user with appropriate permissions for EC2, S3, RDS, VPC, etc.
  - AWS credentials stored securely in GitHub Secrets
  - Postgres and Keycloak credentials stored securely in AWS

- Cloudflare Requirements:

  - Cloudflare account
  - Domain added to Cloudflare
  - API token with appropriate permissions
  - Cloudflare API token stored in GitHub Secrets

- Sentry Requirements:

  - Sentry account and project
  - Auth token for sourcemap uploads
  - Sentry credentials stored in GitHub Secrets

- SonarQube Requirements:
  - SonarQube server or SonarCloud account
  - Project setup in SonarQube/SonarCloud
  - SonarQube credentials stored in GitHub Secrets
  - sonar-project.properties file in repository root

### Diagram

```mermaid
flowchart TB
    subgraph "PR"
        A[PR Created] --> B[Test build, Unit Tests, Linting, Quality Gate]
        B --> |On Success| C[Merge to Main]
    end

    subgraph "CI"
        C[Merge to Main] --> D[Test Build, Unit Tests, Linting]
        D --> |On Success| E[Trigger version]

    end

    subgraph "Version Tag"
        E[CI Success] --> F[Update Version & Changelog]
        F --> G[Create Tag]
    end

    subgraph "CD"
        G[Tag vX.X.X] --> H[Build Docker Images]
        H --> I[Deploy AWS Infrastructure]
        I --> I1[Network]
        I --> I2[EC2 with Custom Github Runner]
        I --> J[Deploy Services]
        J --> J1[RDS Database]
        J --> J2[EC2 for API]
        J --> J3[EC2 for Frontend]
        J --> J4[EC2 for Keycloak]
        J --> J5[S3 Bucket]
        I --> K[Configure Cloudflare]
        K --> K1[Cloudflare DNS]
        K --> K2[Cloudflare SSL/TLS]
        K --> K3[Cloudflare CDN]
        K --> K4[Cloudflare Security Headers]
        I --> M[Upload sourcemaps to Sentry]
    end
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
