const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:8000/api/v1';
const DEFAULT_TEACHER_EMAIL = process.env.TEACHER_EMAIL ?? 'teacher.math@imusum.local';
const DEFAULT_TEACHER_PASSWORD = process.env.TEACHER_PASSWORD ?? 'Test12345!';
const DEFAULT_STUDENT_EMAIL = process.env.STUDENT_EMAIL ?? 'student03@imusum.local';
const DEFAULT_STUDENT_PASSWORD = process.env.STUDENT_PASSWORD ?? 'Test12345!';

type AuthPayload = {
  access_token: string;
};

type TestListItem = {
  id: number;
  subject_id: number;
  class_id: number;
};

type TestOption = {
  id: number;
};

type TestQuestion = {
  id: number;
  options: TestOption[];
};

type TestDetailPayload = {
  questions: TestQuestion[];
};

type TestSubmitPayload = {
  attempt: {
    score_points: number;
    max_points: number;
    percentage: number;
  };
};

type GradePayload = {
  grade_type: string;
  reference_id: number | null;
  grade_value: number;
  max_value: number | null;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function isIntBetween(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, init);
  const raw = await response.text();
  const parsed = raw ? (JSON.parse(raw) as T) : (null as T);

  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path} failed: ${response.status} ${raw}`);
  }

  return parsed;
}

async function login(email: string, password: string): Promise<AuthPayload> {
  return requestJson<AuthPayload>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

async function run() {
  const email = `test_integration_${Date.now()}@example.com`;
  const password = 'StrongPassword123!';

  console.log('1. Registering user...');
  const registerData = await requestJson<AuthPayload>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      first_name: 'Integration',
      last_name: 'Tester',
    }),
  });

  console.log('2. Logging in...');
  await login(email, password);

  console.log('3. Getting profile...');
  await requestJson('/auth/me', {
    headers: { Authorization: `Bearer ${registerData.access_token}` },
  });

  console.log('4. Stability smoke...');
  for (let i = 0; i < 5; i += 1) {
    await requestJson('/auth/me', {
      headers: { Authorization: `Bearer ${registerData.access_token}` },
    });
  }

  console.log('5. Grading smoke (2..10 and max=10 invariants)...');
  const teacherAuth = await login(DEFAULT_TEACHER_EMAIL, DEFAULT_TEACHER_PASSWORD);
  const teacherAuthHeaders = {
    Authorization: `Bearer ${teacherAuth.access_token}`,
  };

  const teacherTests = await requestJson<TestListItem[]>('/tests/my', {
    headers: teacherAuthHeaders,
  });
  assert(Array.isArray(teacherTests) && teacherTests.length > 0, 'Teacher test list is empty; run seed first');

  const template = teacherTests[0];
  assert(Number.isInteger(template.subject_id) && template.subject_id > 0, 'Template test subject_id is invalid');
  assert(Number.isInteger(template.class_id) && template.class_id > 0, 'Template test class_id is invalid');

  const dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const createdTest = await requestJson<{ id: number }>('/tests', {
    method: 'POST',
    headers: { ...teacherAuthHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: `Grading Smoke ${Date.now()}`,
      description: 'Auto-created by integration smoke',
      subject_id: template.subject_id,
      class_id: template.class_id,
      due_date: dueDate,
    }),
  });
  const testId = Number(createdTest.id);
  assert(Number.isInteger(testId) && testId > 0, 'Created test id is invalid');

  await requestJson(`/tests/${testId}/questions`, {
    method: 'POST',
    headers: { ...teacherAuthHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      questions: [
        {
          question_text: 'Smoke question',
          order_index: 1,
          points: 5,
          options: [
            { option_text: 'Option A', order_index: 1, is_correct: false },
            { option_text: 'Option B', order_index: 2, is_correct: true },
            { option_text: 'Option C', order_index: 3, is_correct: false },
            { option_text: 'Option D', order_index: 4, is_correct: false },
          ],
        },
      ],
    }),
  });

  await requestJson(`/tests/${testId}/publish`, {
    method: 'POST',
    headers: teacherAuthHeaders,
  });

  const studentAuth = await login(DEFAULT_STUDENT_EMAIL, DEFAULT_STUDENT_PASSWORD);
  const studentAuthHeaders = {
    Authorization: `Bearer ${studentAuth.access_token}`,
  };

  const studentTests = await requestJson<Array<{ id: number }>>('/tests/my', {
    headers: studentAuthHeaders,
  });
  const visibleToStudent = studentTests.some((item) => item.id === testId);
  assert(visibleToStudent, `Created test ${testId} is not visible to student ${DEFAULT_STUDENT_EMAIL}`);

  const testDetail = await requestJson<TestDetailPayload>(`/tests/${testId}`, {
    headers: studentAuthHeaders,
  });
  assert(Array.isArray(testDetail.questions) && testDetail.questions.length > 0, 'Created test has no questions');

  const answers = testDetail.questions.map((question) => {
    assert(Array.isArray(question.options) && question.options.length > 0, `Question ${question.id} has no options`);
    return {
      question_id: question.id,
      selected_option_id: question.options[0].id,
    };
  });

  const submitPayload = await requestJson<TestSubmitPayload>(`/tests/${testId}/submit`, {
    method: 'POST',
    headers: { ...studentAuthHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });

  const attempt = submitPayload.attempt;
  assert(attempt.max_points === 10, `Expected attempt.max_points=10, got ${attempt.max_points}`);
  assert(isIntBetween(attempt.score_points, 2, 10), `Expected attempt.score_points integer 2..10, got ${attempt.score_points}`);
  assert(
    Number.isFinite(attempt.percentage) && attempt.percentage >= 0 && attempt.percentage <= 100,
    `Expected attempt.percentage in 0..100, got ${attempt.percentage}`
  );

  const grades = await requestJson<GradePayload[]>('/grades/my', {
    headers: studentAuthHeaders,
  });
  const createdTestGrade = grades.find((grade) => grade.grade_type === 'Test' && grade.reference_id === testId);
  assert(createdTestGrade, `Grade row for test ${testId} was not created`);
  assert(createdTestGrade.max_value === 10, `Expected grade.max_value=10, got ${createdTestGrade.max_value}`);
  assert(
    isIntBetween(createdTestGrade.grade_value, 2, 10),
    `Expected grade.grade_value integer 2..10, got ${createdTestGrade.grade_value}`
  );

  console.log('ALL INTEGRATION CHECKS PASSED');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
