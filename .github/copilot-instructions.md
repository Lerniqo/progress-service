# Copilot Instructions for This Project

## Project Overview
This project is a NestJS backend service using MongoDB as the database.  
MongoDB is run in Docker via `docker-compose`.  
We use `pnpm` as the dependency manager.

## Technology Stack
- **Framework:** NestJS (TypeScript)
- **Database:** MongoDB (via Mongoose ODM)
- **Package Manager:** pnpm
- **Containerization:** Docker Compose
- **Testing:** Jest (default NestJS testing setup)
- **Runtime Environment:** Node.js

## Development & Run Commands
- Install dependencies: `pnpm install`
- Run in development mode: `pnpm run start:dev &`
- Run tests: `pnpm test`
- Build: `pnpm run build`

2. **Best Practices**
- Always use **DTOs** for request validation using `class-validator` and `class-transformer`.
- Use **Mongoose schemas** in `schemas/` folder per module.
- Apply **service-repository pattern**: controllers → services → database access layer.
- Use `async/await` with `try/catch` for all database calls.
- Do not hardcode secrets; use `@nestjs/config` with `.env` files.
- Use **Dependency Injection** for all services, repositories, and external APIs.
- Keep functions short and single-purpose.
- Use descriptive variable names.

3. **Testing**
- Write unit tests for services and e2e tests for controllers.
- Keep tests in `__tests__` folder or alongside code with `.spec.ts`.

## Copilot Agent Instructions
When generating code:
- Follow the **folder structure** above.
- Always create necessary DTOs and validation pipes.
- Use **NestJS module system** (`imports`, `providers`, `exports`) for reusability.
- For MongoDB access, use `@nestjs/mongoose` and define schemas in a dedicated `schemas/` folder.
- Implement **error handling** in controllers via `HttpExceptionFilter`.
- Use async/await with proper error logging in services.
- Use `.env` configuration for DB connection strings.
- When creating new modules, always:
- Create `<module>.module.ts`
- Create a controller in `controllers/`
- Create a service in `services/`
- Create DTOs in `dto/`
- Create Mongoose schema in `schemas/`
- If code is for testing, run it using:  
```bash
pnpm run start:dev &
```