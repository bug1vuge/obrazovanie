import { ArrowRight, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  activeFilterCount,
  DEFAULT_FILTERS,
  EXAM_FILTER_OPTIONS,
  filterCourses,
  filtersFromParams,
  filtersToParams,
  SORT_OPTIONS,
  type CatalogFilters,
  type CatalogSort,
} from '@/features/catalog/filterCourses';
import { useAuthDialog } from '@/features/auth/authDialogStore';
import type { ExamType } from '@/entities/types';
import { cn } from '@/shared/lib/cn';
import { plural, WORDS } from '@/shared/lib/format';
import { Button, Chip, EmptyState, Reveal, Select } from '@/shared/ui';
import { useAppStore } from '@/store/appStore';
import { useCourseMetrics, useCourseStats, useCurrentUser } from '@/store/hooks';
import { getSubjectNames } from '@/store/selectors';
import { values } from '@/store/table';
import { CourseCard } from '@/widgets/course-card/CourseCard';

export function CatalogPage() {
  const db = useAppStore((state) => state.db);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const user = useCurrentUser();
  const openAuth = useAuthDialog((state) => state.open);
  const navigate = useNavigate();
  const metrics = useCourseMetrics();
  const stats = useCourseStats();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => filtersFromParams(params), [params]);
  const setFilters = (next: CatalogFilters) => setParams(filtersToParams(next), { replace: true });
  const [showFilters, setShowFilters] = useState(false);

  const published = useMemo(
    () => values(db.courses).filter((course) => course.status === 'published'),
    [db.courses],
  );
  const subjects = useMemo(() => getSubjectNames(db), [db]);
  const visible = useMemo(
    () => filterCourses(published, filters, stats),
    [published, filters, stats],
  );
  const activeCount = activeFilterCount(filters);

  const update = (changes: Partial<CatalogFilters>) => setFilters({ ...filters, ...changes });

  const openStudio = () => {
    if (!user) {
      openAuth();
      return;
    }
    if (user.role !== 'teacher' && !user.isOwner) updateProfile({ role: 'teacher' });
    navigate('/profile?tab=courses');
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-10">
      <section className="rise">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-secondary">
          <Sparkles size={13} aria-hidden /> {published.length}{' '}
          {plural(published.length, WORDS.course)} в каталоге
        </span>
        <h1 className="font-display mt-4 max-w-3xl text-[30px] leading-[1.08] sm:text-[40px] md:text-[52px]">
          Подготовься к экзаменам
          <span className="text-secondary"> ЕГЭ и ОГЭ</span>
        </h1>
        <p className="muted mt-3 max-w-xl text-[15px] leading-relaxed">
          Упорные курсы по школьным предметам: короткая теория, разбор реальных заданий,
          тренировочные варианты и понятный прогресс.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              aria-hidden
              className="muted pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
            />
            <input
              type="search"
              value={filters.query}
              onChange={(event) => update({ query: event.target.value })}
              placeholder="Поиск: алгебра, физика, английский…"
              className="inp !rounded-full !py-3 pl-11 pr-10"
              aria-label="Поиск курсов"
            />
            {filters.query && (
              <button
                type="button"
                onClick={() => update({ query: '' })}
                className="hover-dim absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2"
                aria-label="Очистить поиск"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters((value) => !value)}
            className="sm:hidden"
            aria-expanded={showFilters}
            aria-controls="catalog-filters"
          >
            <SlidersHorizontal size={16} aria-hidden /> Фильтры{' '}
            {activeCount ? `· ${activeCount}` : ''}
          </Button>
        </div>
      </section>

      <div
        className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label="Предмет"
      >
        <Chip active={filters.subject === 'all'} onClick={() => update({ subject: 'all' })}>
          Все предметы
        </Chip>
        {subjects.map((subject) => (
          <Chip
            key={subject}
            active={filters.subject === subject}
            onClick={() => update({ subject })}
          >
            {subject}
          </Chip>
        ))}
      </div>

      <div
        id="catalog-filters"
        className={cn('mt-3 flex-wrap items-center gap-2 sm:flex', showFilters ? 'flex' : 'hidden')}
      >
        <Select
          value={filters.exam}
          onChange={(exam) => update({ exam: exam as ExamType | 'all' })}
          options={EXAM_FILTER_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
          className="!w-auto min-w-[150px] !rounded-full !py-2 text-[13px]"
          aria-label="Экзамен"
        />
        <Select
          value={filters.sort}
          onChange={(sort) => update({ sort: sort as CatalogSort })}
          options={SORT_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
          className="!w-auto min-w-[150px] !rounded-full !py-2 text-[13px]"
          aria-label="Сортировка"
        />
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => update({ subject: 'all', exam: 'all' })}
            className="chip hover-line"
          >
            <X size={13} aria-hidden /> Сбросить
          </button>
        )}
        <span className="muted ml-auto hidden text-[12.5px] md:block" aria-live="polite">
          {visible.length} {plural(visible.length, WORDS.course)}
        </span>
      </div>

      <section className="mt-6" aria-label="Курсы">
        {visible.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Ничего не нашлось"
            text="Попробуйте другой запрос или снимите фильтры."
            action={
              <Button variant="soft" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Сбросить всё
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {visible.map((course, index) => (
              <Reveal key={course.id} delay={(index % 3) * 70} className="flex">
                <CourseCard course={course} metrics={metrics[course.id]} stats={stats[course.id]} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <Reveal
        as="section"
        className="mt-10 overflow-hidden rounded-3xl border border-[rgb(var(--line)/0.1)]"
      >
        <div
          className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8"
          style={{
            background:
              'linear-gradient(120deg, rgb(var(--color-primary) / 0.96), rgb(var(--color-secondary) / 0.92))',
          }}
        >
          <div className="text-white">
            <p className="font-display text-xl md:text-2xl">Есть чему научить?</p>
            <p className="mt-1.5 max-w-lg text-sm text-white/85">
              Соберите курс из модулей, уроков и тестов, назначьте цену и получайте доход с каждой
              продажи — статистика всегда под рукой в личном кабинете.
            </p>
          </div>
          <button
            type="button"
            onClick={openStudio}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-[14.5px] font-semibold text-[#1a1620] transition hover:brightness-95"
          >
            Открыть студию <ArrowRight size={16} aria-hidden />
          </button>
        </div>
      </Reveal>

      <p className="muted mt-8 text-[10.5px] leading-relaxed">Фото обложек: Unsplash</p>
    </div>
  );
}
