/* ===== หน้าสมัครสมาชิก ===== */
const $=s=>document.querySelector(s);

$('#regForm').onsubmit=async e=>{
 e.preventDefault();
 const f=new FormData(e.target),btn=e.target.querySelector('button');
 $('#err').textContent='';$('#ok').textContent='';
 if(f.get('p')!==f.get('p2')){$('#err').textContent='รหัสผ่านทั้งสองช่องไม่ตรงกัน';return}
 btn.disabled=true;
 const{data,error}=await sb.auth.signUp({
  email:f.get('u'),password:f.get('p'),
  options:{data:{name:f.get('n')},emailRedirectTo:new URL('login.html',location.href).href}
 });
 if(error){
  $('#err').textContent=/registered|already/i.test(error.message)?'อีเมลนี้ถูกใช้สมัครแล้ว':'สมัครไม่สำเร็จ: '+error.message;
  btn.disabled=false;return;
 }
 // ถ้าเปิด Confirm email ไว้ จะยังไม่มี session ต้องไปกดลิงก์ในอีเมลก่อน
 if(data.session){location.replace('index.html');return}
 $('#ok').textContent='สมัครสำเร็จ! กรุณาตรวจอีเมลแล้วกดลิงก์ยืนยัน จากนั้นกลับมาเข้าสู่ระบบ';
 e.target.reset();btn.disabled=false;
};