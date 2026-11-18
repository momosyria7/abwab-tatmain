from pathlib import Path
from html import escape

root = Path(__file__).resolve().parents[1]
out = root / "tests" / "visual-previews"
out.mkdir(exist_ok=True)
source = (root / "index.html").read_text(encoding="utf8")
source = source.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>', '')
source = source.replace('<script src="app.js?v=admin3"></script>', '')
source = source.replace('styles.css?v=design1', '../../styles.css?v=design1')
source = source.replace('id="themeBtn"', 'id="themeBtn"')
source = source.replace('<span id="who"></span>', '<span id="who">حساب تجريبي · مشرف</span>')
source = source.replace('<span id="status" role="status"></span>', '<span id="status" role="status">المعاينة البصرية — بيانات وهمية</span>')

base = source.replace('class="panel hidden auth-shell" id="auth"', 'class="panel auth-shell" id="auth"')
(out / "login.html").write_text(base, encoding="utf8")

view = source.replace('<div id="app" class="hidden">', '<div id="app">')
view = view.replace('id="welcome"></h2>', 'id="welcome">مرحبًا، مستخدم تجريبي</h2>')
view = view.replace('id="roleDescription"></p>', 'id="roleDescription">متابعة الرحلة التعليمية من مكان واحد</p>')
view = view.replace('id="roleMotto"></p>', 'id="roleMotto">كل طالب أمانة، وكل تقدّم مسؤولية.</p>')
for role in ("admin", "student", "parent"):
    html = view.replace(f'id="{role}View" class="hidden"', f'id="{role}View"')
    if role == "admin":
        html = html.replace('id="studentCount">0</strong>', 'id="studentCount">900</strong>')
        html = html.replace('id="parentCount">0</strong>', 'id="parentCount">200</strong>')
        html = html.replace('id="average">0%</strong>', 'id="average">64%</strong>')
        html = html.replace('id="adminListInfo" class="muted" aria-live="polite"></p>', 'id="adminListInfo" class="muted" aria-live="polite">عرض 1–30 من 900 طالب · صفحة 1 من 30</p>')
        rows = ''.join(f'<tr><td>طالب تجريبي {i}</td><td>{i % 20}/23</td><td>{i*10}</td><td>{i*4}%</td><td>ولي أمر تجريبي</td></tr>' for i in range(1, 11))
        html = html.replace('<div id="adminStudents" class="scroll"></div>', '<div id="adminStudents" class="scroll"><table><thead><tr><th>الطالب</th><th>المكتمل</th><th>النقاط</th><th>الإنجاز</th><th>ولي الأمر</th></tr></thead><tbody>' + rows + '</tbody></table></div>')
        html = html.replace('<div id="adminInvitations" class="scroll" aria-live="polite"></div>', '<div id="adminInvitations" class="scroll" aria-live="polite"><p class="muted">عدد الدعوات: 2</p><table><thead><tr><th>البريد</th><th>الدور</th><th>الحالة</th></tr></thead><tbody><tr><td>student@example.test</td><td>طالب</td><td>حساب نشط</td></tr><tr><td>family@example.test</td><td>ولي أمر</td><td>بانتظار إنشاء الحساب</td></tr></tbody></table></div>')
        html = html.replace('<div id="adminReports" class="card-list"></div>', '<div id="adminReports" class="card-list"><article class="report"><strong>التقرير الأسبوعي</strong><p>طالب تجريبي · متابعة الإنجاز والتوصيات</p></article></div>')
        html = html.replace('<select id="parentSelect" required></select>', '<select id="parentSelect" required><option>ولي أمر تجريبي</option></select>')
        html = html.replace('<select id="studentSelect" required></select>', '<select id="studentSelect" required><option>طالب تجريبي</option></select>')
        html = html.replace('<select id="reportStudent" required></select>', '<select id="reportStudent" required><option>طالب تجريبي</option></select>')
    elif role == "student":
        html = html.replace('id="points">0</strong>', 'id="points">260</strong>').replace('id="done">0 / 23</strong>', 'id="done">13 / 23</strong>').replace('id="percent">0%</strong>', 'id="percent">57%</strong>')
        html = html.replace('id="rank"></p>', 'id="rank">🥇 خبير التحدّي</p>')
        html = html.replace('id="rankBar"></i>', 'id="rankBar" style="width:30%"></i>').replace('id="overallBar"></i>', 'id="overallBar" style="width:57%"></i>')
        html = html.replace('id="overallText"></p>', 'id="overallText">26 من 46 مهمة</p>')
        html = html.replace('<div id="days"></div>', '<div id="days"><details class="day" open><summary>المرحلة الأولى · بوابة الانطلاق (3/4)</summary><div class="lecture"><strong>المحاضرة 4</strong><div class="checks"><label><input type="checkbox" checked> مشاهدة +10</label><label><input type="checkbox" checked> تدريب +10</label></div></div><div class="lecture"><strong>المحاضرة 5</strong><div class="checks"><label><input type="checkbox" checked> مشاهدة +10</label><label><input type="checkbox"> تدريب +10</label></div></div></details><details class="day"><summary>المرحلة الثانية · ميدان التركيز</summary></details></div>')
        html = html.replace('<div id="badges" class="badges"></div>', '<div id="badges" class="badges"><div class="badge earned"><span>🌱</span>أول خطوة</div><div class="badge earned"><span>🔥</span>مواظب</div><div class="badge earned"><span>⚡</span>سريع الإنجاز</div><div class="badge"><span>💎</span>قريب من القمة</div></div>')
    elif role == "parent":
        html = html.replace('<div id="children"></div>', '<div id="children"><article class="report"><h3>طالب تجريبي</h3><p>13 من 23 محاضرة · 260 نقطة · 57% إنجاز</p><div class="bar"><i style="width:57%"></i></div></article></div>')
        html = html.replace('<div id="parentReports" class="card-list"></div>', '<div id="parentReports" class="card-list"><article class="report"><strong>التقرير الأسبوعي</strong><p>التقدم ملحوظ، ونوصي بالمحافظة على التمارين.</p></article></div>')
    (out / f"{role}.html").write_text(html, encoding="utf8")
    assert f'id="{role}View"' in html
print("Built four fake-data HTML previews.")
