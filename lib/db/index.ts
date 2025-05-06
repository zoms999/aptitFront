import { PrismaClient } from '@prisma/client';

// PrismaClient의 단일 인스턴스 생성
// 환경에 따라 로그 레벨 조정
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma; 