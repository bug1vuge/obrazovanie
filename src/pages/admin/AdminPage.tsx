import { Check, Coins, Eye, ShieldCheck, Tag, Trash2, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  examLabel,
  isVisibleCourse,
  sortByOrder,
  STATUS_LABELS,
  STATUS_TONES,
} from '@/entities/course/lib';
import type { Course, CourseStatus } from '@/entities/types';
import { useAuthDialog } from '@/features/auth/authDialogStore';
import { formatMoney, formatPrice } from '@/shared/lib/format';
import { Badge, Button, EmptyState, Modal, Notice, StatCard } from '@/shared/ui';
import { DonutChart } from '@/shared/ui/charts';
import { useAppStore } from '@/store/appStore';
import { errorMessage } from '@/store/errors';
import { useCourseMetrics, useCurrentUser } from '@/store/hooks';
import { getPlatformStats } from '@/store/selectors';
import { values } from '@/store/table';
import { CourseCover } from '@/widgets/course-card/CourseCover';

export function AdminPage() {
  const user = useCurrentUser();
  const openAuth = useAuthDialog((state) => state.open);
  const db = useAppStore((state) => state.db);
  const setCourseStatus = useAppStore((state) => state.setCourseStatus);
  const deleteCourse = useAppStore((state) => state.deleteCourse);
  const addCategory = useAppStore((state) => state.addCategory);
  const deleteCategory = useAppStore((state) => state.deleteCategory);
  const metrics = useCourseMetrics();
  const [message, setMessage] = useState<{ text: string; tone: 'info' | 'error' } | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [toDelete, setToDelete] = useState<Course | null>(null);

  const stats = useMemo(() => getPlatformStats(db), [db]);
  const courses = useMemo(
    () =>
      values(db.courses)
        .filter(isVisibleCourse)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [db.courses],
  );
  const pending = courses.filter((course) => course.status === 'pending');
  const categories = useMemo(() => sortByOrder(values(db.categories)), [db.categories]);

  const run = (action: () => void, success: string) => {
    try {
      action();
      setMessage({ text: success, tone: 'info' });
    } catch (err) {
      setMessage({ text: errorMessage(err), tone: 'error' });
    }
  };

  const changeStatus = (course: Course, status: CourseStatus) =>
    run(
      () => setCourseStatus(course.id, status),
      status === 'published'
        ? `Курс «${course.title}» опубликован`
        : status === 'rejected'
          ? `Курс «${course.title}» отклонён`
          : `Курс «${course.title}» снят с публикации`,
    );

  if (!user?.isOwner) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 md:px-8">
        <EmptyState
          icon={ShieldCheck}
          title="Админ-панель"
          text="Доступ есть только у администратора платформы."
          action={
            user ? (
              <p className="muted text-[12.5px]">
                Вы вошли как {user.email}. Войдите аккаунтом администратора.
              </p>
            ) : (
              <Button onClick={openAuth}>Войти</Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-10">
      <div className="flex items-center gap-2">
        <ShieldCheck size={20} className="text-secondary" aria-hidden />
        <h1 className="font-display text-[26px] leading-tight md:text-[32px]">Админ-панель</h1>
      </div>
      <p className="muted mt-1.5 text-[14px]">Модерация курсов, предметы и статистика платформы.</p>
      {message && (
        <Notice tone={message.tone} className="mt-3">
          {message.text}
        </Notice>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Пользователей" value={stats.users} />
        <StatCard icon={Eye} label="Курсов" value={stats.courses} />
        <StatCard icon={Check} label="Записей на курсы" value={stats.enrollments} />
        <StatCard icon={Coins} label="Оборот" value={formatMoney(stats.turnover)} />
      </div>

      <section className="mt-7" aria-labelledby="moderation-title">
        <div className="mb-3 flex items-center gap-2">
          <h2 id="moderation-title" className="font-display text-lg">
            На модерации
          </h2>
          {pending.length > 0 && <Badge tone="warn">{pending.length}</Badge>}
        </div>
        {pending.length === 0 ? (
          <EmptyState
            title="Очередь пуста"
            text="Новые курсы появятся здесь после отправки преподавателем."
          />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {pending.map((course) => (
              <li
                key={course.id}
                className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
                  <CourseCover course={course} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display truncate text-[15px]">{course.title}</p>
                  <p className="muted mt-0.5 text-[12px]">
                    {course.teacherName} · {course.category} · {examLabel(course.exam)} ·{' '}
                    {metrics[course.id]?.lessonsCount ?? 0} уроков · {formatPrice(course.price)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => changeStatus(course, 'published')}>
                    <Check size={14} aria-hidden /> Опубликовать
                  </Button>
                  <Button size="sm" variant="soft" onClick={() => changeStatus(course, 'rejected')}>
                    <X size={14} aria-hidden /> Отклонить
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {stats.bySubject.length > 0 && (
        <section className="card mt-5 p-4 md:p-5" aria-labelledby="subjects-chart-title">
          <h2 id="subjects-chart-title" className="font-display mb-3 text-[14.5px]">
            Курсы по предметам
          </h2>
          <DonutChart
            title="Курсы по предметам"
            data={stats.bySubject.map((item) => ({ label: item.key, value: item.count }))}
          />
        </section>
      )}

      <section className="mt-7" aria-labelledby="all-courses-title">
        <h2 id="all-courses-title" className="font-display mb-3 text-lg">
          Все курсы
        </h2>
        <div className="card overflow-hidden">
          <div className="hairline-b muted hidden grid-cols-[1fr_160px_130px_150px] gap-2 px-4 py-2 text-[11.5px] font-semibold uppercase tracking-wide md:grid">
            <span>Курс</span>
            <span>Автор</span>
            <span>Статус</span>
            <span className="text-right">Действия</span>
          </div>
          <ul className="divide-y divide-[rgb(var(--line)/0.08)]">
            {courses.map((course) => (
              <li
                key={course.id}
                className="grid grid-cols-1 gap-2 px-4 py-3 md:grid-cols-[1fr_160px_130px_150px] md:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-medium">{course.title}</p>
                  <p className="muted text-[11.5px]">
                    {course.category} · {metrics[course.id]?.lessonsCount ?? 0} ур. ·{' '}
                    {formatPrice(course.price)}
                  </p>
                </div>
                <span className="muted truncate text-[12.5px]">{course.teacherName || '—'}</span>
                <span>
                  <Badge tone={STATUS_TONES[course.status]}>{STATUS_LABELS[course.status]}</Badge>
                </span>
                <div className="flex items-center gap-1.5 md:justify-end">
                  {course.status !== 'published' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => changeStatus(course, 'published')}
                      aria-label={`Опубликовать «${course.title}»`}
                    >
                      <Check size={15} className="text-emerald-500" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => changeStatus(course, 'draft')}
                      aria-label={`Снять с публикации «${course.title}»`}
                    >
                      <X size={15} />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setToDelete(course)}
                    aria-label={`Удалить «${course.title}»`}
                  >
                    <Trash2 size={15} className="text-red-500" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {courses.length === 0 && (
            <p className="muted px-4 py-6 text-center text-[13px]">Курсов пока нет</p>
          )}
        </div>
      </section>

      <section className="mt-7" aria-labelledby="subjects-title">
        <h2 id="subjects-title" className="font-display mb-3 flex items-center gap-2 text-lg">
          <Tag size={16} aria-hidden /> Предметы
        </h2>
        <div className="card p-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span key={category.id} className="chip">
                {category.name}
                <button
                  type="button"
                  onClick={() =>
                    run(() => deleteCategory(category.id), `Предмет «${category.name}» удалён`)
                  }
                  className="ml-1 text-red-500"
                  aria-label={`Удалить предмет «${category.name}»`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {categories.length === 0 && (
              <p className="muted text-[13px]">
                Предметы ещё не добавлены — используются взятые из курсов.
              </p>
            )}
          </div>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              run(() => {
                addCategory(newCategory);
                setNewCategory('');
              }, `Предмет «${newCategory.trim()}» добавлен`);
            }}
          >
            <input
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              className="inp !py-2 text-[13px]"
              placeholder="Новый предмет"
              aria-label="Новый предмет"
            />
            <Button size="sm" type="submit">
              Добавить
            </Button>
          </form>
        </div>
      </section>

      <Modal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Удалить курс?"
        maxWidth="max-w-sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const course = toDelete;
                setToDelete(null);
                if (course) run(() => deleteCourse(course.id), 'Курс удалён');
              }}
            >
              Удалить
            </Button>
          </div>
        }
      >
        <p className="text-[14px] leading-relaxed">
          Курс «{toDelete?.title}» будет удалён вместе с уроками и тестами. Это действие необратимо.
        </p>
      </Modal>
    </div>
  );
}
