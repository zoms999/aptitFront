# Configuration for Cursor IDE for a Next.js project with Prisma

# Project Context
- Language: TypeScript
- Framework: Next.js (API routes)
- Database: Prisma Client (imported as db from '../../../lib/db/prisma')
- Environment: Supports development and production modes

# Code Style
- Use single quotes for strings
- Prefer arrow functions for API handlers
- Use explicit TypeScript types
- Follow camelCase for variables and functions
- Omit semicolons unless required

# Prisma Rules
- Import db from '../../../lib/db/prisma' for database operations
- Use async/await for Prisma queries (e.g., await db.user.findMany())
- Suggest type-safe Prisma methods (e.g., db.user.create, db.post.findUnique)
- Avoid raw SQL queries unless requested
- Ensure single PrismaClient instance (via db import)

# Next.js Rules
- Import NextRequest, NextResponse from 'next/server' for API routes
- Use async handlers with NextRequest and return NextResponse
- Suggest proper HTTP methods (e.g., GET, POST) in API routes
- Handle errors with NextResponse.json({ error }, { status })

# TypeScript Rules
- Enforce strict types for Prisma models and API inputs
- Suggest type annotations for request/response data
- Allow type assertions only for necessary global or Prisma setups