'use strict';
const $=id=>document.getElementById(id), plan=[{name:'المرحلة الأولى',theme:'بوابة الانطلاق',lectures:[4,5,6,7]},{name:'المرحلة الثانية',theme:'ميدان التركيز',lectures:[8,9,10]},{name:'المرحلة الثالثة',theme:'وادي المهارة',lectures:[11,12,13]},{name:'المرحلة الرابعة',theme:'قلعة التحدّي',lectures:[14,15,16]},{name:'المرحلة الخامسة',theme:'قمة الإتقان',lectures:[17,18,19]},{name:'المرحلة السادسة',theme:'طريق الأبطال',lectures:[20,21,22]},{name:'المرحلة السابعة',theme:'بوابة الكنز',lectures:[23,24,25,26]}];
const ranks=[{min:0,name:'متدرّب القدرات',icon:'🌟'},{min:60,name:'جامع النقاط',icon:'🥉'},{min:140,name:'منافس قوي',icon:'🥈'},{min:240,name:'خبير التحدّي',icon:'🥇'},{min:360,name:'أسطورة الكمي',icon:'👑'},{min:460,name:'بطل القدرات',icon:'🏆'}];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let db=null,user=null,profile=null,students=[],parents=[],links=[],progress=[],reports=[];
const show=(id,on=true)=>$(id).classList.toggle('hidden',!on);
function notice(s,err=false){$('status').textContent=s;$('status').className=err?'error':'success'}
function check(data){if(data.error)throw data.error;return data.data}
const SUPABASE_URL='https://hxogatyazevahtxwbwhv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_fuqGm3QCslmgC48J1NgCXg_liibKSRz';
function initDb(){
  show('setup',false);
  if(!window.supabase){notice('تعذر تحميل مكتبة الاتصال؛ تحقق من الإنترنت.',true);return false}
  db=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
  show('auth');
  db.auth.onAuthStateChange((event)=>{
    if(event==='PASSWORD_RECOVERY'){
      setAuthMode('reset');
      notice('تم التحقق من رابط الاستعادة. أدخل كلمة المرور الجديدة.');
    }
  });
  return true;
}
$('themeBtn').onclick=()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';localStorage.setItem('quantTheme',dark?'dark':'light');$('themeBtn').textContent=dark?'☀️':'🌙'};
if(localStorage.getItem('quantTheme')==='dark'){$('themeBtn').click()}
function setAuthMode(mode){
  ['loginPanel','activatePanel','forgotPanel','resetPanel'].forEach(id=>show(id,false));
  const panels={login:'loginPanel',activate:'activatePanel',forgot:'forgotPanel',reset:'resetPanel'};
  show(panels[mode]||panels.login);
  $('authTabs').classList.toggle('hidden',mode==='reset');
  document.querySelectorAll('[data-auth-mode]').forEach(b=>{
    const active=b.dataset.authMode===mode;
    b.classList.toggle('active',active);
    b.setAttribute('aria-selected',String(active));
  });
  notice('');
}
document.querySelectorAll('[data-auth-mode]').forEach(b=>b.onclick=()=>setAuthMode(b.dataset.authMode));
document.querySelectorAll('[data-toggle-password]').forEach(b=>b.onclick=()=>{const input=$(b.dataset.togglePassword);const visible=input.type==='password';input.type=visible?'text':'password';b.textContent=visible?'إخفاء':'إظهار';b.setAttribute('aria-label',visible?'إخفاء كلمة المرور':'إظهار كلمة المرور')});
$('forgotLink').onclick=()=>setAuthMode('forgot');
$('backToLogin').onclick=()=>setAuthMode('login');
$('forgotForm').onsubmit=async e=>{
  e.preventDefault();
  try{
    notice('جارٍ إرسال رابط الاستعادة...');
    const email=$('forgotEmail').value.trim();
    check(await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname}));
    notice('إذا كان البريد مسجّلًا، ستصلك رسالة لاستعادة كلمة المرور. افحص البريد غير الهام أيضًا.');
  }catch(x){notice('تعذّر إرسال طلب الاستعادة: '+x.message,true)}
};
$('resetForm').onsubmit=async e=>{
  e.preventDefault();
  const password=$('newPassword').value;
  if(password!==$('confirmPassword').value){notice('كلمتا المرور غير متطابقتين.',true);return}
  try{
    check(await db.auth.updateUser({password}));
    await db.auth.signOut();
    setAuthMode('login');
    notice('تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.');
  }catch(x){notice('تعذّر تحديث كلمة المرور: '+x.message,true)}
};
$('loginForm').onsubmit=async e=>{e.preventDefault();try{notice('جارٍ تسجيل الدخول...');check(await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value}));await loadSession()}catch(x){notice(x.message,true)}};
$('signupForm').onsubmit=async e=>{e.preventDefault();try{const email=$('signupEmail').value.trim().toLowerCase();check(await db.auth.signUp({email,password:$('signupPassword').value,options:{data:{full_name:$('signupName').value.trim()}}}));notice('تم تقديم التسجيل. تحقق من بريدك للتفعيل ثم سجل الدخول.')}catch(x){notice(x.message,true)}};
$('logout').onclick=async()=>{await db.auth.signOut();user=null;profile=null;show('app',false);show('auth');show('logout',false);$('who').textContent='';notice('تم تسجيل الخروج')};
$('refresh').onclick=()=>refresh();
async function loadSession(){const {data:{user:u},error}=await db.auth.getUser();if(error||!u){show('auth');return}user=u;const p=check(await db.from('profiles').select('*').eq('id',u.id).maybeSingle());if(!p){notice('الحساب غير مخوّل. اطلب دعوة من المشرف.',true);await db.auth.signOut();return}profile=p;show('auth',false);show('app');show('logout');$('who').textContent=p.full_name+' · '+({admin:'مشرف',student:'طالب',parent:'ولي أمر'}[p.role]||p.role);$('welcome').textContent='مرحبًا، '+p.full_name;$('roleDescription').textContent={admin:'إدارة الطلاب والتقارير والروابط الأسرية',student:'أنت وحدك من يعتمد إكمال المهام',parent:'اطلع على إنجازات أبنائك وتقارير المشرف'}[p.role];$('roleMotto').textContent={admin:'كل طالب أمانة، وكل تقدّم مسؤولية.',student:'إنجاز اليوم هو بداية نجاح الغد.',parent:'كن قريبًا من إنجازاته، وشريكًا في نجاحه.'}[p.role];['studentView','adminView','parentView'].forEach(id=>show(id,id===p.role+'View'));await refresh()}
async function refresh(){if(!profile)return;try{notice('جارٍ تحديث البيانات...');if(profile.role==='student')await studentLoad();if(profile.role==='admin')await adminLoad();if(profile.role==='parent')await parentLoad();notice('البيانات محدّثة')}catch(x){notice('تعذر تحديث البيانات: '+x.message,true)}}
const stats=rows=>{const tasks=rows.filter(x=>x.watched||x.practiced).reduce((a,x)=>a+Number(x.watched)+Number(x.practiced),0),done=rows.filter(x=>x.watched&&x.practiced).length;return {tasks,done,points:tasks*10,percent:Math.round(tasks/46*100)}};
async function studentLoad(){progress=check(await db.from('progress').select('*').eq('student_id',user.id));renderStudent()}
function renderStudent(){const byId=Object.fromEntries(progress.map(x=>[x.lecture,x]));const s=stats(progress);$('points').textContent=s.points;$('done').textContent=s.done+' / 23';$('percent').textContent=s.percent+'%';$('overallText').textContent=s.tasks+' من 46 مهمة';$('overallBar').style.width=s.percent+'%';const rank=ranks.filter(x=>s.points>=x.min).at(-1),next=ranks.find(x=>x.min>s.points);$('rank').textContent=rank.icon+' '+rank.name+(next?' · متبقٍ '+(next.min-s.points)+' نقطة للقب التالي':' · اكتمل التحدي!');$('rankBar').style.width=next?((s.points-rank.min)/(next.min-rank.min)*100)+'%':'100%';$('days').innerHTML=plan.map((d,i)=>`<details class="day" ${i===0?'open':''}><summary>${esc(d.name)} · ${esc(d.theme)} (${d.lectures.filter(n=>byId[n]?.watched&&byId[n]?.practiced).length}/${d.lectures.length})</summary>${d.lectures.map(n=>`<div class="lecture"><strong>المحاضرة ${n}</strong><div class="checks"><label><input type="checkbox" data-lecture="${n}" data-kind="watched" ${byId[n]?.watched?'checked':''}> مشاهدة +10</label><label><input type="checkbox" data-lecture="${n}" data-kind="practiced" ${byId[n]?.practiced?'checked':''}> تدريب +10</label></div></div>`).join('')}</details>`).join('');$('days').querySelectorAll('input').forEach(el=>el.onchange=async()=>{el.disabled=true;try{const n=Number(el.dataset.lecture),kind=el.dataset.kind,old=byId[n]||{watched:false,practiced:false};check(await db.from('progress').upsert({student_id:user.id,lecture:n,watched:kind==='watched'?el.checked:old.watched,practiced:kind==='practiced'?el.checked:old.practiced},{onConflict:'student_id,lecture'}));await studentLoad()}catch(x){notice(x.message,true);el.disabled=false;el.checked=!el.checked}});const labels=[['🌱','أول خطوة',s.done>=1],['🔥','مواظب',s.done>=7],['⚡','سريع الإنجاز',s.done>=12],['💎','قريب من القمة',s.done>=18],['🏅','منهي المراحل',s.done>=23],['👑','بطل القدرات',s.points>=460]];$('badges').innerHTML=labels.map(b=>`<div class="badge ${b[2]?'earned':''}"><span>${b[0]}</span>${b[1]}</div>`).join('')}
async function adminLoad(){const p=check(await db.from('profiles').select('id,full_name,email,role').in('role',['student','parent']));students=p.filter(x=>x.role==='student');parents=p.filter(x=>x.role==='parent');links=check(await db.from('parent_student').select('*'));progress=check(await db.from('progress').select('*'));reports=check(await db.from('reports').select('*').order('created_at',{ascending:false}));$('studentCount').textContent=students.length;$('parentCount').textContent=parents.length;$('average').textContent=students.length?Math.round(students.reduce((sum,s)=>sum+stats(progress.filter(x=>x.student_id===s.id)).percent,0)/students.length)+'%':'0%';for(const [id,items] of [['studentSelect',students],['reportStudent',students],['parentSelect',parents]])$(id).innerHTML='<option value="">اختر...</option>'+items.map(x=>`<option value="${x.id}">${esc(x.full_name)} (${esc(x.email)})</option>`).join('');$('adminStudents').innerHTML='<table><thead><tr><th>الطالب</th><th>المكتمل</th><th>النقاط</th><th>الإنجاز</th><th>ولي الأمر</th></tr></thead><tbody>'+students.map(s=>{const a=stats(progress.filter(x=>x.student_id===s.id));const family=links.filter(l=>l.student_id===s.id).map(l=>parents.find(p=>p.id===l.parent_id)?.full_name).filter(Boolean).join('، ');return `<tr><td>${esc(s.full_name)}</td><td>${a.done}/23</td><td>${a.points}</td><td>${a.percent}%</td><td>${esc(family||'غير مربوط')}</td></tr>`}).join('')+'</tbody></table>';$('adminReports').innerHTML=reports.map(reportCard).join('')||'<p class="muted">لا توجد تقارير بعد.</p>';bindEmailButtons()}
$('inviteForm').onsubmit=async e=>{e.preventDefault();try{check(await db.from('invitations').insert({email:$('inviteEmail').value.trim().toLowerCase(),role:$('inviteRole').value}));notice('تم حفظ الدعوة. شارك رابط الموقع مع المستخدم.');$('inviteForm').reset()}catch(x){notice(x.message,true)}};
$('linkForm').onsubmit=async e=>{e.preventDefault();try{check(await db.from('parent_student').insert({parent_id:$('parentSelect').value,student_id:$('studentSelect').value}));await adminLoad();notice('تم الربط بنجاح')}catch(x){notice(x.message,true)}};
$('reportForm').onsubmit=async e=>{e.preventDefault();try{const sid=$('reportStudent').value;const s=stats(progress.filter(x=>x.student_id===sid));check(await db.from('reports').insert({student_id:sid,author_id:user.id,title:$('reportTitle').value.trim(),notes:$('reportNotes').value.trim(),points:s.points,completed:s.done,percent:s.percent}));$('reportNotes').value='';await adminLoad();notice('تم نشر التقرير لولي الأمر المرتبط بالطالب')}catch(x){notice(x.message,true)}};
async function parentLoad(){links=check(await db.from('parent_student').select('*').eq('parent_id',user.id));const ids=links.map(x=>x.student_id);if(!ids.length){$('children').innerHTML='<p class="notice">لم يربط المشرف أي طالب بحسابك بعد.</p>';$('parentReports').innerHTML='';return}students=check(await db.from('profiles').select('id,full_name').in('id',ids));progress=check(await db.from('progress').select('*').in('student_id',ids));reports=check(await db.from('reports').select('*').in('student_id',ids).order('created_at',{ascending:false}));$('children').innerHTML=students.map(s=>{const a=stats(progress.filter(x=>x.student_id===s.id));return `<div class="report"><h3>${esc(s.full_name)}</h3><p>${a.done} من 23 محاضرة · ${a.points} نقطة · ${a.percent}% إنجاز</p><div class="bar"><i style="width:${a.percent}%"></i></div><details><summary>تفاصيل المحاضرات</summary>${plan.flatMap(d=>d.lectures).map(n=>{const x=progress.find(p=>p.student_id===s.id&&p.lecture===n);return `<p>المحاضرة ${n}: مشاهدة ${x?.watched?'✓':'—'} · تدريب ${x?.practiced?'✓':'—'}</p>`}).join('')}</details></div>`}).join('');$('parentReports').innerHTML=reports.map(reportCard).join('')||'<p class="muted">لم ينشر المشرف أي تقرير بعد.</p>'}
function reportCard(r){const student=students.find(s=>s.id===r.student_id);return `<article class="report"><strong>${esc(r.title)}</strong><p class="muted">${esc(student?.full_name||'الطالب')} · ${new Date(r.created_at).toLocaleDateString('ar-SA')}</p><p>${esc(r.notes)}</p><p>المكتمل: ${r.completed}/23 · النقاط: ${r.points} · نسبة الإنجاز: ${r.percent}%</p>${profile.role==='admin'?`<button class="secondary emailReport" data-report="${r.id}">تجهيز رسالة بريد لولي الأمر</button>`:''}</article>`}
function bindEmailButtons(){$('adminReports').querySelectorAll('.emailReport').forEach(b=>b.onclick=()=>{const r=reports.find(x=>x.id===b.dataset.report),s=students.find(x=>x.id===r.student_id),emails=links.filter(x=>x.student_id===r.student_id).map(x=>parents.find(p=>p.id===x.parent_id)?.email).filter(Boolean);if(!emails.length){notice('اربط ولي أمر بالطالب أولًا',true);return}const body=`الطالب: ${s.full_name}\n${r.title}\n${r.notes}\nالمحاضرات المكتملة: ${r.completed}/23\nالنقاط: ${r.points}\nنسبة الإنجاز: ${r.percent}%`;location.href='mailto:'+emails.map(encodeURIComponent).join(',')+'?subject='+encodeURIComponent(r.title)+'&body='+encodeURIComponent(body)})}
if(initDb()){
  const recovering=location.hash.includes('type=recovery')||location.search.includes('type=recovery');
  if(recovering)setAuthMode('reset');
  else loadSession().catch(x=>notice(x.message,true));
}
