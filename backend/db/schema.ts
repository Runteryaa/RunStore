import bcrypt from 'bcryptjs';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export type AppStatus = 'pending' | 'approved' | 'rejected';

export interface App {
  id: string;
  name: string;
  packageName: string;
  description: string;
  version: string;
  iconUrl: string;
  apkUrl: string;
  fileSize: number;
  status: AppStatus;
  uploaderId: string;
  uploaderName: string;
  rejectionReason?: string;
  downloads: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryDB {
  users: Map<string, User>;
  apps: Map<string, App>;
}

export const db: InMemoryDB = {
  users: new Map(),
  apps: new Map(),
};

async function initializeAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser: User = {
    id: 'admin-1',
    email: 'admin@runstore.com',
    password: hashedPassword,
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date(),
  };
  
  db.users.set(adminUser.id, adminUser);
}

initializeAdmin().catch(console.error);
