/* ===== หน้าล็อกอิน ===== */
const $=s=>document.querySelector(s);

// ถ้าล็อกอินค้างอยู่แล้ว ให้เข้าระบบเลย
validSession().then(ok=>{
 if(!ok)return;
 // กันวนลูป: ถ้าถูกเด้งกลับมาหลายรอบในเวลาสั้นๆ ให้หยุดและบอกสาเหตุ
 const n=JSON.parse(sessionStorage.getItem('bn')||'[]').filter(t=>Date.now()-t<15000);n.push(Date.now());
 sessionStorage.setItem('bn',JSON.stringify(n));
 if(n.length>3){$('#err').textContent='หน้าเว็บวนกลับไปมา สาเหตุล่าสุด: '+(sessionStorage.getItem('why')||'ไม่ทราบ')+' — ลองเปิดผ่าน http://localhost แทน file://';return}
 location.replace('index.html');
});

$('#loginForm').onsubmit=async e=>{
 e.preventDefault();
 const f=new FormData(e.target),btn=e.target.querySelector('button');
 btn.disabled=true;$('#err').textContent='';
 const{error}=await sb.auth.signInWithPassword({email:f.get('u'),password:f.get('p')});
 if(error){$('#err').textContent='อีเมลหรือรหัสผ่านไม่ถูกต้อง ลองใหม่อีกครั้ง';btn.disabled=false;return}
 sessionStorage.removeItem('bn');location.replace('index.html');
};