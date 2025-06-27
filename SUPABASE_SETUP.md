# 🗄️ Supabase Database Setup Guide

## ขั้นตอนการติดตั้ง Supabase สำหรับแอพจดหนี้

### 1. สร้าง Supabase Project

1. ไปที่ [https://supabase.com/](https://supabase.com/)
2. สร้างบัญชีใหม่หรือเข้าสู่ระบบ
3. คลิก "New Project"
4. เลือก Organization หรือสร้างใหม่
5. ตั้งชื่อ Project: `debt-tracker`
6. ตั้งรหัสผ่าน Database (จำให้ดี!)
7. เลือก Region ที่ใกล้ที่สุด (เช่น Singapore)
8. คลิก "Create new project"

### 2. ตั้งค่า Database Schema

1. ไปที่ SQL Editor ในแดชบอร์ด Supabase
2. Copy โค้ด SQL จากไฟล์ `database/schema.sql`
3. Paste และรัน SQL โค้ด
4. ตรวจสอบว่าตาราง `debts` และ `payments` ถูกสร้างแล้ว

### 3. ตั้งค่า Environment Variables

1. ไปที่ Settings > API ในแดชบอร์ด Supabase
2. Copy ค่าเหล่านี้:
   - `Project URL`
   - `anon public` key

3. สร้างไฟล์ `.env.local` ในโฟลเดอร์ root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. ทดสอบการเชื่อมต่อ

1. รีสตาร์ท Next.js development server:
```bash
npm run dev
```

2. เปิดเบราว์เซอร์ไปที่ `http://localhost:3002`
3. ลองเพิ่มหนี้ใหม่เพื่อทดสอบ
4. ตรวจสอบข้อมูลในแดชบอร์ด Supabase > Table Editor

### 5. ฟีเจอร์ที่ได้

✅ **Database แบบ Real-time**
- ข้อมูลจะถูกเก็บใน PostgreSQL
- สามารถเข้าถึงจากหลายอุปกรณ์

✅ **Backup อัตโนมัติ**
- Supabase จะสำรองข้อมูลให้อัตโนมัติ
- ไม่ต้องกังวลเรื่องข้อมูลหาย

✅ **Scalable**
- รองรับผู้ใช้หลายคนพร้อมกัน
- เพิ่มผู้ใช้ได้ไม่จำกัด

✅ **Security**
- Row Level Security (RLS)
- API Key authentication

### 6. การ Migrate ข้อมูลจาก localStorage

หากคุณมีข้อมูลเก่าใน localStorage:

1. เปิด Developer Tools (F12)
2. ไปที่ Console
3. รันคำสั่ง:
```javascript
// Export ข้อมูลเก่า
const oldData = localStorage.getItem('debts')
console.log('Old data:', oldData)
```

4. Copy ข้อมูลและติดต่อเพื่อช่วย migrate

### 7. การแก้ไขปัญหา

**ปัญหา: Connection Error**
- ตรวจสอบ URL และ API Key ใน `.env.local`
- ตรวจสอบว่ารีสตาร์ท server แล้ว

**ปัญหา: Permission Denied**
- ตรวจสอบ RLS policies ใน Supabase
- ตรวจสอบ Authentication settings

**ปัญหา: Table not found**
- ตรวจสอบว่ารัน SQL schema แล้ว
- ตรวจสอบชื่อตารางใน Database

### 8. ขั้นตอนถัดไป

เมื่อ Database พร้อมแล้ว เราจะ:

1. ✅ แทนที่ localStorage ด้วย Supabase
2. ✅ เพิ่มระบบ Authentication (ถ้าต้องการ)
3. ✅ เพิ่มฟีเจอร์ Sync แบบ Real-time
4. ✅ เพิ่มระบบ Backup/Export

---

## 🚀 พร้อมแล้ว!

เมื่อทำตามขั้นตอนเหล่านี้เสร็จ แอพจดหนี้จะใช้ Database แบบ Professional แทน localStorage! 