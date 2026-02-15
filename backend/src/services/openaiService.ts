import { env } from '../config/env.js';
import type { TestAttemptRecommendation } from './testRecommendationsService.js';

type QuestionOptionDraft = {
  option_text: string;
  is_correct: boolean;
  order_index: number;
};

export type GeneratedQuestionDraft = {
  question_text: string;
  order_index: number;
  points: number;
  options: QuestionOptionDraft[];
};

type RecommendationInput = {
  percentage: number;
  subject_name: string;
  focus_questions: Array<{
    question_id: number;
    question_text: string;
    selected_option_text: string;
    correct_option_text: string;
    points_lost: number;
  }>;
  average_grade: number | null;
  trend: 'up' | 'down' | 'stable' | 'insufficient_data';
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function normalizeDifficulty(value: string | undefined): 'easy' | 'medium' | 'hard' {
  if (value === 'easy' || value === 'hard') {
    return value;
  }
  return 'medium';
}

async function callOpenAiJson(systemPrompt: string, userPrompt: string): Promise<Record<string, unknown> | null> {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    return null;
  }

  const parsed = safeJsonParse<Record<string, unknown>>(content);
  if (!parsed || !isObject(parsed)) {
    return null;
  }
  return parsed;
}

function fallbackQuestionDrafts(topic: string, count: number): GeneratedQuestionDraft[] {
  return Array.from({ length: count }, (_, index) => ({
    question_text: `${topic}: հարց ${index + 1}`,
    order_index: index + 1,
    points: 1,
    options: [
      { option_text: 'Ճիշտ տարբերակ', is_correct: true, order_index: 1 },
      { option_text: 'Տարբերակ 2', is_correct: false, order_index: 2 },
      { option_text: 'Տարբերակ 3', is_correct: false, order_index: 3 },
      { option_text: 'Տարբերակ 4', is_correct: false, order_index: 4 },
    ],
  }));
}

function normalizeQuestionDrafts(value: unknown, fallbackTopic: string, fallbackCount: number): GeneratedQuestionDraft[] {
  if (!Array.isArray(value)) {
    return fallbackQuestionDrafts(fallbackTopic, fallbackCount);
  }

  const normalized: GeneratedQuestionDraft[] = [];
  for (let i = 0; i < value.length; i += 1) {
    const item = value[i];
    if (!isObject(item) || !Array.isArray(item.options) || item.options.length !== 4) {
      continue;
    }

    const options: QuestionOptionDraft[] = item.options
      .map((option, optionIndex) => {
        if (!isObject(option)) {
          return null;
        }
        return {
          option_text: String(option.option_text ?? '').trim(),
          is_correct: Boolean(option.is_correct),
          order_index: Number(option.order_index ?? optionIndex + 1),
        };
      })
      .filter((option): option is QuestionOptionDraft => option !== null && option.option_text.length > 0);

    if (options.length !== 4 || options.filter((option) => option.is_correct).length !== 1) {
      continue;
    }

    normalized.push({
      question_text: String(item.question_text ?? '').trim() || `${fallbackTopic}: հարց ${i + 1}`,
      order_index: Number(item.order_index ?? i + 1),
      points: Number(item.points ?? 1) > 0 ? Number(item.points ?? 1) : 1,
      options,
    });
  }

  return normalized.length > 0 ? normalized : fallbackQuestionDrafts(fallbackTopic, fallbackCount);
}

export async function generateTestDraftWithAi(input: {
  topic: string;
  question_count: number;
  difficulty?: string;
}): Promise<GeneratedQuestionDraft[]> {
  const questionCount = Math.min(Math.max(Number(input.question_count) || 5, 1), 20);
  const difficulty = normalizeDifficulty(input.difficulty);
  const topic = input.topic?.trim() || 'General topic';

  try {
    const result = await callOpenAiJson(
      'Generate school multiple-choice test drafts. Respond with valid JSON only.',
      [
        `Topic: ${topic}`,
        `Difficulty: ${difficulty}`,
        `Question count: ${questionCount}`,
        'Output JSON shape:',
        '{ "questions": [{ "question_text": "...", "order_index": 1, "points": 1, "options": [{ "option_text": "...", "is_correct": true|false, "order_index": 1 }] }] }',
        'Rules: each question must contain exactly 4 options and exactly 1 correct option.',
      ].join('\n')
    );

    if (!result) {
      return fallbackQuestionDrafts(topic, questionCount);
    }

    return normalizeQuestionDrafts(result.questions, topic, questionCount);
  } catch {
    return fallbackQuestionDrafts(topic, questionCount);
  }
}

export async function optimizeScheduleWithAi(input: {
  class_name: string;
  schedules: Array<{
    schedule_id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room: string | null;
    teacher_id: number;
  }>;
}): Promise<{
  rationale: string;
  updates: Array<{
    schedule_id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room: string | null;
    teacher_id: number;
  }>;
}> {
  const fallback = {
    rationale: 'Fallback draft: keep current schedule order.',
    updates: input.schedules,
  };

  try {
    const result = await callOpenAiJson(
      'You optimize school schedules. Return JSON only.',
      [
        `Class: ${input.class_name}`,
        `Current schedules JSON: ${JSON.stringify(input.schedules)}`,
        'Return JSON shape:',
        '{ "rationale": "...", "updates": [{ "schedule_id": 1, "day_of_week": "MONDAY", "start_time": "09:00:00", "end_time": "09:45:00", "room": "101", "teacher_id": 1 }] }',
        'Keep existing schedule_id values, do not add/remove rows.',
      ].join('\n')
    );

    if (!result || !Array.isArray(result.updates)) {
      return fallback;
    }

    const updates = result.updates
      .map((item) => {
        if (!isObject(item)) {
          return null;
        }
        const scheduleId = Number(item.schedule_id);
        const dayOfWeek = String(item.day_of_week ?? '').trim();
        const startTime = String(item.start_time ?? '').trim();
        const endTime = String(item.end_time ?? '').trim();
        const teacherId = Number(item.teacher_id);
        if (!Number.isInteger(scheduleId) || !Number.isInteger(teacherId) || !dayOfWeek || !startTime || !endTime) {
          return null;
        }
        return {
          schedule_id: scheduleId,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          room: item.room === null || item.room === undefined ? null : String(item.room),
          teacher_id: teacherId,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (updates.length === 0) {
      return fallback;
    }

    return {
      rationale: String(result.rationale ?? 'AI draft optimization'),
      updates,
    };
  } catch {
    return fallback;
  }
}

export async function buildAiRecommendation(input: RecommendationInput): Promise<TestAttemptRecommendation | null> {
  try {
    const result = await callOpenAiJson(
      'You are an educational assistant. Return JSON only.',
      [
        `Student test percentage: ${input.percentage}`,
        `Subject: ${input.subject_name}`,
        `Focus questions: ${JSON.stringify(input.focus_questions)}`,
        `Average grade: ${input.average_grade ?? 'n/a'}`,
        `Trend: ${input.trend}`,
        'Return JSON shape:',
        '{ "level":"critical|improving|good|excellent", "summary":"...", "recommended_difficulty":"easy|medium|hard", "action_items":["..."], "focus_questions":[...], "subject_context":{"average_grade": number|null, "trend":"up|down|stable|insufficient_data"} }',
      ].join('\n')
    );

    if (!result) {
      return null;
    }

    if (
      (result.level !== 'critical' &&
        result.level !== 'improving' &&
        result.level !== 'good' &&
        result.level !== 'excellent') ||
      (result.recommended_difficulty !== 'easy' &&
        result.recommended_difficulty !== 'medium' &&
        result.recommended_difficulty !== 'hard') ||
      !Array.isArray(result.action_items)
    ) {
      return null;
    }

    const trend = result.subject_context && isObject(result.subject_context) ? result.subject_context.trend : 'insufficient_data';
    const safeTrend =
      trend === 'up' || trend === 'down' || trend === 'stable' || trend === 'insufficient_data'
        ? trend
        : 'insufficient_data';

    return {
      level: result.level,
      summary: String(result.summary ?? ''),
      recommended_difficulty: result.recommended_difficulty,
      action_items: result.action_items.map((item) => String(item)).filter((item) => item.trim().length > 0).slice(0, 5),
      focus_questions: Array.isArray(result.focus_questions)
        ? result.focus_questions
            .map((item) => {
              if (!isObject(item)) {
                return null;
              }
              return {
                question_id: Number(item.question_id),
                question_text: String(item.question_text ?? ''),
                selected_option_text: String(item.selected_option_text ?? ''),
                correct_option_text: String(item.correct_option_text ?? ''),
                points_lost: Number(item.points_lost ?? 0),
              };
            })
            .filter(
              (
                item
              ): item is {
                question_id: number;
                question_text: string;
                selected_option_text: string;
                correct_option_text: string;
                points_lost: number;
              } => item !== null && Number.isFinite(item.question_id)
            )
            .slice(0, 3)
        : input.focus_questions.slice(0, 3),
      subject_context: {
        average_grade:
          result.subject_context && isObject(result.subject_context) && result.subject_context.average_grade !== undefined
            ? Number(result.subject_context.average_grade)
            : input.average_grade,
        trend: safeTrend,
      },
    };
  } catch {
    return null;
  }
}
