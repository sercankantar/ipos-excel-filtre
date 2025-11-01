import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { username: 'admin' },
    })

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('admin', 10)
      
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          role: 'admin',
        },
      })
      
      console.log('✅ Admin user created successfully')
      console.log('Username: admin')
      console.log('Password: admin')
    } else {
      console.log('⚠️  Admin user already exists')
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

