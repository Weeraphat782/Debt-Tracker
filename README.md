# 📋 Thai Debt Tracker | แอพจดหนี้ไทย

> **A modern Thai debt tracking application built with Next.js and Supabase**  
> **แอพพลิเคชันจดหนี้สมัยใหม่สำหรับคนไทย สร้างด้วย Next.js และ Supabase**

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🌟 Features | คุณสมบัติ

### 💰 **Thai-Focused Debt Management | จัดการหนี้แบบไทยๆ**
- **Fixed Interest System** | ระบบดอกเบี้ยคงที่ (เช่น 250 บาท/เดือน)
- **Interest-Only Payments** | จ่ายเฉพาะดอกเบี้ย พร้อมกำหนดวันใหม่
- **No Compound Interest** | ไม่มีดอกเบี้ยทบต้น - ระบบบวกเพิ่มแบบง่าย
- **Thai Currency Format** | แสดงผลเป็นสกุลเงินไทย (฿)

### 📱 **Modern User Experience | ประสบการณ์ผู้ใช้สมัยใหม่**
- **Responsive Design** | รองรับมือถือ แท็บเล็ต และคอมพิวเตอร์
- **Real-time Updates** | อัปเดตข้อมูลแบบเรียลไทม์
- **Loading States** | แสดงสถานะการโหลดที่สวยงาม
- **Error Handling** | จัดการข้อผิดพลาดอย่างชาญฉลาด

### 📊 **Comprehensive Tracking | ติดตามครบครัน**
- **Payment History** | ประวัติการจ่ายเงินแบบละเอียด
- **Summary Cards** | การ์ดสรุปยอดรวมที่เข้าใจง่าย
- **Filter Options** | ตัวกรองหนี้หลากหลายแบบ
- **Hide/Show Paid Debts** | ซ่อน/แสดงหนี้ที่จ่ายครบแล้ว

---

## 🚀 Live Demo | ทดลองใช้

**🌐 [Try it now | ทดลองใช้เลย →](http://localhost:3003)**

---

## 🛠️ Tech Stack | เทคโนโลยี

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React Framework | 15.2.4 |
| **React** | UI Library | 19.0 |
| **TypeScript** | Type Safety | 5.0+ |
| **Supabase** | Database & Auth | Latest |
| **Tailwind CSS** | Styling | 3.4+ |
| **shadcn/ui** | UI Components | Latest |
| **Lucide React** | Icons | Latest |

---

## 📦 Installation | การติดตั้ง

### Prerequisites | ข้อกำหนดเบื้องต้น
- Node.js 18+ 
- npm หรือ pnpm
- Supabase Account

### 1. Clone Repository | โคลนโปรเจค
```bash
git clone https://github.com/Weeraphat782/Debt-Tracker.git
cd Debt-Tracker
```

### 2. Install Dependencies | ติดตั้ง Dependencies
```bash
npm install
# หรือ
pnpm install
```

### 3. Setup Supabase | ตั้งค่า Supabase
1. สร้าง Project ใหม่ใน [Supabase](https://supabase.com/)
2. รัน SQL Schema ใน `database/schema.sql`
3. สร้างไฟล์ `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server | รันเซิร์ฟเวอร์
```bash
npm run dev
# หรือ
pnpm dev
```

🎉 **เปิด [http://localhost:3000](http://localhost:3000) เพื่อดูผลลัพธ์!**

---

## 💡 Usage Examples | ตัวอย่างการใช้งาน

### 📝 **Adding a New Debt | เพิ่มหนี้ใหม่**
```
👤 ชื่อผู้ยืม: สมชาย ใจดี
💰 เงินต้น: 10,000 บาท
📈 ดอกเบี้ย: 500 บาท/เดือน
📅 วันครบกำหนด: 2024-02-15
```

### 💳 **Interest-Only Payment | จ่ายเฉพาะดอกเบี้ย**
```
เงินต้น: 0 บาท (ไม่จ่าย)
ดอกเบี้ย: 500 บาท ✅
วันครบกำหนดใหม่: 2024-03-15 (บังคับกรอก)

➡️ ผลลัพธ์: เงินต้น 10,000 บาทยังค้างอยู่
➡️ ดอกเบี้ยรอบถัดไป: 1,000 บาท (500 + 500)
```

### 📊 **Payment Tracking | ติดตามการจ่าย**
- ✅ ยอดรวมเงินต้นที่ถูกยืม: 50,000 บาท
- ✅ เงินต้นที่คืนแล้ว: 30,000 บาท  
- ✅ ยอดรวมดอกที่ได้คืน: 5,500 บาท

---

## 🏗️ Project Structure | โครงสร้างโปรเจค

```
Debt-Tracker/
├── 📁 app/                  # Next.js App Router
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page
├── 📁 components/          # UI Components
│   └── ui/                 # shadcn/ui components
├── 📁 lib/                 # Utilities
│   ├── database.ts         # Database service
│   ├── supabase.ts         # Supabase client
│   └── utils.ts            # Helper functions
├── 📁 database/            # Database files
│   └── schema.sql          # PostgreSQL schema
├── 📁 public/              # Static assets
├── SUPABASE_SETUP.md       # Setup guide
└── README.md               # This file
```

---

## 🔧 Configuration | การตั้งค่า

### Environment Variables | ตัวแปรสภาพแวดล้อม
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Database Schema | โครงสร้างฐานข้อมูล
- **debts** table: เก็บข้อมูลหนี้หลัก
- **payments** table: เก็บประวัติการจ่ายเงิน
- **Row Level Security**: เปิดใช้งานเพื่อความปลอดภัย

---

## 🤝 Contributing | การมีส่วนร่วม

เรายินดีรับการมีส่วนร่วมจากทุกคน! 

### How to Contribute | วิธีการมีส่วนร่วม
1. Fork โปรเจค
2. สร้าง Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit การเปลี่ยนแปลง (`git commit -m 'Add amazing feature'`)
4. Push ไปยัง Branch (`git push origin feature/amazing-feature`)
5. เปิด Pull Request

---

## 📄 License | ลิขสิทธิ์

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments | กิตติกรรมประกาศ

- **[Next.js](https://nextjs.org/)** - The React Framework for Production
- **[Supabase](https://supabase.com/)** - The Open Source Firebase Alternative  
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful UI Components
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-First CSS Framework
- **[Lucide Icons](https://lucide.dev/)** - Beautiful & Consistent Icons

---

## 📞 Support | การสนับสนุน

หากคุณมีปัญหาหรือข้อสงสัย:

- 🐛 [Report Bug | รายงานบั๊ก](https://github.com/Weeraphat782/Debt-Tracker/issues)
- 💡 [Request Feature | ขอฟีเจอร์ใหม่](https://github.com/Weeraphat782/Debt-Tracker/issues)
- 💬 [Discussions | พูดคุย](https://github.com/Weeraphat782/Debt-Tracker/discussions)

---

<div align="center">

**Made with ❤️ for Thai Debt Management**  
**สร้างด้วยความรักเพื่อการจัดการหนี้ของคนไทย**

⭐ **ถ้าชอบโปรเจคนี้ กดดาวให้หน่อยนะครับ!**

</div> 