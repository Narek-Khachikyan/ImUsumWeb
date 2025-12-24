import type { DocumentationItem, BudgetCategory } from '@/types';

export const EDUCATION_PROBLEMS: DocumentationItem[] = [
  {
    id: 1,
    title: 'Teacher Time Loss',
    description:
      'Teachers are forced to spend a lot of time filling out documents, creating tests, and checking student work. Even outside of working hours, they often have to dedicate personal time to checking written assignments.',
    iconName: 'ClockIcon',
  },
  {
    id: 2,
    title: 'Lack of Unified Platform',
    description:
      'Currently, there is no platform that would include all educational tools in one place to facilitate work and perform all educational processes.',
    iconName: 'PuzzlePieceIcon',
  },
  {
    id: 3,
    title: 'Schedule Creation',
    description:
      'Creating a schedule is a long and complex process. In case of teacher absence, staff has to modify the schedule.',
    iconName: 'CalendarDaysIcon',
  },
  {
    id: 4,
    title: 'Manual Attendance Tracking',
    description:
      'Teachers are forced to manually mark the presence or absence of students.',
    iconName: 'ClipboardDocumentListIcon',
  },
  {
    id: 5,
    title: 'Communication',
    description:
      'Students are forced to create groups on different social networks for communication.',
    iconName: 'ChatBubbleLeftRightIcon',
  },
  {
    id: 6,
    title: 'Lack of Recommendations',
    description:
      'There is no platform where a student could receive recommendations for studying material based on their mistakes in tests.',
    iconName: 'LightBulbIcon',
  },
  {
    id: 7,
    title: 'Insufficient Motivation',
    description:
      'There is no platform that would provide bonuses for high student achievements.',
    iconName: 'TrophyIcon',
  },
];

export const STUDENT_FEATURES: DocumentationItem[] = [
  {
    id: 1,
    title: 'Schedule',
    description: 'Students can view their schedule.',
    iconName: 'CalendarIcon',
  },
  {
    id: 2,
    title: 'Homework',
    description: 'All homework information is available in one place.',
    iconName: 'BookOpenIcon',
  },
  {
    id: 3,
    title: 'Grades',
    description:
      'Ability to track grades, which simplifies performance monitoring.',
    iconName: 'ChartBarIcon',
  },
  {
    id: 4,
    title: 'Progress Analysis',
    description:
      'Receiving analysis and hints depending on the level of academic performance.',
    iconName: 'ArrowTrendingUpIcon',
  },
  {
    id: 5,
    title: 'Learning Materials',
    description:
      'Various textbooks and useful materials are available in one place, eliminating the need to search for information from different sources.',
    iconName: 'DocumentTextIcon',
  },
  {
    id: 6,
    title: 'Online Communication',
    description:
      'The program allows communication with teachers and classmates, facilitating knowledge exchange.',
    iconName: 'ChatBubbleLeftEllipsisIcon',
  },
  {
    id: 7,
    title: 'School News',
    description:
      'Students can follow school news to stay informed about all events.',
    iconName: 'NewspaperIcon',
  },
  {
    id: 8,
    title: 'Tests',
    description:
      'Taking tests of varying difficulty with automatic grading and receiving recommendations from the program depending on academic performance level.',
    iconName: 'ClipboardDocumentCheckIcon',
  },
  {
    id: 9,
    title: 'Job Opportunities',
    description:
      'Students with good academic performance can receive job offers based on their grades and teacher recommendations, promoting professional development.',
    iconName: 'BriefcaseIcon',
  },
  {
    id: 10,
    title: 'Recommendations',
    description:
      'Students receive recommendations on learning materials and tests to check their knowledge, which helps improve skills and provides an individualized approach to learning.',
    iconName: 'SparklesIcon',
  },
  {
    id: 11,
    title: 'Prizes and Bonuses',
    description:
      'Students with high academic performance can receive bonus cards, discounts, additional materials, or exchange bonuses for school supplies.',
    iconName: 'GiftIcon',
  },
];

export const TEACHER_FEATURES: DocumentationItem[] = [
  {
    id: 1,
    title: 'Student Work Management',
    description:
      'Optimally manage student work without the need for paper documentation.',
    iconName: 'FolderOpenIcon',
  },
  {
    id: 2,
    title: 'Automated Grading',
    description:
      'Automate the grading process, eliminating the need for manual checking of tests and assignments.',
    iconName: 'CheckBadgeIcon',
  },
  {
    id: 3,
    title: 'Assignment Creation',
    description:
      'Create individual or group assignments, allowing adaptation of learning to the needs of each student.',
    iconName: 'PencilSquareIcon',
  },
  {
    id: 4,
    title: 'Communication',
    description:
      'Easily communicate through online communications, simplifying interaction and idea exchange.',
    iconName: 'ChatBubbleOvalLeftIcon',
  },
  {
    id: 5,
    title: 'Automatic Attendance Marking',
    description:
      'Using geolocation, the system automatically marks student attendance, eliminating the need for manual tracking.',
    iconName: 'MapPinIcon',
  },
  {
    id: 6,
    title: 'AI-Powered Test Creation',
    description: 'Create tests on a given topic using AI.',
    iconName: 'CpuChipIcon',
  },
];

export const PRINCIPAL_FEATURES: DocumentationItem[] = [
  {
    id: 1,
    title: 'Staff Management',
    description:
      'Manage all school staff through a unified platform, simplifying work organization and interaction.',
    iconName: 'UserGroupIcon',
  },
  {
    id: 2,
    title: 'Material Upload',
    description:
      'Upload books and news, providing access to all necessary resources in one place.',
    iconName: 'CloudArrowUpIcon',
  },
  {
    id: 3,
    title: 'Schedule Creation',
    description:
      'Quickly and conveniently create schedules, taking into account teacher availability and student needs.',
    iconName: 'TableCellsIcon',
  },
];

export const AI_FEATURES: DocumentationItem[] = [
  {
    id: 1,
    title: 'Test Generation',
    description: 'Creating tests of different difficulty levels using AI.',
    iconName: 'DocumentPlusIcon',
  },
  {
    id: 2,
    title: 'Schedule Management',
    description: 'Optimizing schedules taking into account teacher availability.',
    iconName: 'CalendarDaysIcon',
  },
  {
    id: 3,
    title: 'Test Grading',
    description:
      'Automatic test grading, eliminating the need for manual checking and reducing the likelihood of errors.',
    iconName: 'CheckCircleIcon',
  },
  {
    id: 4,
    title: 'Recommendations',
    description:
      'Suggestions from various sources based on student progress.',
    iconName: 'AcademicCapIcon',
  },
];

export const GOALS_TEXT = `Our goal is to expand the use of the platform throughout Armenia after its release, making it accessible to all schools and universities. To implement these programs, we need investments that will allow us to scale the platform, improve its functionality, and attract more users.`;

export const ACHIEVEMENTS_TEXT = `The ImUsum project has already won at the "Armenian Interschool Science Festival 2024" and plans to attract investments for further development.`;

export const FUNDING_PROBLEMS = [
  'A full team is needed that we can pay.',
  'Servers and accounts are needed to make the platform accessible to everyone.',
  'Advanced Artificial Intelligence is only available in the paid version.',
  'Distribution and marketing are also crucial for program implementation.',
];

export const BUDGET_BREAKDOWN: BudgetCategory[] = [
  {
    id: 1,
    category: 'Platform Development and Support',
    amount: 70000,
    percentage: 35,
    details: [
      {
        name: 'Development Team Salaries',
        amount: 50000,
        subItems: [
          { name: 'Backend Developers', amount: 18000 },
          { name: 'Frontend Developers', amount: 18000 },
          { name: 'DevOps Specialists', amount: 7000 },
          { name: 'UI/UX Designer', amount: 7000 },
        ],
      },
      {
        name: 'Testing and Security',
        amount: 10000,
        subItems: [
          { name: 'Software Testing', amount: 5000 },
          { name: 'Security Audit', amount: 5000 },
        ],
      },
      {
        name: 'OpenAI API Integration',
        amount: 10000,
        subItems: [
          { name: 'OpenAI API Integration', amount: 6000 },
          { name: 'AI Optimization', amount: 4000 },
        ],
      },
    ],
  },
  {
    id: 2,
    category: 'OpenAI API Usage',
    amount: 40000,
    percentage: 20,
    details: [
      {
        name: 'OpenAI Subscription and Usage Cost',
        amount: 30000,
      },
      {
        name: 'Request Planning and Prompt Engineering',
        amount: 10000,
        subItems: [
          { name: 'Creating Training Prompts', amount: 5000 },
          { name: 'Token Usage Optimization', amount: 5000 },
        ],
      },
    ],
  },
  {
    id: 3,
    category: 'Servers and Hosting',
    amount: 30000,
    percentage: 15,
    details: [
      {
        name: 'Cloud Servers for Data Storage',
        amount: 20000,
        subItems: [
          { name: 'Server Rental for API and Storage', amount: 15000 },
          { name: 'Large Data Volume Storage', amount: 5000 },
        ],
      },
      {
        name: 'Data Backup and Security',
        amount: 10000,
        subItems: [
          { name: 'Backup Systems', amount: 5000 },
          { name: 'Data Security', amount: 5000 },
        ],
      },
    ],
  },
  {
    id: 4,
    category: 'Marketing and Distribution',
    amount: 30000,
    percentage: 15,
    details: [
      {
        name: 'Online Promotion and Advertising',
        amount: 15000,
        subItems: [
          { name: 'Targeted Social Media Advertising', amount: 10000 },
          { name: 'SEO Optimization and Blog', amount: 5000 },
        ],
      },
      {
        name: 'Content Creation for Presentations',
        amount: 10000,
        subItems: [
          { name: 'Investor Presentations', amount: 5000 },
          { name: 'Promotional Videos', amount: 5000 },
        ],
      },
      {
        name: 'Investor Meetings',
        amount: 5000,
      },
    ],
  },
  {
    id: 5,
    category: 'Operating Expenses',
    amount: 30000,
    percentage: 15,
    details: [
      {
        name: 'Legal Services and Licenses',
        amount: 10000,
        subItems: [
          { name: 'Legal Support', amount: 7000 },
          { name: 'Licensing and Certification', amount: 3000 },
        ],
      },
      {
        name: 'Administrative and Management Expenses',
        amount: 20000,
        subItems: [
          { name: 'Management Staff Salaries', amount: 10000 },
          { name: 'Operating Expenses (Office, Accounting)', amount: 10000 },
        ],
      },
    ],
  },
];

export const CONCLUSION_TEXT = `Welcome to ImUsum — a platform where education goes beyond limits, innovation meets inspiration, and the future of learning is reimagined. Join us to discover the future of education together! ImUsum is a place where every student becomes a beacon of the future.`;
