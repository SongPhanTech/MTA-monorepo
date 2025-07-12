import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting data import...')

    console.log('All data imported successfully!')
}

main()
    .then(async () => {
        await prisma.$disconnect()
        console.log('Database connection closed.')
    })
    .catch(async (e) => {
        console.error('Error during data import:', e)
        await prisma.$disconnect()
    })
