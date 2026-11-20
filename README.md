# ระบบจัดการร้านสัตว์เลี้ยง

หน้าเว็บ HTML/CSS/JS ล้วน + Supabase (ฐานข้อมูล PostgreSQL และระบบล็อกอิน) ไม่ต้องมีเซิร์ฟเวอร์เอง

## ติดตั้ง
1. สร้างโปรเจกต์ที่ https://supabase.com แล้วรัน `supabase/schema.sql` และต่อด้วย `supabase/permissions.sql` ใน SQL Editor (ตามลำดับ)
2. Authentication > Users > Add user สร้างบัญชีพนักงาน (อีเมล + รหัสผ่าน) (ถ้าใช้หน้า `register.html` ต้องเปิด Sign ups ไว้ใน Authentication > Providers > Email และควรเปิด Confirm email ด้วย)
3. Project Settings > API คัดลอก Project URL (แค่ `https://xxxx.supabase.co` ห้ามมี `/rest/v1/`) และ anon/publishable key ไปใส่ใน `config.js`
4. สมัครบัญชีของตัวเองที่ `register.html` แล้วรันบรรทัดสุดท้ายใน `permissions.sql` (แก้อีเมลก่อน) เพื่อตั้งตัวเองเป็นผู้ดูแลระบบ คนที่สมัครใหม่ทุกคนจะเป็น "ลูกค้า" อัตโนมัติ
5. อัปโหลดทุกไฟล์ขึ้น GitHub แล้วเปิด Settings > Pages > Deploy from branch (main, root)
6. เปิดใช้งานที่ `login.html` (หรือ `index.html` ระบบจะพาไปหน้าล็อกอินให้ถ้ายังไม่ได้ล็อกอิน)

## โครงสร้าง
- `login.html` + `login.js` หน้าล็อกอิน
- `register.html` + `register.js` หน้าสมัครสมาชิก
- `index.html` หน้าระบบหลัก (เมนู แดชบอร์ด ตาราง) ต้องล็อกอินก่อนจึงเข้าได้
- `config.js` ตั้งค่า Supabase ไฟล์เดียว ใช้ร่วมกันทั้งสองหน้า
- `app.js` การทำงานของระบบหลัก (ปุ่ม ฟอร์ม ต่อ Supabase)
- `style.css` หน้าตา
- `supabase/schema.sql` ตาราง และสิทธิ์การเข้าถึง (RLS)

## สิทธิ์การใช้งาน
- **ผู้ดูแลระบบ (admin)** เห็นทุกเมนู แก้ไข/เพิ่ม/ลบได้ทั้งหมด
- **ลูกค้า (customer)** ดูได้อย่างเดียว เห็นรายการบริการและราคา กับคิว/สัตว์เลี้ยงของตัวเองเท่านั้น (จับคู่จากอีเมลที่ admin กรอกในข้อมูลลูกค้า) แก้ไขไม่ได้
- การคุมสิทธิ์จริงอยู่ที่ฐานข้อมูล (RLS ใน `permissions.sql`) ปุ่มที่ซ่อนในหน้าเว็บเป็นแค่ความสะดวกในการใช้งาน
- ควรเปิด Confirm email ใน Supabase เพื่อกันคนสมัครด้วยอีเมลของคนอื่นแล้วเห็นคิวของเขา
