import { PrismaClient } from '@prisma/client';

// PrismaClient 인스턴스화 및 전역 변수 선언
declare global {
  var db: PrismaClient | undefined;
}

// 개발 환경에서 핫 리로드를 위한, 전역 변수를 사용
export const db = global.db || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.db = db;
}

export default db; 