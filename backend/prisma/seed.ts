import bcrypt from 'bcrypt';
import { DayOfWeek, Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NOW = new Date('2026-02-07T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;
const TEST_PASSWORD = 'Test12345!';
const REQUIRED_TABLES = [
  'users',
  'schools',
  'classes',
  'student_profiles',
  'teacher_profiles',
  'subjects',
  'teacher_subjects',
  'schedules',
  'assignments',
  'assignment_submissions',
  'grades',
  'tests',
  'test_questions',
  'test_options',
  'test_attempts',
  'test_answers',
  'chat_channels',
  'chat_messages',
  'chat_channel_reads',
  'blog_posts',
  'learning_materials',
  'offers',
  'purchases',
  'password_reset_tokens',
] as const;

function daysFromNow(days: number): Date {
  return new Date(NOW.getTime() + days * DAY);
}

function timeAt(hours: number, minutes: number): Date {
  const date = new Date('1970-01-01T00:00:00.000Z');
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}

type CoreSeed = {
  schoolId: number;
  classIds: [number, number];
  subjectIds: {
    math: number;
    physics: number;
    english: number;
    history: number;
  };
};

type UsersSeed = {
  adminUserId: number;
  directorUserId: number;
  teacherUserIds: [number, number, number];
  teacherProfileIds: [number, number, number];
  studentUserIds: number[];
  studentProfileIds: number[];
};

type AssignmentSeed = {
  assignmentIds: [number, number, number, number];
};

type TestSeed = {
  testIds: [number, number];
};

type OffersSeed = {
  offerIds: number[];
  purchaseIds: number[];
};

type MaterialsSeed = {
  materialIds: number[];
};

async function resetDatabase(): Promise<void> {
  const safeDelete = async (label: string, action: () => Promise<unknown>) => {
    try {
      await action();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
        console.warn(`Skipping reset for ${label}: table does not exist in current DB.`);
        return;
      }
      throw error;
    }
  };

  await safeDelete('test_answers', () => prisma.testAnswer.deleteMany());
  await safeDelete('test_attempts', () => prisma.testAttempt.deleteMany());
  await safeDelete('test_options', () => prisma.testOption.deleteMany());
  await safeDelete('test_questions', () => prisma.testQuestion.deleteMany());
  await safeDelete('tests', () => prisma.test.deleteMany());
  await safeDelete('chat_channel_reads', () => prisma.chatChannelRead.deleteMany());
  await safeDelete('chat_messages', () => prisma.chatMessage.deleteMany());
  await safeDelete('chat_channels', () => prisma.chatChannel.deleteMany());
  await safeDelete('assignment_submissions', () => prisma.assignmentSubmission.deleteMany());
  await safeDelete('grades', () => prisma.grade.deleteMany());
  await safeDelete('assignments', () => prisma.assignment.deleteMany());
  await safeDelete('schedules', () => prisma.schedule.deleteMany());
  await safeDelete('teacher_subjects', () => prisma.teacherSubject.deleteMany());
  await safeDelete('purchases', () => prisma.purchase.deleteMany());
  await safeDelete('offers', () => prisma.offer.deleteMany());
  await safeDelete('learning_materials', () => prisma.learningMaterial.deleteMany());
  await safeDelete('partners', () => prisma.partner.deleteMany());
  await safeDelete('blog_posts', () => prisma.blogPost.deleteMany());
  await safeDelete('password_reset_tokens', () => prisma.passwordResetToken.deleteMany());
  await safeDelete('student_profiles', () => prisma.studentProfile.deleteMany());
  await safeDelete('teacher_profiles', () => prisma.teacherProfile.deleteMany());
  await safeDelete('subjects', () => prisma.subject.deleteMany());
  await safeDelete('classes', () => prisma.class.deleteMany());
  await safeDelete('users', () => prisma.user.deleteMany());
  await safeDelete('schools', () => prisma.school.deleteMany());
}

async function assertRequiredTablesExist(): Promise<void> {
  const existingRows = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  `;

  const existingSet = new Set(existingRows.map((row) => row.tablename));
  const missing = REQUIRED_TABLES.filter((table) => !existingSet.has(table));

  if (missing.length > 0) {
    throw new Error(
      [
        'Database schema is outdated for this seed.',
        `Missing tables: ${missing.join(', ')}`,
        'Run migrations first:',
        '- npm run db:reset:seed',
        'or',
        '- npx prisma migrate deploy && npm run prisma:seed',
      ].join('\n')
    );
  }
}

async function seedCoreStructure(): Promise<CoreSeed> {
  const school = await prisma.school.create({
    data: {
      name: 'ImUsum Central School',
      address: '12 Learning Ave, Yerevan',
      latitude: 40.1772,
      longitude: 44.5035,
      phone: '+37410000111',
      created_at: NOW,
      updated_at: NOW,
    },
  });

  const classA = await prisma.class.create({
    data: {
      name: '10-A',
      grade_level: 10,
      school_id: school.id,
      created_at: NOW,
      updated_at: NOW,
    },
  });

  const classB = await prisma.class.create({
    data: {
      name: '10-B',
      grade_level: 10,
      school_id: school.id,
      created_at: NOW,
      updated_at: NOW,
    },
  });

  const [math, physics, english, history] = await Promise.all([
    prisma.subject.create({
      data: {
        name: 'Mathematics',
        code: 'MATH-10',
        description: 'Algebra and geometry',
        created_at: NOW,
        updated_at: NOW,
      },
    }),
    prisma.subject.create({
      data: {
        name: 'Physics',
        code: 'PHYS-10',
        description: 'Mechanics fundamentals',
        created_at: NOW,
        updated_at: NOW,
      },
    }),
    prisma.subject.create({
      data: {
        name: 'English',
        code: 'ENG-10',
        description: 'Language and literature',
        created_at: NOW,
        updated_at: NOW,
      },
    }),
    prisma.subject.create({
      data: {
        name: 'History',
        code: 'HIST-10',
        description: 'Modern history',
        created_at: NOW,
        updated_at: NOW,
      },
    }),
  ]);

  await prisma.chatChannel.createMany({
    data: [
      {
        key: `staff:${school.id}`,
        type: 'staff',
        school_id: school.id,
        class_id: null,
        title: 'Ուսուցիչների ալիք',
        created_at: NOW,
        updated_at: NOW,
      },
      {
        key: `class:${classA.id}`,
        type: 'class',
        school_id: school.id,
        class_id: classA.id,
        title: `Դասարան ${classA.name}`,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        key: `class:${classB.id}`,
        type: 'class',
        school_id: school.id,
        class_id: classB.id,
        title: `Դասարան ${classB.name}`,
        created_at: NOW,
        updated_at: NOW,
      },
    ],
    skipDuplicates: true,
  });

  return {
    schoolId: school.id,
    classIds: [classA.id, classB.id],
    subjectIds: {
      math: math.id,
      physics: physics.id,
      english: english.id,
      history: history.id,
    },
  };
}

async function seedUsersAndProfiles(core: CoreSeed): Promise<UsersSeed> {
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@imusum.local',
      hashed_password: hashedPassword,
      first_name: 'System',
      last_name: 'Admin',
      role: 'admin',
      is_active: true,
      is_verified: true,
      token_version: 0,
      school_id: core.schoolId,
      created_at: NOW,
      updated_at: NOW,
    },
  });

  const director = await prisma.user.create({
    data: {
      email: 'director@imusum.local',
      hashed_password: hashedPassword,
      first_name: 'School',
      last_name: 'Director',
      role: 'director',
      is_active: true,
      is_verified: true,
      token_version: 0,
      school_id: core.schoolId,
      created_at: NOW,
      updated_at: NOW,
    },
  });

  const teacherUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'teacher.math@imusum.local',
        hashed_password: hashedPassword,
        first_name: 'Anna',
        last_name: 'Mkrtchyan',
        role: 'teacher',
        is_active: true,
        is_verified: true,
        token_version: 0,
        school_id: core.schoolId,
        created_at: NOW,
        updated_at: NOW,
      },
    }),
    prisma.user.create({
      data: {
        email: 'teacher.physics@imusum.local',
        hashed_password: hashedPassword,
        first_name: 'Aram',
        last_name: 'Sargsyan',
        role: 'teacher',
        is_active: true,
        is_verified: true,
        token_version: 0,
        school_id: core.schoolId,
        created_at: NOW,
        updated_at: NOW,
      },
    }),
    prisma.user.create({
      data: {
        email: 'teacher.humanities@imusum.local',
        hashed_password: hashedPassword,
        first_name: 'Mariam',
        last_name: 'Petrosyan',
        role: 'teacher',
        is_active: true,
        is_verified: true,
        token_version: 0,
        school_id: core.schoolId,
        created_at: NOW,
        updated_at: NOW,
      },
    }),
  ]);

  const teacherProfiles = await Promise.all([
    prisma.teacherProfile.create({
      data: {
        user_id: teacherUsers[0].id,
        employee_id: 'TCH-001',
        department: 'STEM',
        created_at: NOW,
        updated_at: NOW,
      },
    }),
    prisma.teacherProfile.create({
      data: {
        user_id: teacherUsers[1].id,
        employee_id: 'TCH-002',
        department: 'STEM',
        created_at: NOW,
        updated_at: NOW,
      },
    }),
    prisma.teacherProfile.create({
      data: {
        user_id: teacherUsers[2].id,
        employee_id: 'TCH-003',
        department: 'Humanities',
        created_at: NOW,
        updated_at: NOW,
      },
    }),
  ]);

  await prisma.teacherSubject.createMany({
    data: [
      { teacher_id: teacherProfiles[0].id, subject_id: core.subjectIds.math },
      { teacher_id: teacherProfiles[1].id, subject_id: core.subjectIds.physics },
      { teacher_id: teacherProfiles[2].id, subject_id: core.subjectIds.english },
      { teacher_id: teacherProfiles[2].id, subject_id: core.subjectIds.history },
    ],
    skipDuplicates: true,
  });

  const studentUsers = await Promise.all(
    Array.from({ length: 12 }, (_, index) => {
      const n = index + 1;
      return prisma.user.create({
        data: {
          email: `student${n.toString().padStart(2, '0')}@imusum.local`,
          hashed_password: hashedPassword,
          first_name: `Student${n}`,
          last_name: 'User',
          role: 'student',
          is_active: true,
          is_verified: true,
          token_version: 0,
          school_id: core.schoolId,
          created_at: NOW,
          updated_at: NOW,
        },
      });
    })
  );

  const studentProfiles = await Promise.all(
    studentUsers.map((studentUser, index) => {
      const classId = index < 6 ? core.classIds[0] : core.classIds[1];
      return prisma.studentProfile.create({
        data: {
          user_id: studentUser.id,
          class_id: classId,
          student_id_number: `STD-${(index + 1).toString().padStart(4, '0')}`,
          gpa: 2.8 + (index % 5) * 0.25,
          bonus_points: 120 + (index % 4) * 35,
          created_at: NOW,
          updated_at: NOW,
        },
      });
    })
  );

  return {
    adminUserId: admin.id,
    directorUserId: director.id,
    teacherUserIds: [teacherUsers[0].id, teacherUsers[1].id, teacherUsers[2].id],
    teacherProfileIds: [teacherProfiles[0].id, teacherProfiles[1].id, teacherProfiles[2].id],
    studentUserIds: studentUsers.map((item) => item.id),
    studentProfileIds: studentProfiles.map((item) => item.id),
  };
}

async function seedSchedules(core: CoreSeed, users: UsersSeed): Promise<void> {
  const dayMappings: Array<{ day: DayOfWeek; classId: number; subjectId: number; teacherId: number; room: string }> = [
    { day: DayOfWeek.MONDAY, classId: core.classIds[0], subjectId: core.subjectIds.math, teacherId: users.teacherProfileIds[0], room: '201' },
    {
      day: DayOfWeek.TUESDAY,
      classId: core.classIds[0],
      subjectId: core.subjectIds.physics,
      teacherId: users.teacherProfileIds[1],
      room: '202',
    },
    {
      day: DayOfWeek.WEDNESDAY,
      classId: core.classIds[0],
      subjectId: core.subjectIds.english,
      teacherId: users.teacherProfileIds[2],
      room: '105',
    },
    {
      day: DayOfWeek.THURSDAY,
      classId: core.classIds[1],
      subjectId: core.subjectIds.history,
      teacherId: users.teacherProfileIds[2],
      room: '106',
    },
    { day: DayOfWeek.FRIDAY, classId: core.classIds[1], subjectId: core.subjectIds.math, teacherId: users.teacherProfileIds[0], room: '203' },
  ];

  await prisma.schedule.createMany({
    data: dayMappings.map((item, index) => ({
      class_id: item.classId,
      subject_id: item.subjectId,
      teacher_id: item.teacherId,
      day_of_week: item.day,
      start_time: timeAt(9 + index, 0),
      end_time: timeAt(9 + index, 45),
      room: item.room,
      effective_from: new Date('2026-02-01T00:00:00.000Z'),
      effective_to: null,
      created_at: NOW,
      updated_at: NOW,
    })),
  });
}

async function seedBlogs(): Promise<void> {
  await prisma.blogPost.createMany({
    data: [
      {
        title: 'How bonus points motivate students',
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b',
        letter: 'Short article about motivation and gamification in schools.',
        date: new Date('2026-01-10T00:00:00.000Z'),
        hot: true,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        title: 'Assignments workflow update',
        image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
        letter: 'Teachers can now grade submissions with feedback in one place.',
        date: new Date('2026-01-20T00:00:00.000Z'),
        hot: false,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        title: 'Testing module launch',
        image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173',
        letter: 'Automated test attempts and analytics are now available.',
        date: new Date('2026-01-25T00:00:00.000Z'),
        hot: true,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        title: 'Partner offers for top students',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
        letter: 'Students can redeem bonus points for real partner rewards.',
        date: new Date('2026-02-01T00:00:00.000Z'),
        hot: false,
        created_at: NOW,
        updated_at: NOW,
      },
    ],
  });
}

async function seedLearningMaterials(core: CoreSeed, users: UsersSeed): Promise<MaterialsSeed> {
  const materials = await Promise.all([
    prisma.learningMaterial.create({
      data: {
        title: 'Algebra Fundamentals Workbook',
        description: 'Practice set with solved examples for linear and quadratic equations.',
        material_type: 'BOOK',
        author: 'N. Harutyunyan',
        file_url: 'https://example.com/materials/algebra-fundamentals-workbook.pdf',
        thumbnail_url: 'https://example.com/materials/thumbs/algebra-fundamentals-workbook.jpg',
        subject_id: core.subjectIds.math,
        class_id: core.classIds[0],
        is_published: true,
        uploaded_by_user_id: users.directorUserId,
        created_at: NOW,
        updated_at: NOW,
      },
    }),
    prisma.learningMaterial.create({
      data: {
        title: 'Physics Motion Cheat Sheet',
        description: 'One-page reference for basic mechanics formulas.',
        material_type: 'WORKSHEET',
        author: 'A. Sargsyan',
        file_url: 'https://example.com/materials/physics-motion-cheatsheet.pdf',
        thumbnail_url: null,
        subject_id: core.subjectIds.physics,
        class_id: null,
        is_published: true,
        uploaded_by_user_id: users.adminUserId,
        created_at: NOW,
        updated_at: NOW,
      },
    }),
    prisma.learningMaterial.create({
      data: {
        title: 'English Essay Structure Guide',
        description: 'Step-by-step outline for writing strong essay drafts.',
        material_type: 'ARTICLE',
        author: 'M. Petrosyan',
        file_url: 'https://example.com/materials/english-essay-structure-guide.pdf',
        thumbnail_url: 'https://example.com/materials/thumbs/english-essay-guide.jpg',
        subject_id: core.subjectIds.english,
        class_id: core.classIds[1],
        is_published: true,
        uploaded_by_user_id: users.directorUserId,
        created_at: NOW,
        updated_at: NOW,
      },
    }),
    prisma.learningMaterial.create({
      data: {
        title: 'History Video Lecture Pack',
        description: 'Supplemental video links and notes for modern history topics.',
        material_type: 'VIDEO',
        author: 'ImUsum Editorial Team',
        file_url: 'https://example.com/materials/history-video-lecture-pack',
        thumbnail_url: 'https://example.com/materials/thumbs/history-video-pack.jpg',
        subject_id: core.subjectIds.history,
        class_id: null,
        is_published: false,
        uploaded_by_user_id: users.adminUserId,
        created_at: NOW,
        updated_at: NOW,
      },
    }),
  ]);

  return {
    materialIds: materials.map((item) => item.id),
  };
}

async function seedAssignmentsAndSubmissionsAndGrades(core: CoreSeed, users: UsersSeed): Promise<AssignmentSeed> {
  const assignment1 = await prisma.assignment.create({
    data: {
      title: 'Quadratic Equations Homework',
      description: 'Solve tasks 1-10 from workbook.',
      assignment_type: 'INDIVIDUAL',
      subject_id: core.subjectIds.math,
      class_id: core.classIds[0],
      teacher_id: users.teacherProfileIds[0],
      due_date: daysFromNow(5),
      max_points: 10,
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      title: 'Physics Lab Report',
      description: 'Prepare a report about motion experiment.',
      assignment_type: 'GROUP',
      subject_id: core.subjectIds.physics,
      class_id: core.classIds[0],
      teacher_id: users.teacherProfileIds[1],
      due_date: daysFromNow(-2),
      max_points: 10,
      is_published: true,
      created_at: new Date('2026-01-20T09:00:00.000Z'),
      updated_at: NOW,
    },
  });

  const assignment3 = await prisma.assignment.create({
    data: {
      title: 'Essay Draft (Unpublished)',
      description: 'Draft essay for internal review.',
      assignment_type: 'INDIVIDUAL',
      subject_id: core.subjectIds.english,
      class_id: core.classIds[1],
      teacher_id: users.teacherProfileIds[2],
      due_date: daysFromNow(10),
      max_points: 10,
      is_published: false,
      created_at: NOW,
      updated_at: NOW,
    },
  });

  const assignment4 = await prisma.assignment.create({
    data: {
      title: 'History Timeline Project',
      description: 'Create a timeline for key 20th century events.',
      assignment_type: 'GROUP',
      subject_id: core.subjectIds.history,
      class_id: core.classIds[1],
      teacher_id: users.teacherProfileIds[2],
      due_date: daysFromNow(3),
      max_points: 10,
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
  });

  const studentA1 = users.studentProfileIds[0];
  const studentA2 = users.studentProfileIds[1];
  const studentB1 = users.studentProfileIds[6];

  const submission1 = await prisma.assignmentSubmission.create({
    data: {
      assignment_id: assignment1.id,
      student_id: studentA1,
      content: 'Solved all equations with explanations.',
      file_url: null,
      submitted_at: daysFromNow(-1),
      points_earned: 9,
      feedback: 'Great work, minor notation issues.',
      is_graded: true,
      created_at: daysFromNow(-1),
      updated_at: NOW,
    },
  });

  await prisma.assignmentSubmission.create({
    data: {
      assignment_id: assignment1.id,
      student_id: studentA2,
      content: 'Uploaded solutions in notebook photos.',
      file_url: 'https://example.com/submissions/assignment1-student2.pdf',
      submitted_at: daysFromNow(0),
      points_earned: null,
      feedback: null,
      is_graded: false,
      created_at: NOW,
      updated_at: NOW,
    },
  });

  const submission3 = await prisma.assignmentSubmission.create({
    data: {
      assignment_id: assignment4.id,
      student_id: studentB1,
      content: 'Group timeline draft version 1.',
      file_url: 'https://example.com/submissions/assignment4-student7.pdf',
      submitted_at: daysFromNow(-1),
      points_earned: 9,
      feedback: 'Good structure, add two more historical sources.',
      is_graded: true,
      created_at: daysFromNow(-1),
      updated_at: NOW,
    },
  });

  await prisma.grade.createMany({
    data: [
      {
        student_id: submission1.student_id,
        subject_id: assignment1.subject_id,
        teacher_id: assignment1.teacher_id,
        grade_value: 9,
        max_value: assignment1.max_points,
        grade_type: 'Assignment',
        reference_id: assignment1.id,
        date: new Date('2026-02-06T00:00:00.000Z'),
        comment: submission1.feedback,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        student_id: submission3.student_id,
        subject_id: assignment4.subject_id,
        teacher_id: assignment4.teacher_id,
        grade_value: 9,
        max_value: assignment4.max_points,
        grade_type: 'Assignment',
        reference_id: assignment4.id,
        date: new Date('2026-02-06T00:00:00.000Z'),
        comment: submission3.feedback,
        created_at: NOW,
        updated_at: NOW,
      },
    ],
  });

  return { assignmentIds: [assignment1.id, assignment2.id, assignment3.id, assignment4.id] };
}

async function seedTestsAndAttemptsAndAnswersAndGrades(core: CoreSeed, users: UsersSeed): Promise<TestSeed> {
  const test1 = await prisma.test.create({
    data: {
      title: 'Math Weekly Test',
      description: 'Algebra quick check',
      subject_id: core.subjectIds.math,
      class_id: core.classIds[0],
      teacher_id: users.teacherProfileIds[0],
      due_date: daysFromNow(4),
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
  });

  const test2 = await prisma.test.create({
    data: {
      title: 'History Draft Test',
      description: 'Not published yet',
      subject_id: core.subjectIds.history,
      class_id: core.classIds[1],
      teacher_id: users.teacherProfileIds[2],
      due_date: daysFromNow(7),
      is_published: false,
      created_at: NOW,
      updated_at: NOW,
    },
  });

  const question1 = await prisma.testQuestion.create({
    data: {
      test_id: test1.id,
      question_text: '2x + 5 = 15. What is x?',
      order_index: 1,
      points: 5,
      created_at: NOW,
      updated_at: NOW,
    },
  });

  const question2 = await prisma.testQuestion.create({
    data: {
      test_id: test1.id,
      question_text: 'Select the prime number.',
      order_index: 2,
      points: 5,
      created_at: NOW,
      updated_at: NOW,
    },
  });

  const q1Options = await Promise.all([
    prisma.testOption.create({
      data: {
        question_id: question1.id,
        option_text: '3',
        order_index: 1,
        is_correct: false,
        created_at: NOW,
        updated_at: NOW,
      },
    }),
    prisma.testOption.create({
      data: {
        question_id: question1.id,
        option_text: '5',
        order_index: 2,
        is_correct: true,
        created_at: NOW,
        updated_at: NOW,
      },
    }),
    prisma.testOption.create({
      data: {
        question_id: question1.id,
        option_text: '10',
        order_index: 3,
        is_correct: false,
        created_at: NOW,
        updated_at: NOW,
      },
    }),
  ]);

  const q2Options = await Promise.all([
    prisma.testOption.create({
      data: {
        question_id: question2.id,
        option_text: '9',
        order_index: 1,
        is_correct: false,
        created_at: NOW,
        updated_at: NOW,
      },
    }),
    prisma.testOption.create({
      data: {
        question_id: question2.id,
        option_text: '11',
        order_index: 2,
        is_correct: true,
        created_at: NOW,
        updated_at: NOW,
      },
    }),
    prisma.testOption.create({
      data: {
        question_id: question2.id,
        option_text: '15',
        order_index: 3,
        is_correct: false,
        created_at: NOW,
        updated_at: NOW,
      },
    }),
  ]);

  const attempt1 = await prisma.testAttempt.create({
    data: {
      test_id: test1.id,
      student_id: users.studentProfileIds[0],
      submitted_at: daysFromNow(-1),
      score_points: 10,
      max_points: 10,
      percentage: 100,
      created_at: daysFromNow(-1),
      updated_at: NOW,
    },
  });

  const attempt2 = await prisma.testAttempt.create({
    data: {
      test_id: test1.id,
      student_id: users.studentProfileIds[1],
      submitted_at: daysFromNow(-1),
      score_points: 5,
      max_points: 10,
      percentage: 50,
      created_at: daysFromNow(-1),
      updated_at: NOW,
    },
  });

  await prisma.testAnswer.createMany({
    data: [
      {
        attempt_id: attempt1.id,
        question_id: question1.id,
        selected_option_id: q1Options[1].id,
        is_correct: true,
        awarded_points: 5,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        attempt_id: attempt1.id,
        question_id: question2.id,
        selected_option_id: q2Options[1].id,
        is_correct: true,
        awarded_points: 5,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        attempt_id: attempt2.id,
        question_id: question1.id,
        selected_option_id: q1Options[1].id,
        is_correct: true,
        awarded_points: 5,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        attempt_id: attempt2.id,
        question_id: question2.id,
        selected_option_id: q2Options[0].id,
        is_correct: false,
        awarded_points: 0,
        created_at: NOW,
        updated_at: NOW,
      },
    ],
  });

  await prisma.grade.createMany({
    data: [
      {
        student_id: users.studentProfileIds[0],
        subject_id: core.subjectIds.math,
        teacher_id: users.teacherProfileIds[0],
        grade_value: 10,
        max_value: 10,
        grade_type: 'Test',
        reference_id: test1.id,
        date: new Date('2026-02-06T00:00:00.000Z'),
        comment: 'Perfect test result',
        created_at: NOW,
        updated_at: NOW,
      },
      {
        student_id: users.studentProfileIds[1],
        subject_id: core.subjectIds.math,
        teacher_id: users.teacherProfileIds[0],
        grade_value: 5,
        max_value: 10,
        grade_type: 'Test',
        reference_id: test1.id,
        date: new Date('2026-02-06T00:00:00.000Z'),
        comment: 'Need improvement on prime numbers',
        created_at: NOW,
        updated_at: NOW,
      },
    ],
  });

  return { testIds: [test1.id, test2.id] };
}

async function seedOffersAndPurchases(users: UsersSeed): Promise<OffersSeed> {
  const offers = await Promise.all([
    prisma.offer.create({
      data: {
        name: 'Nike Hoodie Discount',
        description: '30% off on selected hoodies',
        price: 90,
        image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
        brand_name: 'Nike',
        category: 'fashion',
        stock_quantity: 8,
        is_active: true,
        created_at: NOW,
        updated_at: NOW,
      },
    }),
    prisma.offer.create({
      data: {
        name: 'Bookstore Gift Card',
        description: 'Gift card for educational books',
        price: 70,
        image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794',
        brand_name: 'BookHouse',
        category: 'education',
        stock_quantity: 15,
        is_active: true,
        created_at: NOW,
        updated_at: NOW,
      },
    }),
    prisma.offer.create({
      data: {
        name: 'Coffee Coupon',
        description: 'Free coffee at partner cafe',
        price: 40,
        image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
        brand_name: 'CoffeeLab',
        category: 'food',
        stock_quantity: 30,
        is_active: true,
        created_at: NOW,
        updated_at: NOW,
      },
    }),
    prisma.offer.create({
      data: {
        name: 'Archived Partner Promo',
        description: 'Old disabled promo for API checks',
        price: 120,
        image_url: null,
        brand_name: 'ArchiveBrand',
        category: 'other',
        stock_quantity: 0,
        is_active: false,
        created_at: NOW,
        updated_at: NOW,
      },
    }),
  ]);

  const purchases = await Promise.all([
    prisma.purchase.create({
      data: {
        student_id: users.studentProfileIds[0],
        offer_id: offers[1].id,
        points_spent: 70,
        qr_code: 'IMUSUM-TEST-0001',
        status: 'pending',
        redeemed_at: null,
        created_at: NOW,
        updated_at: NOW,
      },
    }),
    prisma.purchase.create({
      data: {
        student_id: users.studentProfileIds[1],
        offer_id: offers[0].id,
        points_spent: 90,
        qr_code: 'IMUSUM-TEST-0002',
        status: 'redeemed',
        redeemed_at: daysFromNow(-1),
        created_at: NOW,
        updated_at: NOW,
      },
    }),
  ]);

  return {
    offerIds: offers.map((item) => item.id),
    purchaseIds: purchases.map((item) => item.id),
  };
}

async function printSummary(
  users: UsersSeed,
  assignments: AssignmentSeed,
  tests: TestSeed,
  offers: OffersSeed,
  materials: MaterialsSeed
): Promise<void> {
  const [userCount, scheduleCount, assignmentCount, submissionCount, testCount, attemptCount, materialCount, offerCount, purchaseCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.schedule.count(),
      prisma.assignment.count(),
      prisma.assignmentSubmission.count(),
      prisma.test.count(),
      prisma.testAttempt.count(),
      prisma.learningMaterial.count(),
      prisma.offer.count(),
      prisma.purchase.count(),
    ]);

  const studentEmails = Array.from({ length: users.studentUserIds.length }, (_, index) => {
    const n = index + 1;
    return `student${n.toString().padStart(2, '0')}@imusum.local`;
  });

  console.log('');
  console.log('Seed completed successfully.');
  console.log('');
  console.log(`Users: ${userCount}`);
  console.log(`Schedules: ${scheduleCount}`);
  console.log(`Assignments: ${assignmentCount}`);
  console.log(`Submissions: ${submissionCount}`);
  console.log(`Tests: ${testCount}`);
  console.log(`Attempts: ${attemptCount}`);
  console.log(`Materials: ${materialCount}`);
  console.log(`Offers: ${offerCount}`);
  console.log(`Purchases: ${purchaseCount}`);
  console.log('');
  console.log('Test accounts (password for all: Test12345!):');
  console.log('- admin@imusum.local');
  console.log('- director@imusum.local');
  console.log('- teacher.math@imusum.local');
  console.log('- teacher.physics@imusum.local');
  console.log('- teacher.humanities@imusum.local');
  for (const email of studentEmails) {
    console.log(`- ${email}`);
  }
  console.log('');
  console.log(`Seeded assignment IDs: ${assignments.assignmentIds.join(', ')}`);
  console.log(`Seeded test IDs: ${tests.testIds.join(', ')}`);
  console.log(`Seeded material IDs: ${materials.materialIds.join(', ')}`);
  console.log(`Seeded offer IDs: ${offers.offerIds.join(', ')}`);
  console.log(`Seeded purchase IDs: ${offers.purchaseIds.join(', ')}`);
}

async function main(): Promise<void> {
  await assertRequiredTablesExist();

  console.log('Resetting database...');
  await resetDatabase();

  console.log('Seeding core structure...');
  const core = await seedCoreStructure();

  console.log('Seeding users and profiles...');
  const users = await seedUsersAndProfiles(core);

  console.log('Seeding schedules...');
  await seedSchedules(core, users);

  console.log('Seeding blogs...');
  await seedBlogs();

  console.log('Seeding learning materials...');
  const materials = await seedLearningMaterials(core, users);

  console.log('Seeding assignments, submissions and grades...');
  const assignments = await seedAssignmentsAndSubmissionsAndGrades(core, users);

  console.log('Seeding tests, attempts, answers and grades...');
  const tests = await seedTestsAndAttemptsAndAnswersAndGrades(core, users);

  console.log('Seeding offers and purchases...');
  const offers = await seedOffersAndPurchases(users);

  await printSummary(users, assignments, tests, offers, materials);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
