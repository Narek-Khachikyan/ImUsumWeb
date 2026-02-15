import { prisma } from '../lib/prisma.js';

export type RecommendationLevel = 'critical' | 'improving' | 'good' | 'excellent';
export type RecommendationDifficulty = 'easy' | 'medium' | 'hard';
export type RecommendationTrend = 'up' | 'down' | 'stable' | 'insufficient_data';

export interface AttemptAnswerForRecommendation {
  question_id: number;
  question_text: string;
  selected_option_text: string;
  correct_option_text: string;
  is_correct: boolean;
  points_lost: number;
}

export interface TestAttemptRecommendation {
  level: RecommendationLevel;
  summary: string;
  recommended_difficulty: RecommendationDifficulty;
  action_items: string[];
  focus_questions: Array<{
    question_id: number;
    question_text: string;
    selected_option_text: string;
    correct_option_text: string;
    points_lost: number;
  }>;
  subject_context: {
    average_grade: number | null;
    trend: RecommendationTrend;
  };
}

interface BuildRecommendationInput {
  percentage: number;
  subject_id: number;
  student_id: number;
  answers: AttemptAnswerForRecommendation[];
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

function resolveLevel(percentage: number): {
  level: RecommendationLevel;
  recommendedDifficulty: RecommendationDifficulty;
  summary: string;
} {
  if (percentage < 50) {
    return {
      level: 'critical',
      recommendedDifficulty: 'easy',
      summary: 'Արդյունքը ցույց է տալիս, որ թեման պետք է ամրացնել բազային մակարդակից։',
    };
  }

  if (percentage < 70) {
    return {
      level: 'improving',
      recommendedDifficulty: 'easy',
      summary: 'Դու առաջընթաց ունես, բայց կան թեմաներ, որոնք պետք է լրացուցիչ ամրապնդել։',
    };
  }

  if (percentage < 85) {
    return {
      level: 'good',
      recommendedDifficulty: 'medium',
      summary: 'Լավ արդյունք է․ պահպանիր տեմպը և ամրապնդիր դժվար հարցերի թեմաները։',
    };
  }

  return {
    level: 'excellent',
    recommendedDifficulty: 'hard',
    summary: 'Գերազանց արդյունք է․ կարող ես անցնել ավելի բարդ մակարդակի առաջադրանքների։',
  };
}

function resolveTrend(values: number[]): RecommendationTrend {
  if (values.length < 4) {
    return 'insufficient_data';
  }

  const latest2 = (values[0] + values[1]) / 2;
  const previous2 = (values[2] + values[3]) / 2;
  const delta = latest2 - previous2;

  if (delta > 0.4) {
    return 'up';
  }

  if (delta < -0.4) {
    return 'down';
  }

  return 'stable';
}

function buildActionItems(params: {
  level: RecommendationLevel;
  recommendedDifficulty: RecommendationDifficulty;
  trend: RecommendationTrend;
  focusQuestions: Array<{ question_id: number }>;
}): string[] {
  const { level, recommendedDifficulty, trend, focusQuestions } = params;

  const remediation =
    focusQuestions.length > 0
      ? `Կրկնիր սխալված հարցերի թեմաները (${focusQuestions.map((item) => `#${item.question_id}`).join(', ')}) և լուծիր նույն տիպի 5-7 հարց։`
      : 'Այս թեստում սխալներ չկային․ պահպանելու համար լուծիր 3-5 ամփոփիչ հարց նույն թեմայից։';

  const cadenceByLevel: Record<RecommendationLevel, string> = {
    critical: 'Հաջորդ 7 օրում ամեն օր հատկացրու 20-25 րոպե՝ տեսություն + կարճ վարժություններ։',
    improving: 'Հաջորդ 7 օրում շաբաթական 4 անգամ 20 րոպե լուծիր նպատակային վարժություններ։',
    good: 'Շաբաթվա ընթացքում 3 անգամ 20 րոպե ամրապնդող թեստ լուծիր։',
    excellent: 'Շաբաթը 2-3 անգամ 20 րոպե պահպանիր տեմպը՝ խառը բարդության հարցերով։',
  };

  const baseDifficultyText: Record<RecommendationDifficulty, string> = {
    easy: 'Հաջորդ փորձը ընտրիր թեթև մակարդակով՝ հիմքերը կայունացնելու համար։',
    medium: 'Հաջորդ փորձը ընտրիր միջին մակարդակով՝ առաջընթացը կայուն պահելու համար։',
    hard: 'Հաջորդ փորձը ընտրիր բարդ մակարդակով՝ գիտելիքը խորացնելու համար։',
  };

  let difficultyItem = baseDifficultyText[recommendedDifficulty];

  if (trend === 'down') {
    difficultyItem = `${difficultyItem} Վերջին միտումը նվազող է, ուստի նախապես արա լրացուցիչ կրկնություն։`;
  } else if (trend === 'up') {
    difficultyItem = `${difficultyItem} Վերջին միտումը աճող է, ուստի ավելացրու 1 հավելյալ բարդ վարժություն։`;
  } else if (trend === 'insufficient_data') {
    difficultyItem = `${difficultyItem} Պատմական տվյալները դեռ քիչ են, գնահատիր առաջընթացը հաջորդ 2 թեստերում։`;
  }

  return [remediation, cadenceByLevel[level], difficultyItem];
}

export async function buildTestAttemptRecommendation(
  input: BuildRecommendationInput
): Promise<TestAttemptRecommendation> {
  const levelPayload = resolveLevel(input.percentage);

  const focusQuestions = input.answers
    .filter((answer) => !answer.is_correct)
    .sort((left, right) => right.points_lost - left.points_lost)
    .slice(0, 3)
    .map((answer) => ({
      question_id: answer.question_id,
      question_text: answer.question_text,
      selected_option_text: answer.selected_option_text,
      correct_option_text: answer.correct_option_text,
      points_lost: answer.points_lost,
    }));

  const grades = await prisma.grade.findMany({
    where: {
      student_id: input.student_id,
      subject_id: input.subject_id,
    },
    orderBy: [{ date: 'desc' }, { created_at: 'desc' }],
    take: 6,
    select: {
      grade_value: true,
    },
  });

  const gradeValues = grades.map((grade) => grade.grade_value);
  const averageGrade =
    gradeValues.length > 0 ? roundTo2(gradeValues.reduce((acc, value) => acc + value, 0) / gradeValues.length) : null;
  const trend = resolveTrend(gradeValues);

  const actionItems = buildActionItems({
    level: levelPayload.level,
    recommendedDifficulty: levelPayload.recommendedDifficulty,
    trend,
    focusQuestions,
  });

  return {
    level: levelPayload.level,
    summary: levelPayload.summary,
    recommended_difficulty: levelPayload.recommendedDifficulty,
    action_items: actionItems,
    focus_questions: focusQuestions,
    subject_context: {
      average_grade: averageGrade,
      trend,
    },
  };
}
