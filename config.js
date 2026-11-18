
const SUPABASE_URL='https://ovpoiiznjzmzehqfzblu.supabase.co';
const SUPABASE_KEY='sb_publishable_qQ_Mc93GvoSRu9xLKVOgiw_RNjXqyAg';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{lock:(n,t,fn)=>fn()}}); // lock แบบไม่รอ: กัน error ของ Web Locks ตอนเปิดผ่าน file://

// ตั้งค่าร้าน (ใช้กับระบบชำระเงิน)
const SHOP_NAME='ร้านสัตว์เลี้ยง';          // ชื่อร้านที่แสดงบนใบเสร็จ
const PROMPTPAY_ID='';                       // เบอร์โทร 10 หลัก หรือเลขบัตรประชาชน/เลขนิติบุคคล 13 หลัก — เว้นว่างไว้จะไม่แสดง QR

// ตรวจว่า session ใช้ได้จริง (ถามเซิร์ฟเวอร์) กันหน้า login/index ส่งกลับไปกลับมา
async function validSession(){
 const{data:{session}}=await sb.auth.getSession();
 if(!session){window.authWhy='ไม่พบ session';return false}
 const{error}=await sb.auth.getUser();
 if(!error)return true;
 window.authWhy=error.message+(error.status?' ('+error.status+')':'');
 if(error.status===401||error.status===403||/jwt|token|session|not found/i.test(error.message))await sb.auth.signOut({scope:'local'});
 return false;
}
