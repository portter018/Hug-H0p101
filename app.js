/* ===== ชั้นข้อมูล: โหลดจาก Supabase แล้วบันทึกเฉพาะแถวที่เปลี่ยน ===== */
const TBL=['customers','pets','services','bookings'];
let db={customers:[],pets:[],services:[],bookings:[]},snap={};
const take=()=>{snap={};TBL.forEach(t=>{snap[t]=Object.fromEntries(db[t].map(r=>[r.id,JSON.stringify(r)]))})};
async function loadAll(){for(const t of TBL){const{data,error}=await sb.from(t).select('*');if(error)throw error;db[t]=data}take()}
let q=Promise.resolve();
function save(){q=q.then(async()=>{try{
 for(const t of TBL){
  const cur=Object.fromEntries(db[t].map(r=>[r.id,JSON.stringify(r)]));
  const up=db[t].filter(r=>cur[r.id]!==snap[t][r.id]),del=Object.keys(snap[t]).filter(id=>!(id in cur));
  if(up.length){const{error}=await sb.from(t).upsert(up);if(error)throw error}
  if(del.length){const{error}=await sb.from(t).delete().in('id',del);if(error)throw error}
 }take()}catch(e){alert('บันทึกไม่สำเร็จ: '+e.message)}})}

/* ===== ตัวช่วย ===== */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const pad=n=>String(n).padStart(2,'0');
const ds=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const addDays=n=>{const d=new Date();d.setDate(d.getDate()+n);return ds(d)};
const uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const baht=n=>'฿'+Number(n||0).toLocaleString('th-TH');
const dfmt=s=>{const[y,m,d]=s.split('-');return d+'/'+m+'/'+(+y+543)};
const ST={booked:'จองแล้ว',waiting:'รอคิว',serving:'กำลังให้บริการ',done:'เสร็จสิ้น',cancel:'ยกเลิก'};
const PAY={cash:'เงินสด',transfer:'โอนเงิน',card:'บัตร',none:'ยังไม่ชำระ'};
const paid=b=>b.pay&&!b.pay.void?b.pay:null;
const cust=id=>db.customers.find(c=>c.id===id),pet=id=>db.pets.find(p=>p.id===id);
const petLabel=p=>p?p.name+' ('+(cust(p.cid)?.name||'-')+')':'-';
const badge=s=>`<span class="chip s-${s}">${ST[s]}</span>`;
const show=(el,on)=>{el.hidden=!on};
let user=null,ui={tab:'dash',range:'week',fr:'today',qdate:ds(new Date()),hpet:'all'};
const TITLES={dash:'แผงควบคุม',book:'จองคิว',queue:'คิววันนี้',pay:'การชำระเงิน',cust:'ลูกค้า',svc:'บริการและราคา',hist:'ประวัติการใช้บริการ'};
const DAYS={today:1,week:7,month:30,year:365};

/* ===== ฟอร์มป๊อปอัป ===== */
function openForm(title,fields,cb){
 const d=$('#dlg');
 d.innerHTML=`<form><h3>${esc(title)}</h3>${fields.map(f=>`<label for="f_${f.k}">${f.label}</label>`+(f.opts?`<select id="f_${f.k}" name="${f.k}">${f.opts.map(o=>`<option value="${esc(o[0])}"${o[0]==f.val?' selected':''}>${esc(o[1])}</option>`).join('')}</select>`:f.type==='area'?`<textarea id="f_${f.k}" name="${f.k}" rows="2">${esc(f.val||'')}</textarea>`:`<input id="f_${f.k}" name="${f.k}" type="${f.type||'text'}" value="${esc(f.val??'')}"${f.req===false?'':' required'}>`)).join('')}
 <div class="acts" style="margin-top:16px;justify-content:flex-end"><button type="button" class="btn alt" id="x">ยกเลิก</button><button class="btn">บันทึก</button></div></form>`;
 $('#x').onclick=()=>d.close();
 d.querySelector('form').onsubmit=e=>{e.preventDefault();cb(Object.fromEntries(new FormData(e.target)));save();d.close();render()};
 d.showModal();
}

/* ===== การกระทำของผู้ใช้ ===== */
function bookForm(){
 if(!db.pets.length)return alert('ยังไม่มีสัตว์เลี้ยง เพิ่มลูกค้าและสัตว์เลี้ยงที่แท็บ “ลูกค้า” ก่อน');
 if(!db.services.length)return alert('ยังไม่มีบริการ เพิ่มที่แท็บ “บริการและราคา” ก่อน');
 openForm('จองคิวใหม่',[
  {k:'pid',label:'สัตว์เลี้ยง',opts:db.pets.map(p=>[p.id,petLabel(p)])},
  {k:'sid',label:'บริการ',opts:db.services.map(s=>[s.id,s.name+' – '+baht(s.price)])},
  {k:'date',label:'วันที่',type:'date',val:ds(new Date())},
  {k:'time',label:'เวลา',type:'time',val:'10:00'}],o=>{
  const s=db.services.find(x=>x.id===o.sid);
  db.bookings.push({id:uid(),pid:o.pid,sid:s.id,sname:s.name,date:o.date,time:o.time,status:'booked',price:s.price,note:'',pay:null})});
}
function setSt(id,st){db.bookings.find(b=>b.id===id).status=st;save();render()}
function finish(id){
 const b=db.bookings.find(x=>x.id===id);
 openForm('บันทึกการให้บริการ: '+petLabel(pet(b.pid)),[
  {k:'note',label:'บันทึกการให้บริการ',type:'area',val:b.note,req:false},
  {k:'price',label:'ราคา (บาท)',type:'number',val:b.price}],o=>{
  b.status='done';b.note=o.note;b.price=+o.price;
  setTimeout(()=>payNow(id),0)});
}
/* ===== ระบบชำระเงิน ===== */
const PM=['cash','transfer','card'];
const r2=n=>Math.round((+n||0)*100)/100;
const pdate=b=>b.pay.at?ds(new Date(b.pay.at)):b.date;
const ptime=b=>{if(!b.pay.at)return dfmt(b.date);const t=new Date(b.pay.at);return dfmt(ds(t))+' '+pad(t.getHours())+':'+pad(t.getMinutes())};
const ppId=()=>typeof PROMPTPAY_ID!=='undefined'?String(PROMPTPAY_ID).replace(/\D/g,''):'';
const shopName=()=>typeof SHOP_NAME!=='undefined'&&SHOP_NAME?SHOP_NAME:'ร้านสัตว์เลี้ยง';

// เลขที่ใบเสร็จ: R + ปีเดือนวัน + ลำดับของวันนั้น เช่น R261118-001
function receiptNo(){
 const d=new Date(),p='R'+String(d.getFullYear()).slice(2)+pad(d.getMonth()+1)+pad(d.getDate())+'-';
 const n=Math.max(0,...db.bookings.map(b=>b.pay&&String(b.pay.no||'').startsWith(p)?+String(b.pay.no).slice(p.length):0));
 return p+String(n+1).padStart(3,'0');
}

// PromptPay QR (EMVCo) พร้อมยอดเงิน
function crc16(s){let c=0xFFFF;for(let i=0;i<s.length;i++){c^=s.charCodeAt(i)<<8;for(let j=0;j<8;j++)c=c&0x8000?((c<<1)^0x1021)&0xFFFF:(c<<1)&0xFFFF}return c.toString(16).toUpperCase().padStart(4,'0')}
function ppPayload(id,amt){
 const t=(k,v)=>k+String(v.length).padStart(2,'0')+v;
 const tgt=id.length>=13?t('02',id):t('01',('0066'+id.replace(/^0/,'')).slice(-13));
 const s=t('00','01')+t('01',amt?'12':'11')+t('29',t('00','A000000677010111')+tgt)+t('58','TH')+t('53','764')+(amt?t('54',amt.toFixed(2)):'')+'6304';
 return s+crc16(s);
}
function qrSvg(text){
 if(typeof qrcode==='undefined')return '';
 const q=qrcode(0,'M');q.addData(text);q.make();
 const n=q.getModuleCount(),m=4;let p='';
 for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))p+=`M${c+m},${r+m}h1v1h-1z`;
 return `<svg viewBox="0 0 ${n+2*m} ${n+2*m}" width="200" height="200" role="img" aria-label="QR พร้อมเพย์" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${p}" fill="#000"/></svg>`;
}

function payNow(id){
 const b=db.bookings.find(x=>x.id===id);if(!b)return;
 if(paid(b))return showReceipt(id);
 const d=$('#dlg'),due=r2(b.price);let m='cash';
 const LBL={transfer:'เลขอ้างอิงสลิป / ชื่อผู้โอน (ถ้ามี)',card:'เลขอนุมัติบัตร / 4 หลักท้าย (ถ้ามี)'};
 d.innerHTML=`<form id="payF"><h3>รับชำระเงิน</h3>
 <div class="mute">${esc(petLabel(pet(b.pid)))} · ${esc(b.sname)} · ${dfmt(b.date)}</div>
 <div class="payrow"><span>ราคา</span><b>${baht(due)}</b></div>
 <label for="pd">ส่วนลด (บาท)</label><input id="pd" type="number" min="0" max="${due}" step="0.01" value="0" inputmode="decimal">
 <div class="payrow tot"><span>ยอดที่ต้องชำระ</span><b id="pnet"></b></div>
 <div class="rng pm" role="group" aria-label="วิธีชำระเงิน">${PM.map(k=>`<button type="button" data-m="${k}">${PAY[k]}</button>`).join('')}</div>
 <div id="pcash"><label for="prc">รับเงินมา (บาท)</label><input id="prc" type="number" min="0" step="0.01" inputmode="decimal" placeholder="เว้นว่าง = รับพอดี">
  <div class="acts" style="margin-top:6px"><button type="button" class="btn alt sm" data-q="0">พอดี</button><button type="button" class="btn alt sm" data-q="100">100</button><button type="button" class="btn alt sm" data-q="500">500</button><button type="button" class="btn alt sm" data-q="1000">1,000</button></div>
  <div class="payrow" style="margin-top:8px"><span>เงินทอน</span><b id="pchg"></b></div></div>
 <div id="ptr" hidden><div class="qr" id="pqr"></div><div class="mute" id="pqrm" style="text-align:center"></div></div>
 <div id="pref" hidden><label for="prf" id="prfl"></label><input id="prf" type="text" maxlength="60"></div>
 <div class="err" id="perr" role="alert"></div>
 <div class="acts" style="margin-top:12px;justify-content:flex-end"><button type="button" class="btn alt" id="x">ชำระภายหลัง</button><button class="btn" id="pok">ยืนยันรับชำระ</button></div></form>`;
 const net=()=>Math.max(0,r2(due-Math.min(due,Math.max(0,+$('#pd').value||0))));
 const rcv=()=>{const v=$('#prc').value;return v===''?null:r2(v)};
 function sync(){
  const n=net(),rc=rcv();
  $('#pnet').textContent=baht(n);
  $$('#payF [data-m]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.m===m));
  show($('#pcash'),m==='cash');show($('#ptr'),m==='transfer');show($('#pref'),m!=='cash');
  $('#perr').textContent='';$('#pok').disabled=false;
  if(m==='cash'){
   const ch=rc===null?0:rc-n;
   $('#pchg').textContent=baht(Math.max(0,ch));
   if(rc!==null&&ch<0){$('#perr').textContent='รับเงินมาไม่พอ ขาดอีก '+baht(-ch);$('#pok').disabled=true}
  }else{$('#prfl').textContent=LBL[m]}
  if(m==='transfer'){
   const id=ppId();
   if(!id)$('#pqr').innerHTML='',$('#pqrm').textContent='ยังไม่ได้ตั้งค่าพร้อมเพย์ ใส่เบอร์หรือเลขบัตรใน config.js เพื่อแสดง QR';
   else if(!n)$('#pqr').innerHTML='',$('#pqrm').textContent='ยอดชำระเป็น 0 บาท ไม่ต้องโอน';
   else{const svg=qrSvg(ppPayload(id,n));$('#pqr').innerHTML=svg;$('#pqrm').textContent=svg?'สแกนด้วยแอปธนาคาร · '+baht(n):'โหลดตัวสร้าง QR ไม่สำเร็จ โอนมาที่ '+id}
  }
 }
 d.querySelectorAll('[data-m]').forEach(x=>x.onclick=()=>{m=x.dataset.m;sync()});
 d.querySelectorAll('[data-q]').forEach(x=>x.onclick=()=>{$('#prc').value=x.dataset.q==='0'?net():x.dataset.q;sync()});
 $('#pd').oninput=sync;$('#prc').oninput=sync;
 $('#x').onclick=()=>{d.close();render()};
 $('#payF').onsubmit=e=>{
  e.preventDefault();sync();if($('#pok').disabled)return;
  const n=net(),rc=rcv(),p={no:receiptNo(),method:m,amount:n,discount:r2(due-n),at:new Date().toISOString(),by:user};
  if(m==='cash'){p.received=rc===null?n:rc;p.change=r2(p.received-n)}
  else if($('#prf').value.trim())p.ref=$('#prf').value.trim();
  if(b.pay&&b.pay.void)p.prev=b.pay;
  b.pay=p;save();d.close();render();showReceipt(id);
 };
 sync();d.showModal();
}

function showReceipt(id){
 const b=db.bookings.find(x=>x.id===id);if(!b||!b.pay)return;
 const p=b.pay,pt=pet(b.pid),c=pt&&cust(pt.cid),d=$('#dlg');
 const row=(k,v,cls='')=>`<div class="payrow ${cls}"><span>${k}</span><span>${v}</span></div>`;
 d.innerHTML=`<div class="rcpt"><h3 style="text-align:center">🐶 ${esc(shopName())}</h3>
 <div class="mute" style="text-align:center">ใบเสร็จรับเงิน${p.void?' · <b class="s-cancel">ยกเลิกแล้ว</b>':''}</div><hr>
 ${row('เลขที่',esc(p.no||'-'))}${row('วันที่',ptime(b))}${row('ลูกค้า',esc(c?.name||'-'))}${row('สัตว์เลี้ยง',esc(pt?.name||'-'))}<hr>
 ${row(esc(b.sname),baht(+p.amount+(+p.discount||0)))}${p.discount?row('ส่วนลด','-'+baht(p.discount)):''}${row('ยอดสุทธิ',baht(p.amount),'tot')}<hr>
 ${row('ชำระโดย',PAY[p.method]||'-')}${p.method==='cash'&&p.received!=null?row('รับเงิน',baht(p.received))+row('เงินทอน',baht(p.change)):''}${p.ref?row('อ้างอิง',esc(p.ref)):''}
 ${p.void?`<hr>${row('เหตุผลที่ยกเลิก',esc(p.void.reason))}`:''}
 <p class="mute" style="text-align:center;margin:12px 0 0">ขอบคุณที่ใช้บริการ</p>
 <div class="acts noprint" style="margin-top:16px;justify-content:flex-end"><button type="button" class="btn alt" id="rx">ปิด</button><button type="button" class="btn" id="rp">พิมพ์ใบเสร็จ</button></div></div>`;
 $('#rx').onclick=()=>d.close();$('#rp').onclick=()=>window.print();
 d.showModal();
}

function voidPay(id){
 const b=db.bookings.find(x=>x.id===id);if(!b||!paid(b))return;
 const r=prompt('ยกเลิกใบเสร็จ '+(b.pay.no||'')+' — ระบุเหตุผล (จำเป็น)');
 if(r===null)return;
 if(!r.trim())return alert('กรุณาระบุเหตุผลในการยกเลิก');
 b.pay.void={at:new Date().toISOString(),reason:r.trim(),by:user};
 save();render();
}

function rPay(){
 const len=DAYS[ui.fr],a=addDays(1-len),z=addDays(0);
 $$('[data-frange]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.frange===ui.fr));
 const inR=db.bookings.filter(b=>b.pay&&pdate(b)>=a&&pdate(b)<=z).sort((x,y)=>(y.pay.at||y.date).localeCompare(x.pay.at||x.date));
 const ok=inR.filter(b=>!b.pay.void),sum=f=>ok.filter(f).reduce((s,b)=>s+(+b.pay.amount||0),0);
 const K=(ic,t,v,sub)=>`<div class="kc"><div class="kh"><span>${ic} ${t}</span></div><div class="kb"><b>${v}</b><span>${sub}</span></div></div>`;
 const bym=k=>ok.filter(b=>b.pay.method===k);
 $('#payKpi').innerHTML=K('💰','รับชำระรวม',baht(sum(()=>1)),ok.length+' ใบเสร็จ · '+dfmt(a)+' – '+dfmt(z))
  +PM.map(k=>K({cash:'💵',transfer:'📱',card:'💳'}[k],PAY[k],baht(sum(b=>b.pay.method===k)),bym(k).length+' รายการ')).join('');
 const owed=db.bookings.filter(b=>b.status==='done'&&!paid(b)).sort((x,y)=>(y.date+y.time).localeCompare(x.date+x.time));
 show($('#owedTable'),owed.length);show($('#owedEmpty'),!owed.length);
 $('#owedSum').textContent=owed.length?'รวมค้างชำระ '+baht(owed.reduce((s,b)=>s+(+b.price||0),0))+' จาก '+owed.length+' รายการ':'';
 $('#owedRows').innerHTML=owed.map(b=>`<tr><td>${dfmt(b.date)} ${b.time}</td><td>${esc(petLabel(pet(b.pid)))}</td><td>${esc(b.sname)}</td><td>${baht(b.price)}${b.pay&&b.pay.void?'<div class="mute">ใบเสร็จ '+esc(b.pay.no||'')+' ถูกยกเลิก</div>':''}</td><td><button class="btn sm" data-act="pay" data-id="${b.id}">รับชำระเงิน</button></td></tr>`).join('');
 show($('#payTable'),inR.length);show($('#payEmpty'),!inR.length);
 $('#payRows').innerHTML=inR.map(b=>{const p=b.pay;return `<tr><td>${esc(p.no||'-')}</td><td>${ptime(b)}</td><td>${esc(petLabel(pet(b.pid)))}<div class="mute">${esc(b.sname)}</div></td><td>${PAY[p.method]||'-'}${p.ref?'<div class="mute">'+esc(p.ref)+'</div>':''}</td><td>${p.void?'<s>'+baht(p.amount)+'</s> <span class="chip s-cancel">ยกเลิกแล้ว</span>':baht(p.amount)}</td><td><div class="acts"><button class="btn alt sm" data-act="receipt" data-id="${b.id}">ใบเสร็จ</button>${p.void?'':`<button class="btn bad sm" data-act="voidPay" data-id="${b.id}">ยกเลิก</button>`}</div></td></tr>`}).join('');
}
function addCust(){openForm('เพิ่มลูกค้า',[{k:'name',label:'ชื่อลูกค้า'},{k:'phone',label:'เบอร์โทร',type:'tel'}],o=>db.customers.push({id:uid(),...o}))}
function addPet(cid){openForm('เพิ่มสัตว์เลี้ยงของ '+cust(cid).name,[{k:'name',label:'ชื่อสัตว์เลี้ยง'},{k:'type',label:'ประเภท',opts:['สุนัข','แมว','กระต่าย','อื่นๆ'].map(x=>[x,x])},{k:'breed',label:'สายพันธุ์',req:false},{k:'note',label:'หมายเหตุ (โรค/ภูมิแพ้/นิสัย)',type:'area',req:false}],o=>db.pets.push({id:uid(),cid,...o}))}
function svcForm(id){
 const s=db.services.find(x=>x.id===id);
 openForm(s?'แก้ไขบริการ':'เพิ่มบริการ',[{k:'name',label:'ชื่อบริการ',val:s?.name},{k:'price',label:'ราคา (บาท)',type:'number',val:s?.price}],o=>{s?(s.name=o.name,s.price=+o.price):db.services.push({id:uid(),name:o.name,price:+o.price})});
}
function delSvc(id){if(confirm('ลบบริการนี้? คิวเดิมยังเก็บชื่อและราคาไว้')){db.services=db.services.filter(s=>s.id!==id);save();render()}}

/* ===== วาดข้อมูลลงโครงหน้าใน index.html ===== */
function stats(a,b){
 const bs=db.bookings.filter(x=>x.date>=a&&x.date<=b),dn=bs.filter(x=>x.status==='done');
 const rev=dn.reduce((s,x)=>s+(paid(x)?+x.pay.amount:0),0);
 return{dn,rev,n:dn.length,avg:dn.length?rev/dn.length:0,pets:new Set(dn.map(x=>x.pid)).size,cancel:bs.filter(x=>x.status==='cancel').length,unpaid:dn.filter(x=>!paid(x)).length};
}
function rDash(){
 const len=DAYS[ui.range],a=addDays(1-len),b=addDays(0),c=stats(a,b),p=stats(addDays(1-2*len),addDays(-len));
 $$('[data-range]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.range===ui.range));
 const K=(k,v,sub,cur,prev,bad)=>{
  $('#k-'+k).textContent=v;$('#s-'+k).textContent=sub;
  const x=prev?Math.round((cur-prev)/prev*100):(cur?100:0),up=x>=0,el=$('#pc-'+k);
  el.className='pc '+((bad?!up||x===0:up)?'g':'r');el.textContent=(up?'↑ +':'↓ ')+x+'%'};
 K('rev',baht(c.rev),'ข้อมูลวันที่ '+dfmt(a)+' ถึง '+dfmt(b),c.rev,p.rev);
 K('n',c.n,'บริการที่เสร็จสิ้นในช่วงนี้',c.n,p.n);
 K('avg',baht(Math.round(c.avg)),'รายได้เฉลี่ยต่อการให้บริการ',c.avg,p.avg);
 K('pets',c.pets,'จำนวนสัตว์เลี้ยงไม่ซ้ำกัน',c.pets,p.pets);
 K('cancel',c.cancel,'การจองที่ถูกยกเลิก',c.cancel,p.cancel,1);
 K('unpaid',c.unpaid,'เสร็จสิ้นแล้วแต่ยังไม่ชำระ',c.unpaid,p.unpaid,1);
 const sum=f=>db.bookings.filter(f).reduce((s,x)=>s+(paid(x)?+x.pay.amount:0),0);
 let ser=[];
 if(ui.range==='year'){for(let i=11;i>=0;i--){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);const k=d.getFullYear()+'-'+pad(d.getMonth()+1);ser.push({l:pad(d.getMonth()+1)+'/'+String(d.getFullYear()+543).slice(2),v:sum(x=>x.date.startsWith(k))})}}
 else{const n=ui.range==='month'?30:7;for(let i=n-1;i>=0;i--){const d=addDays(-i);ser.push({l:d.slice(8)+'/'+d.slice(5,7),v:sum(x=>x.date===d)})}}
 const mx=Math.max(1,...ser.map(x=>x.v)),few=ser.length<=12;
 $('#chartTitle').textContent=ui.range==='year'?'รายได้รายเดือน':'รายได้รายวัน';
 $('#chart').innerHTML=ser.map((x,i)=>`<div class="col">${few||x.v?`<span class="v">${baht(x.v)}</span>`:''}<div class="b" style="height:${Math.round(x.v/mx*180)}px"></div><span class="l">${few||i%5===0?x.l:''}</span></div>`).join('');
 const g={};c.dn.forEach(x=>{(g[x.sname]=g[x.sname]||{r:0,n:0});g[x.sname].r+=paid(x)?+x.pay.amount:0;g[x.sname].n++});
 const top=Object.entries(g).sort((x,y)=>y[1].r-x[1].r).slice(0,6),tr=top.reduce((s,x)=>s+x[1].r,0)||1;
 $('#topList').innerHTML=top.length?top.map(([n,s])=>`<div class="sv"><div class="r"><b>${esc(n)}</b><b style="color:var(--pri)">${Math.round(s.r/tr*100)}%</b></div><div class="prog"><i style="width:${Math.round(s.r/tr*100)}%"></i></div><div class="r mute"><span>${baht(s.r)}</span><span>${s.n} คิว</span></div></div>`).join(''):'<div class="empty">ยังไม่มีบริการที่เสร็จสิ้นในช่วงนี้</div>';
}
function rBook(){
 const rows=db.bookings.filter(b=>b.status==='booked'&&b.date>=ds(new Date())).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 show($('#bookTable'),rows.length);show($('#bookEmpty'),!rows.length);
 $('#bookRows').innerHTML=rows.map(b=>`<tr><td>${dfmt(b.date)}</td><td>${b.time}</td><td>${esc(petLabel(pet(b.pid)))}</td><td>${esc(b.sname)}</td><td>${baht(b.price)}</td><td><button class="btn bad sm" data-act="st" data-st="cancel" data-id="${b.id}">ยกเลิกคิว</button></td></tr>`).join('');
}
function rQueue(){
 $('#qdate').value=ui.qdate;
 const rows=db.bookings.filter(b=>b.date===ui.qdate).sort((a,b)=>a.time.localeCompare(b.time));
 const A=(act,id,t,cls='',st='')=>`<button class="btn ${cls} sm" data-act="${act}" data-id="${id}"${st?` data-st="${st}"`:''}>${t}</button>`;
 const act=b=>({booked:A('st',b.id,'เช็คอิน','','waiting')+A('st',b.id,'ยกเลิก','bad','cancel'),
  waiting:A('st',b.id,'เริ่มให้บริการ','','serving')+A('st',b.id,'ยกเลิก','bad','cancel'),
  serving:A('finish',b.id,'เสร็จสิ้น + บันทึก'),
  done:paid(b)?`<span class="mute">${PAY[b.pay.method]} ${baht(b.pay.amount)}</span>`+A('receipt',b.id,'ใบเสร็จ','alt'):A('pay',b.id,'รับชำระเงิน','alt'),cancel:''}[b.status]);
 show($('#queueTable'),rows.length);show($('#queueEmpty'),!rows.length);
 $('#queueRows').innerHTML=rows.map(b=>`<tr><td>${b.time}</td><td>${esc(petLabel(pet(b.pid)))}</td><td>${esc(b.sname)}<div class="mute">${baht(b.price)}</div></td><td>${badge(b.status)}</td><td><div class="acts">${act(b)}</div></td></tr>`).join('');
}
function rCust(){
 show($('#custEmpty'),!db.customers.length);
 $('#custGrid').innerHTML=db.customers.map(c=>`<div class="card"><h3>${esc(c.name)}</h3><div class="mute">${esc(c.phone)}</div><div class="pets">${db.pets.filter(p=>p.cid===c.id).map(p=>`<span class="chip" title="${esc(p.note)}">${esc(p.name)} · ${esc(p.type)}${p.breed?' '+esc(p.breed):''}</span>`).join('')||'<span class="mute">ยังไม่มีสัตว์เลี้ยง</span>'}</div><button class="btn alt sm" data-act="addPet" data-id="${c.id}">+ เพิ่มสัตว์เลี้ยง</button></div>`).join('');
}
function rSvc(){
 show($('#svcTable'),db.services.length);show($('#svcEmpty'),!db.services.length);
 $('#svcRows').innerHTML=db.services.map(s=>`<tr><td>${esc(s.name)}</td><td>${baht(s.price)}</td><td><div class="acts"><button class="btn alt sm" data-act="svcEdit" data-id="${s.id}">แก้ไข</button><button class="btn bad sm" data-act="svcDel" data-id="${s.id}">ลบ</button></div></td></tr>`).join('');
}
function rHist(){
 $('#histPet').innerHTML='<option value="all">สัตว์เลี้ยงทั้งหมด</option>'+db.pets.map(p=>`<option value="${p.id}"${ui.hpet===p.id?' selected':''}>${esc(petLabel(p))}</option>`).join('');
 const rows=db.bookings.filter(b=>b.status==='done'&&(ui.hpet==='all'||b.pid===ui.hpet)).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
 show($('#histTable'),rows.length);show($('#histEmpty'),!rows.length);
 $('#histRows').innerHTML=rows.map(b=>`<tr><td>${dfmt(b.date)} ${b.time}</td><td>${esc(petLabel(pet(b.pid)))}</td><td>${esc(b.sname)}</td><td>${esc(b.note)||'-'}</td><td>${paid(b)?PAY[b.pay.method]+' '+baht(b.pay.amount):'<span class="s-waiting">ยังไม่ชำระ</span>'}</td></tr>`).join('');
 $('#histSum').textContent='รวมที่ชำระแล้ว '+baht(rows.reduce((a,b)=>a+(paid(b)?+b.pay.amount:0),0))+' จาก '+rows.length+' รายการ';
}
const VIEWS={dash:rDash,book:rBook,queue:rQueue,pay:rPay,cust:rCust,svc:rSvc,hist:rHist};
function render(){
 show($('#appView'),!!user);
 if(!user)return;
 $('#userName').textContent=user;$('#title').textContent=TITLES[ui.tab];
 $$('[data-tab]').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===ui.tab));
 Object.keys(VIEWS).forEach(k=>show($('#v-'+k),k===ui.tab));
 VIEWS[ui.tab]();
}

/* ===== ผูกเหตุการณ์ (คลิก/พิมพ์/เลือก) ===== */
$$('[data-tab]').forEach(b=>b.onclick=()=>{ui.tab=b.dataset.tab;render()});
$$('[data-range]').forEach(b=>b.onclick=()=>{ui.range=b.dataset.range;render()});
$('#btnBook').onclick=bookForm;$('#btnCust').onclick=addCust;$('#btnSvc').onclick=()=>svcForm();
$$('[data-frange]').forEach(b=>b.onclick=()=>{ui.fr=b.dataset.frange;render()});
$('#qdate').onchange=e=>{ui.qdate=e.target.value;render()};
$('#histPet').onchange=e=>{ui.hpet=e.target.value;render()};
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b)return;
 const id=b.dataset.id,a=b.dataset.act;
 ({st:()=>setSt(id,b.dataset.st),finish:()=>finish(id),pay:()=>payNow(id),receipt:()=>showReceipt(id),voidPay:()=>voidPay(id),addPet:()=>addPet(id),svcEdit:()=>svcForm(id),svcDel:()=>delSvc(id)})[a]();
});

/* ===== ตรวจการล็อกอิน / ออกจากระบบ ===== */
function back(why){sessionStorage.setItem('why',why+' @'+new Date().toLocaleTimeString());location.replace('login.html')}
$('#logoutBtn').onclick=async()=>{await sb.auth.signOut();location.replace('login.html')};
sb.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT')back('เหตุการณ์ SIGNED_OUT (session ถูกล้าง หรือรีเฟรช token ไม่ผ่าน)')});
async function start(){
 if(!await validSession())return back('ตรวจ session ไม่ผ่านตอนเปิดหน้าหลัก: '+window.authWhy);
 const{data:{session}}=await sb.auth.getSession();
 user=session.user.email;
 try{await loadAll()}catch(e){alert('โหลดข้อมูลไม่สำเร็จ: '+e.message)}
 render();
}
start();