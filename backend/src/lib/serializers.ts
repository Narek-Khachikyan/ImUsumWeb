import type {
  Assignment,
  AssignmentSubmission,
  BlogPost,
  Grade,
  Offer,
  Purchase,
  Schedule,
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

export function serializeSubmission(submission: AssignmentSubmission) {
  return {
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
