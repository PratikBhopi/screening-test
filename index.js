require('dotenv').config();

// Ensure BigInt serializes properly in JSON responses
BigInt.prototype.toJSON = function () {
    return this.toString();
};

const app = require('./src/app');
const prisma = require('./src/models/index');
const bcrypt = require('bcrypt');

async function seedAdmin() {
    try {
        const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (!adminExists) {
            const passwordHash = await bcrypt.hash('Admin@123', 10);
            await prisma.user.create({
                data: {
                    username: 'superuser',
                    email: 'admin@fintrack.com',
                    passwordHash: passwordHash,
                    role: 'ADMIN'
                }
            });
            console.log("✅ Seed: Initial Admin created [admin@fintrack.com / Admin@123]");
        }
    } catch (e) {
        console.error("Seed error:", e.message);
    }
}

const PORT = process.env.PORT || 8000;
app.listen(PORT, async () => {
    await seedAdmin();
    console.log(`Server Running on port ${PORT}.`);
});