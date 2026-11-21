'use strict';
const $=id=>document.getElementById(id), plan=[{name:'المرحلة الأولى',theme:'بوابة الانطلاق',lectures:[4,5,6,7]},{name:'المرحلة الثانية',theme:'ميدان التركيز',lectures:[8,9,10]},{name:'المرحلة الثالثة',theme:'وادي المهارة',lectures:[11,12,13]},{name:'المرحلة الرابعة',theme:'قلعة التحدّي',lectures:[14,15,16]},{name:'المرحلة الخامسة',theme:'قمة الإتقان',lectures:[17,18,19]},{name:'المرحلة السادسة',theme:'طريق الأبطال',lectures:[20,21,22]},{name:'المرحلة السابعة',theme:'بوابة الكنز',lectures:[23,24,25,26]}];
const ranks=[{min:0,name:'متدرّب القدرات',icon:'🌟'},{min:60,name:'جامع النقاط',icon:'🥉'},{min:140,name:'منافس قوي',icon:'🥈'},{min:240,name:'خبير التحدّي',icon:'🥇'},{min:360,name:'أسطورة الكمي',icon:'👑'},{min:460,name:'بطل القدرات',icon:'🏆'}];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let db=null,user=null,profile=null,students=[],parents=[],links=[],progress=[],reports=[],adminRows=[],adminPage=0;
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
$('logout').onclick=async()=>{await db.auth.signOut();user=null;profile=null;show('app',false);show('accountView',false);show('accountShortcut',false);show('auth');show('logout',false);$('who').textContent='';notice('تم تسجيل الخروج')};
$('refresh').onclick=()=>refresh();
async function loadSession(){const {data:{user:u},error}=await db.auth.getUser();if(error||!u){show('auth');return}user=u;const p=check(await db.from('profiles').select('*').eq('id',u.id).maybeSingle());if(!p){notice('الحساب غير مخوّل. اطلب دعوة من المشرف.',true);await db.auth.signOut();return}profile=p;renderAccount();show('auth',false);show('accountView',false);show('app');show('accountShortcut');show('logout');$('who').textContent=p.full_name+' · '+({admin:'مشرف',student:'طالب',parent:'ولي أمر'}[p.role]||p.role);$('welcome').textContent='مرحبًا، '+p.full_name;$('roleDescription').textContent={admin:'إدارة الطلاب والتقارير والروابط الأسرية',student:'أنت وحدك من يعتمد إكمال المهام',parent:'اطلع على إنجازات أبنائك وتقارير المشرف'}[p.role];$('roleMotto').textContent={admin:'كل طالب أمانة، وكل تقدّم مسؤولية.',student:'إنجاز اليوم هو بداية نجاح الغد.',parent:'كن قريبًا من إنجازاته، وشريكًا في نجاحه.'}[p.role];['studentView','adminView','parentView'].forEach(id=>show(id,id===p.role+'View'));await refresh()}
function renderAccount(){
  $('accountName').textContent=profile?.full_name||'—';
  $('accountEmail').textContent=user?.email||'—';
  $('accountRole').textContent=({admin:'مشرف',student:'طالب',parent:'ولي أمر'}[profile?.role]||'—');
  $('accountShortcutName').textContent=profile?.full_name||'حسابي';
}
function openAccount(){
  show('app',false);
  show('accountView',true);
  window.scrollTo({top:0,behavior:'smooth'});
}
function closeAccount(){
  show('accountView',false);
  show('app',true);
  window.scrollTo({top:0,behavior:'smooth'});
}
$('accountShortcut').onclick=openAccount;
$('accountBack').onclick=closeAccount;

  $('accountName').textContent=profile?.full_name||'—';
  $('accountEmail').textContent=user?.email||'—';
  $('accountRole').textContent=({admin:'مشرف',student:'طالب',parent:'ولي أمر'}[profile?.role]||'—');
}
$('changePasswordForm').onsubmit=async e=>{
  e.preventDefault();
  const password=$('accountNewPassword').value;
  if(password.length<8){notice('كلمة المرور يجب ألا تقل عن 8 أحرف.',true);return}
  if(password!==$('accountConfirmPassword').value){notice('كلمتا المرور غير متطابقتين.',true);return}
  const button=$('changePasswordForm').querySelector('button[type="submit"]');
  button.disabled=true;
  try{
    check(await db.auth.updateUser({password}));
    $('changePasswordForm').reset();
    notice('تم تحديث كلمة المرور بنجاح.');
  }catch(x){notice('تعذر تحديث كلمة المرور: '+x.message,true)}
  finally{button.disabled=false}
};
async function refresh(){if(!profile)return;try{notice('جارٍ تحديث البيانات...');if(profile.role==='student')await studentLoad();if(profile.role==='admin')await adminLoad();if(profile.role==='parent')await parentLoad();notice('البيانات محدّثة')}catch(x){notice('تعذر تحديث البيانات: '+x.message,true)}}
const stats=rows=>{const tasks=rows.filter(x=>x.watched||x.practiced).reduce((a,x)=>a+Number(x.watched)+Number(x.practiced),0),done=rows.filter(x=>x.watched&&x.practiced).length;return {tasks,done,points:tasks*10,percent:Math.round(tasks/46*100)}};
async function studentLoad(){progress=check(await db.from('progress').select('*').eq('student_id',user.id));renderStudent()}
function renderStudent(){const byId=Object.fromEntries(progress.map(x=>[x.lecture,x]));const s=stats(progress);$('points').textContent=s.points;$('done').textContent=s.done+' / 23';$('percent').textContent=s.percent+'%';$('overallText').textContent=s.tasks+' من 46 مهمة';$('overallBar').style.width=s.percent+'%';const rank=ranks.filter(x=>s.points>=x.min).at(-1),next=ranks.find(x=>x.min>s.points);$('rank').textContent=rank.icon+' '+rank.name+(next?' · متبقٍ '+(next.min-s.points)+' نقطة للقب التالي':' · اكتمل التحدي!');$('rankBar').style.width=next?((s.points-rank.min)/(next.min-rank.min)*100)+'%':'100%';$('days').innerHTML=plan.map((d,i)=>`<details class="day" ${i===0?'open':''}><summary>${esc(d.name)} · ${esc(d.theme)} (${d.lectures.filter(n=>byId[n]?.watched&&byId[n]?.practiced).length}/${d.lectures.length})</summary>${d.lectures.map(n=>`<div class="lecture"><strong>المحاضرة ${n}</strong><div class="checks"><label><input type="checkbox" data-lecture="${n}" data-kind="watched" ${byId[n]?.watched?'checked':''}> مشاهدة +10</label><label><input type="checkbox" data-lecture="${n}" data-kind="practiced" ${byId[n]?.practiced?'checked':''}> تدريب +10</label></div></div>`).join('')}</details>`).join('');$('days').querySelectorAll('input').forEach(el=>el.onchange=async()=>{el.disabled=true;try{const n=Number(el.dataset.lecture),kind=el.dataset.kind,old=byId[n]||{watched:false,practiced:false};check(await db.from('progress').upsert({student_id:user.id,lecture:n,watched:kind==='watched'?el.checked:old.watched,practiced:kind==='practiced'?el.checked:old.practiced},{onConflict:'student_id,lecture'}));await studentLoad()}catch(x){notice(x.message,true);el.disabled=false;el.checked=!el.checked}});const labels=[['🌱','أول خطوة',s.done>=1],['🔥','مواظب',s.done>=7],['⚡','سريع الإنجاز',s.done>=12],['💎','قريب من القمة',s.done>=18],['🏅','منهي المراحل',s.done>=23],['👑','بطل القدرات',s.points>=460]];$('badges').innerHTML=labels.map(b=>`<div class="badge ${b[2]?'earned':''}"><span>${b[0]}</span>${b[1]}</div>`).join('')}
async function getPages(table,fields,sorts){
  let rows=[];
  const size=300;
  for(let offset=0;offset<30000;offset+=size){
    let req=db.from(table).select(fields);
    for(const [column,ascending] of sorts)req=req.order(column,{ascending});
    const page=check(await req.range(offset,offset+size-1));
    rows.push(...page);
    if(page.length<size)return rows;
  }
  throw new Error('تجاوز عدد السجلات حد التحميل الآمن.');
}
function renderAdminStudents(){
  const search=$('adminSearch').value.trim().toLocaleLowerCase();
  const sorting=$('adminSort').value;
  const filtered=adminRows.filter(x=>[x.student.full_name,x.student.email,x.family].some(v=>(v||'').toLocaleLowerCase().includes(search)));
  filtered.sort((a,b)=>sorting==='high'?b.summary.percent-a.summary.percent||a.student.full_name.localeCompare(b.student.full_name,'ar'):sorting==='low'?a.summary.percent-b.summary.percent||a.student.full_name.localeCompare(b.student.full_name,'ar'):a.student.full_name.localeCompare(b.student.full_name,'ar'));
  const size=30,pages=Math.max(1,Math.ceil(filtered.length/size));
  adminPage=Math.min(Math.max(adminPage,0),pages-1);
  const showRows=filtered.slice(adminPage*size,(adminPage+1)*size);
  $('adminStudents').innerHTML='<table><thead><tr><th>الطالب</th><th>المكتمل</th><th>النقاط</th><th>الإنجاز</th><th>ولي الأمر</th></tr></thead><tbody>'+showRows.map(x=>`<tr><td>${esc(x.student.full_name)}</td><td>${x.summary.done}/23</td><td>${x.summary.points}</td><td>${x.summary.percent}%</td><td>${esc(x.family||'غير مربوط')}</td></tr>`).join('')+'</tbody></table>'+(showRows.length?'':'<p class="muted">لا توجد نتائج.</p>');
  $('adminListInfo').textContent=`عرض ${showRows.length?adminPage*size+1:0}–${Math.min(filtered.length,(adminPage+1)*size)} من ${filtered.length} طالب · صفحة ${adminPage+1} من ${pages}`;
  $('adminPrev').disabled=adminPage===0;
  $('adminNext').disabled=adminPage>=pages-1;
}
async function adminLoad(){
  const result=await Promise.all([
    getPages('profiles','id,full_name,email,role',[['id',true]]),
    getPages('parent_student','parent_id,student_id',[['parent_id',true],['student_id',true]]),
    getPages('progress','student_id,lecture,watched,practiced',[['student_id',true],['lecture',true]]),
    getPages('invitations','email,role',[['email',true]]),
    db.from('reports').select('*').order('created_at',{ascending:false}).limit(100)
  ]);
  const all=result[0],invited=result[3];
  students=all.filter(x=>x.role==='student');
  parents=all.filter(x=>x.role==='parent');
  links=result[1];progress=result[2];reports=check(result[4]);
  const profilesById=new Map(all.map(x=>[x.id,x]));
  const summaries=new Map(),families=new Map();
  for(const x of progress){
    let s=summaries.get(x.student_id);
    if(!s){s={tasks:0,done:0,points:0,percent:0};summaries.set(x.student_id,s)}
    s.tasks+=Number(!!x.watched)+Number(!!x.practiced);
    if(x.watched&&x.practiced)s.done++;
  }
  for(const s of summaries.values()){s.points=s.tasks*10;s.percent=Math.round(s.tasks/46*100)}
  for(const link of links){
    const parent=profilesById.get(link.parent_id);
    if(parent)families.set(link.student_id,[...(families.get(link.student_id)||[]),parent.full_name]);
  }
  adminRows=students.map(student=>({student,summary:summaries.get(student.id)||{tasks:0,done:0,points:0,percent:0},family:(families.get(student.id)||[]).join('، ')}));
  $('studentCount').textContent=students.length;
  $('parentCount').textContent=parents.length;
  $('average').textContent=students.length?Math.round(adminRows.reduce((s,x)=>s+x.summary.percent,0)/students.length)+'%':'0%';
  for(const [id,people] of [['studentSelect',students],['reportStudent',students],['parentSelect',parents]]){
    const prev=$(id).value;
    $(id).innerHTML='<option value="">اختر...</option>'+people.map(x=>`<option value="${x.id}">${esc(x.full_name)} (${esc(x.email)})</option>`).join('');
    if(people.some(x=>x.id===prev))$(id).value=prev;
  }
  renderAdminStudents();
  const active=new Set(all.map(x=>(x.email||'').trim().toLowerCase()));
  $('adminInvitations').innerHTML='<p class="muted">عدد الدعوات: '+invited.length+'</p><div class="scroll"><table><thead><tr><th>البريد الإلكتروني</th><th>الدور</th><th>الحالة</th></tr></thead><tbody>'+invited.slice(0,100).map(x=>`<tr><td dir="ltr">${esc(x.email)}</td><td>${x.role==='parent'?'ولي أمر':'طالب'}</td><td>${active.has(x.email)?'حساب نشط':'بانتظار إنشاء الحساب'}</td></tr>`).join('')+'</tbody></table></div>'+(invited.length>100?'<p class="muted">تُعرض أول 100 دعوة حسب البريد.</p>':'');
  $('adminReports').innerHTML=reports.map(reportCard).join('')||'<p class="muted">لا توجد تقارير بعد.</p>';
  bindEmailButtons();
}

$('adminSearch').oninput=()=>{adminPage=0;renderAdminStudents()};
$('adminSort').onchange=()=>{adminPage=0;renderAdminStudents()};
$('adminPrev').onclick=()=>{adminPage--;renderAdminStudents()};
$('adminNext').onclick=()=>{adminPage++;renderAdminStudents()};
$('inviteForm').onsubmit=async e=>{e.preventDefault();try{check(await db.from('invitations').insert({email:$('inviteEmail').value.trim().toLowerCase(),role:$('inviteRole').value}));notice('تم حفظ الدعوة. شارك رابط الموقع مع المستخدم.');$('inviteForm').reset()}catch(x){notice(x.message,true)}};
$('linkForm').onsubmit=async e=>{e.preventDefault();try{check(await db.from('parent_student').insert({parent_id:$('parentSelect').value,student_id:$('studentSelect').value}));await adminLoad();notice('تم الربط بنجاح')}catch(x){notice(x.message,true)}};
$('reportForm').onsubmit=async e=>{e.preventDefault();try{const sid=$('reportStudent').value;const s=stats(progress.filter(x=>x.student_id===sid));check(await db.from('reports').insert({student_id:sid,author_id:user.id,title:$('reportTitle').value.trim(),notes:$('reportNotes').value.trim(),points:s.points,completed:s.done,percent:s.percent}));$('reportNotes').value='';await adminLoad();notice('تم نشر التقرير لولي الأمر المرتبط بالطالب')}catch(x){notice(x.message,true)}};
async function parentLoad(){
  links=check(await db.from('parent_student').select('*').eq('parent_id',user.id));
  const ids=links.map(x=>x.student_id);
  const filter=$('parentChildFilter');
  if(!ids.length){
    students=[];progress=[];reports=[];
    $('parentChildrenCount').textContent='0';$('parentAverage').textContent='0%';$('parentTasks').textContent='0';
    filter.innerHTML='<option value="all">جميع الأبناء</option>';
    $('children').innerHTML='<p class="notice">لم يربط المشرف أي طالب بحسابك بعد. تواصل مع المشرف لإتمام الربط.</p>';
    $('parentReports').innerHTML='<p class="muted">ستظهر التقارير هنا بعد ربط حسابك بطالب ونشر تقرير له.</p>';
    return;
  }
  students=check(await db.from('profiles').select('id,full_name').in('id',ids));
  progress=check(await db.from('progress').select('*').in('student_id',ids));
  reports=check(await db.from('reports').select('*').in('student_id',ids).order('created_at',{ascending:false}));
  const previous=filter.value;
  filter.innerHTML='<option value="all">جميع الأبناء</option>'+students.map(s=>`<option value="${s.id}">${esc(s.full_name)}</option>`).join('');
  if(ids.includes(previous))filter.value=previous;
  const summaries=students.map(s=>stats(progress.filter(x=>x.student_id===s.id)));
  const totalTasks=summaries.reduce((n,s)=>n+s.tasks,0);
  const average=summaries.length?Math.round(summaries.reduce((n,s)=>n+s.percent,0)/summaries.length):0;
  $('parentChildrenCount').textContent=students.length;
  $('parentAverage').textContent=average+'%';
  $('parentTasks').textContent=totalTasks;
  renderParentChildren();
  renderParentReports();
}
function renderParentReports(){
  const selected=$('parentChildFilter').value;
  const visible=selected==='all'?reports:reports.filter(r=>r.student_id===selected);
  $('parentReports').innerHTML=visible.map(reportCard).join('')||'<p class="muted">لا توجد تقارير منشورة لهذا الاختيار حتى الآن.</p>';
}
function renderParentChildren(){
  const selected=$('parentChildFilter').value;
  const visible=selected==='all'?students:students.filter(s=>s.id===selected);
  $('children').innerHTML=visible.map(s=>{
    const rows=progress.filter(x=>x.student_id===s.id),a=stats(rows);
    const stages=plan.map(d=>{
      const count=d.lectures.filter(n=>{const x=rows.find(p=>p.lecture===n);return !!(x?.watched&&x?.practiced)}).length;
      return `<div class="stage-progress"><div><span>${esc(d.name)}</span><strong>${count}/${d.lectures.length}</strong></div><div class="bar"><i style="width:${Math.round(count/d.lectures.length*100)}%"></i></div></div>`;
    }).join('');
    const lastReport=reports.find(r=>r.student_id===s.id);
    return `<article class="child-card"><div class="child-card-top"><div><span class="eyebrow">ملف الطالب</span><h3>${esc(s.full_name)}</h3></div><span class="child-percent">${a.percent}%</span></div><div class="child-metrics"><div><strong>${a.done}/23</strong><span>محاضرة مكتملة</span></div><div><strong>${a.points}</strong><span>نقطة</span></div><div><strong>${a.tasks}/46</strong><span>مهمة منجزة</span></div></div><div class="bar child-main-bar"><i style="width:${a.percent}%"></i></div><h4>التقدم حسب المرحلة</h4><div class="stage-list">${stages}</div><p class="muted child-last-report">${lastReport?'آخر تقرير: '+new Date(lastReport.created_at).toLocaleDateString('ar-SA'):'لا يوجد تقرير منشور بعد'}</p></article>`;
  }).join('')||'<p class="muted">لا توجد بيانات للعرض.</p>';
}
$('parentChildFilter').onchange=()=>{renderParentChildren();renderParentReports()};
function reportCard(r){const student=students.find(s=>s.id===r.student_id);return `<article class="report"><strong>${esc(r.title)}</strong><p class="muted">${esc(student?.full_name||'الطالب')} · ${new Date(r.created_at).toLocaleDateString('ar-SA')}</p><p>${esc(r.notes)}</p><p>المكتمل: ${r.completed}/23 · النقاط: ${r.points} · نسبة الإنجاز: ${r.percent}%</p>${profile.role==='admin'?`<button class="secondary emailReport" data-report="${r.id}">تجهيز رسالة بريد لولي الأمر</button>`:''}</article>`}
function bindEmailButtons(){$('adminReports').querySelectorAll('.emailReport').forEach(b=>b.onclick=()=>{const r=reports.find(x=>x.id===b.dataset.report),s=students.find(x=>x.id===r.student_id),emails=links.filter(x=>x.student_id===r.student_id).map(x=>parents.find(p=>p.id===x.parent_id)?.email).filter(Boolean);if(!emails.length){notice('اربط ولي أمر بالطالب أولًا',true);return}const body=`الطالب: ${s.full_name}\n${r.title}\n${r.notes}\nالمحاضرات المكتملة: ${r.completed}/23\nالنقاط: ${r.points}\nنسبة الإنجاز: ${r.percent}%`;location.href='mailto:'+emails.map(encodeURIComponent).join(',')+'?subject='+encodeURIComponent(r.title)+'&body='+encodeURIComponent(body)})}
if(initDb()){
  const recovering=location.hash.includes('type=recovery')||location.search.includes('type=recovery');
  if(recovering)setAuthMode('reset');
  else loadSession().catch(x=>notice(x.message,true));
}
