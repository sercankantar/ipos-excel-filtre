import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function authenticateUser(username: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user) {
      return null
    }

    // bcrypt ile şifre kontrolü
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return null
    }

    // Şifreyi döndürmeden kullanıcı bilgilerini döndür
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
}

export async function createAdminUser() {
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
      
      console.log('Admin user created successfully')
    }
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

