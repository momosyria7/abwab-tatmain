const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function run() {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      id, value: '', innerHTML: '', textContent: '', disabled: false,
      style: {}, className: '',
      classList: { toggle() {}, add() {}, remove() {} },
      setAttribute() {},
      querySelectorAll() { return []; }
    });
    return elements.get(id);
  }
  const document = {
    getElementById: element,
    querySelectorAll() { return []; },
    documentElement: { dataset: {} }
  };
  const fakeWindow = {};
  const context = vm.createContext({
    document, window: fakeWindow,
    localStorage: { getItem() { return null; }, setItem() {} },
    location: { origin: 'https://example.test', pathname: '/' },
    console
  });
  const source = fs.readFileSync('app.js', 'utf8');
  vm.runInContext(source, context, { filename: 'app.js' });

  const profiles = [{ id: 'admin', full_name: 'المشرف', email: 'admin@example.test', role: 'admin' }];
  for (let i = 0; i < 900; i++) {
    profiles.push({ id: 's' + String(i).padStart(4, '0'), full_name: 'طالب ' + i, email: 's' + i + '@example.test', role: 'student' });
  }
  for (let i = 0; i < 200; i++) {
    profiles.push({ id: 'p' + String(i).padStart(4, '0'), full_name: 'ولي أمر ' + i, email: 'p' + i + '@example.test', role: 'parent' });
  }
  const parentStudent = Array.from({ length: 900 }, (_, i) => ({
    parent_id: 'p' + String(i % 200).padStart(4, '0'),
    student_id: 's' + String(i).padStart(4, '0')
  }));
  const progress = [];
  for (let i = 0; i < 900; i++) for (let lecture = 4; lecture <= 26; lecture++) {
    progress.push({ student_id: 's' + String(i).padStart(4, '0'), lecture, watched: i === 0, practiced: i === 0 });
  }
  const datasets = {
    profiles,
    parent_student: parentStudent,
    progress,
    invitations: [
      { email: 's0@example.test', role: 'student' },
      { email: 'pending@example.test', role: 'parent' }
    ],
    reports: []
  };
  const calls = {};
  const fakeDB = {
    from(table) {
      assert.ok(Object.hasOwn(datasets, table), 'Unexpected table ' + table);
      const state = { sorts: [] };
      const builder = {
        select() { return builder; },
        order(column, opts) {
          state.sorts.push([column, opts.ascending]);
          return builder;
        },
        range(start, end) {
          calls[table] = (calls[table] || 0) + 1;
          const rows = [...datasets[table]];
          rows.sort((a, b) => {
            for (const [col, asc] of state.sorts) {
              if (a[col] === b[col]) continue;
              return (a[col] < b[col] ? -1 : 1) * (asc ? 1 : -1);
            }
            return 0;
          });
          return Promise.resolve({ data: rows.slice(start, end + 1), error: null });
        },
        limit(count) {
          return Promise.resolve({ data: datasets[table].slice(0, count), error: null });
        }
      };
      return builder;
    }
  };
  context.fakeDB = fakeDB;
  vm.runInContext('db = fakeDB; profile = { role: "admin" }; user = { id: "admin" };', context);
  await vm.runInContext('adminLoad()', context);
  assert.equal(String(element('studentCount').textContent), '900');
  assert.equal(String(element('parentCount').textContent), '200');
  assert.equal(String(element('average').textContent), '0%');
  assert.ok((calls.progress || 0) > 60, '21,000+ progress rows should be read in batches');
  assert.ok(element('adminListInfo').textContent.includes('من 900 طالب'));
  assert.equal((element('adminStudents').innerHTML.match(/<tr>/g) || []).length, 31);
  assert.ok(element('adminInvitations').innerHTML.includes('بانتظار إنشاء الحساب'));
  assert.ok(element('adminInvitations').innerHTML.includes('حساب نشط'));

  element('adminSearch').value = 'طالب 899';
  vm.runInContext('renderAdminStudents()', context);
  assert.ok(element('adminListInfo').textContent.includes('من 1 طالب'));
  assert.ok(element('adminStudents').innerHTML.includes('طالب 899'));

  element('adminSearch').value = '';
  element('adminSort').value = 'high';
  vm.runInContext('renderAdminStudents()', context);
  assert.ok(element('adminStudents').innerHTML.includes('طالب 0'));
  assert.ok(element('adminStudents').innerHTML.includes('460</td>'));
  assert.equal(String(element('average').textContent), '0%', 'One fully completed student among 900 rounds to zero');
  console.log('PASS: 900 students, 200 parents, 20,700 progress rows, pagination, search, sorting, invitations');
}
run().catch(err => { console.error(err); process.exitCode = 1; });
