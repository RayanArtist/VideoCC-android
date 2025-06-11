import { Pool, neonConfig } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seedData() {
  try {
    // Create sample users
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    const users = [
      {
        username: 'علی_احمدی',
        password: hashedPassword,
        email: 'ali@example.com',
        age: 25,
        location: 'تهران',
        bio: 'عاشق کوهنوردی و طبیعت هستم. دوست دارم با افراد جدید آشنا شوم.',
        isOnline: true
      },
      {
        username: 'مریم_رضایی',
        password: hashedPassword,
        email: 'maryam@example.com',
        age: 28,
        location: 'اصفهان',
        bio: 'طراح گرافیک و عاشق هنر. به دنبال دوستان هم‌فکر هستم.',
        isOnline: false
      },
      {
        username: 'حسین_محمدی',
        password: hashedPassword,
        email: 'hossein@example.com',
        age: 32,
        location: 'شیراز',
        bio: 'مهندس نرم‌افزار و علاقه‌مند به تکنولوژی. دوست دارم تجربیاتم را به اشتراک بگذارم.',
        isOnline: true
      },
      {
        username: 'فاطمه_کریمی',
        password: hashedPassword,
        email: 'fateme@example.com',
        age: 24,
        location: 'مشهد',
        bio: 'دانشجوی پزشکی و علاقه‌مند به مطالعه. به دنبال دوستان علمی هستم.',
        isOnline: false
      },
      {
        username: 'رضا_نوری',
        password: hashedPassword,
        email: 'reza@example.com',
        age: 30,
        location: 'تبریز',
        bio: 'عکاس حرفه‌ای و مسافر. دوست دارم از سفرهایم بگویم.',
        isOnline: true
      }
    ];

    for (const user of users) {
      await pool.query(
        `INSERT INTO users (username, password, email, age, location, bio, is_online, last_seen, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (username) DO NOTHING`,
        [user.username, user.password, user.email, user.age, user.location, user.bio, user.isOnline]
      );
    }

    console.log('Sample data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await pool.end();
  }
}

seedData();