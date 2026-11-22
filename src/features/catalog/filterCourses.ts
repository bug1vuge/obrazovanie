import { matchesExam } from '@/entities/course/lib';
import type { Course, ExamType } from '@/entities/types';
import type { CourseStats } from '@/store/selectors';

export type CatalogSort = 'new' | 'rating';

export const SORT_OPTIONS: readonly { id: CatalogSort; label: string }[] = [
  { id: 'new', label: 'Новые' },
  { id: 'rating', label: 'По рейтингу' },
];

export const EXAM_FILTER_OPTIONS: readonly { id: ExamType | 'all'; label: string }[] = [
  { id: 'all', label: 'ОГЭ и ЕГЭ' },
  { id: 'oge', label: 'ОГЭ' },
  { id: 'ege', label: 'ЕГЭ' },
];

export interface CatalogFilters {
  query: string;
  subject: string | 'all';
  exam: ExamType | 'all';
  sort: CatalogSort;
}

export const DEFAULT_FILTERS: CatalogFilters = {
  query: '',
  subject: 'all',
  exam: 'all',
  sort: 'new',
};

/** Number of narrowing filters applied (search and sort are not counted). */
export const activeFilterCount = (filters: CatalogFilters) =>
  (filters.subject !== 'all' ? 1 : 0) + (filters.exam !== 'all' ? 1 : 0);

export function filterCourses(
  courses: readonly Course[],
  filters: CatalogFilters,
  stats: Readonly<Record<string, CourseStats>> = {},
): Course[] {
  const query = filters.query.trim().toLowerCase();
  const result = courses.filter((course) => {
    if (course.status !== 'published') return false;
    if (filters.subject !== 'all' && course.category !== filters.subject) return false;
    if (filters.exam !== 'all' && !matchesExam(course, filters.exam)) return false;
    if (!query) return true;
    const haystack =
      `${course.title} ${course.subtitle} ${course.teacherName} ${course.category}`.toLowerCase();
    return haystack.includes(query);
  });

  return result.sort((a, b) => {
    if (filters.sort === 'rating') {
      const diff = (stats[b.id]?.rating ?? 0) - (stats[a.id]?.rating ?? 0);
      if (diff !== 0) return diff;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}
