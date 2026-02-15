import type {
  Assignment,
  AssignmentSubmission,
  BlogPost,
  ChatChannel,
  ChatMessage,
  Grade,
  Offer,
  Purchase,
  Schedule,
  Test,
  TestAnswer,
  TestAttempt,
  TestOption,
  TestQuestion,
  User,
} from '@prisma/client';

import { toDateOnlyString, toTimeOnlyString } from './time.js';

export function serializeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    is_active: user.is_active,
    is_verified: user.is_verified,
    school_id: user.school_id,
    avatar_url: user.avatar_url,
    phone: user.phone,
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
  };
}

export function serializeBlogPost(blog: BlogPost) {
  return {
    id: blog.id,
    title: blog.title,
    image: blog.image,
    letter: blog.letter,
    date: toDateOnlyString(blog.date),
    hot: blog.hot,
  };
}

export function serializeSchedule(schedule: Schedule) {
  return {
    id: schedule.id,
    class_id: schedule.class_id,
    subject_id: schedule.subject_id,
    teacher_id: schedule.teacher_id,
    day_of_week: schedule.day_of_week,
    start_time: toTimeOnlyString(schedule.start_time),
    end_time: toTimeOnlyString(schedule.end_time),
    room: schedule.room,
    effective_from: toDateOnlyString(schedule.effective_from),
    effective_to: schedule.effective_to ? toDateOnlyString(schedule.effective_to) : null,
    created_at: schedule.created_at.toISOString(),
    updated_at: schedule.updated_at.toISOString(),
  };
}

export function serializeAssignment(assignment: Assignment) {
  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    assignment_type: assignment.assignment_type,
    subject_id: assignment.subject_id,
    class_id: assignment.class_id,
    teacher_id: assignment.teacher_id,
    due_date: assignment.due_date.toISOString(),
    max_points: assignment.max_points,
    is_published: assignment.is_published,
    created_at: assignment.created_at.toISOString(),
    updated_at: assignment.updated_at.toISOString(),
  };
}

export function serializeSubmission(
  submission: AssignmentSubmission,
  studentInfo?: { student_first_name?: string | null; student_last_name?: string | null }
) {
  const base = {
    id: submission.id,
    assignment_id: submission.assignment_id,
    student_id: submission.student_id,
    content: submission.content,
    file_url: submission.file_url,
    submitted_at: submission.submitted_at ? submission.submitted_at.toISOString() : null,
    points_earned: submission.points_earned,
    feedback: submission.feedback,
    is_graded: submission.is_graded,
  };

  if (!studentInfo) {
    return base;
  }

  return {
    ...base,
    student_first_name: studentInfo.student_first_name ?? null,
    student_last_name: studentInfo.student_last_name ?? null,
  };
}

export function serializeTest(test: Test) {
  return {
    id: test.id,
    title: test.title,
    description: test.description,
    subject_id: test.subject_id,
    class_id: test.class_id,
    teacher_id: test.teacher_id,
    due_date: test.due_date.toISOString(),
    is_published: test.is_published,
    created_at: test.created_at.toISOString(),
    updated_at: test.updated_at.toISOString(),
  };
}

export function serializeTestOption(option: TestOption, includeCorrect = false) {
  return {
    id: option.id,
    question_id: option.question_id,
    option_text: option.option_text,
    order_index: option.order_index,
    ...(includeCorrect ? { is_correct: option.is_correct } : {}),
  };
}

export function serializeTestQuestion(question: TestQuestion) {
  return {
    id: question.id,
    test_id: question.test_id,
    question_text: question.question_text,
    order_index: question.order_index,
    points: question.points,
    created_at: question.created_at.toISOString(),
    updated_at: question.updated_at.toISOString(),
  };
}

export function serializeTestAttempt(
  attempt: TestAttempt,
  studentInfo?: { student_first_name?: string | null; student_last_name?: string | null }
) {
  const base = {
    id: attempt.id,
    test_id: attempt.test_id,
    student_id: attempt.student_id,
    submitted_at: attempt.submitted_at.toISOString(),
    score_points: attempt.score_points,
    max_points: attempt.max_points,
    percentage: attempt.percentage,
    created_at: attempt.created_at.toISOString(),
    updated_at: attempt.updated_at.toISOString(),
  };

  if (!studentInfo) {
    return base;
  }

  return {
    ...base,
    student_first_name: studentInfo.student_first_name ?? null,
    student_last_name: studentInfo.student_last_name ?? null,
  };
}

export function serializeTestAnswer(answer: TestAnswer) {
  return {
    id: answer.id,
    attempt_id: answer.attempt_id,
    question_id: answer.question_id,
    selected_option_id: answer.selected_option_id,
    is_correct: answer.is_correct,
    awarded_points: answer.awarded_points,
  };
}

export function serializeGrade(grade: Grade) {
  return {
    id: grade.id,
    student_id: grade.student_id,
    subject_id: grade.subject_id,
    teacher_id: grade.teacher_id,
    grade_value: grade.grade_value,
    max_value: grade.max_value,
    grade_type: grade.grade_type,
    reference_id: grade.reference_id,
    date: toDateOnlyString(grade.date),
    comment: grade.comment,
    created_at: grade.created_at.toISOString(),
    updated_at: grade.updated_at.toISOString(),
  };
}

export function serializeOffer(offer: Offer) {
  return {
    id: offer.id,
    name: offer.name,
    description: offer.description,
    price: offer.price,
    image_url: offer.image_url,
    brand_name: offer.brand_name,
    category: offer.category,
    stock_quantity: offer.stock_quantity,
    is_active: offer.is_active,
    created_at: offer.created_at.toISOString(),
    updated_at: offer.updated_at.toISOString(),
  };
}

export function serializeOfferListItem(offer: Offer) {
  return {
    id: offer.id,
    name: offer.name,
    description: offer.description,
    price: offer.price,
    image_url: offer.image_url,
    brand_name: offer.brand_name,
    category: offer.category,
    stock_quantity: offer.stock_quantity,
    is_available: offer.is_active && (offer.stock_quantity === null || offer.stock_quantity > 0),
  };
}

type ChatMessageSender = Pick<User, 'id' | 'first_name' | 'last_name' | 'role' | 'avatar_url'>;

function serializeChatSender(sender: ChatMessageSender) {
  return {
    id: sender.id,
    first_name: sender.first_name,
    last_name: sender.last_name,
    role: sender.role,
    avatar_url: sender.avatar_url,
  };
}

export function serializeChatMessage(message: ChatMessage, sender?: ChatMessageSender) {
  return {
    id: message.id,
    channel_id: message.channel_id,
    sender_user_id: message.sender_user_id,
    body: message.body,
    created_at: message.created_at.toISOString(),
    edited_at: message.edited_at ? message.edited_at.toISOString() : null,
    deleted_at: message.deleted_at ? message.deleted_at.toISOString() : null,
    is_deleted: message.deleted_at !== null,
    sender: sender ? serializeChatSender(sender) : null,
  };
}

export function serializeChatChannelListItem(
  channel: ChatChannel,
  payload: {
    unreadCount: number;
    lastMessage?: {
      message: ChatMessage;
      sender: ChatMessageSender;
    } | null;
  }
) {
  return {
    id: channel.id,
    key: channel.key,
    type: channel.type,
    school_id: channel.school_id,
    class_id: channel.class_id,
    title: channel.title,
    last_message_id: channel.last_message_id,
    last_message_at: channel.last_message_at ? channel.last_message_at.toISOString() : null,
    unread_count: payload.unreadCount,
    last_message:
      payload.lastMessage && payload.lastMessage.message
        ? serializeChatMessage(payload.lastMessage.message, payload.lastMessage.sender)
        : null,
  };
}

export function serializePurchase(
  purchase: Purchase,
  offer: { name: string; brand_name: string; image_url: string | null }
) {
  return {
    id: purchase.id,
    offer_id: purchase.offer_id,
    points_spent: purchase.points_spent,
    qr_code: purchase.qr_code,
    status: purchase.status,
    created_at: purchase.created_at.toISOString(),
    redeemed_at: purchase.redeemed_at ? purchase.redeemed_at.toISOString() : null,
    offer_name: offer.name,
    offer_brand: offer.brand_name,
    offer_image_url: offer.image_url,
  };
}
