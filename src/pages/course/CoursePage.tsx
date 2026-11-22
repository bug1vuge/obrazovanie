import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock,
  FileText,
  Lock,
  Pencil,
  Play,
  Tag,
  Users,
  Video,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { examLabel, getTone } from '@/entities/course/lib';
import { canEditCourse } from '@/entities/course/permissions';
import { applyPromo } from '@/entities/enrollment/lib';
import type { LessonType, PromoCode } from '@/entities/types';
import { useRequireAuth } from '@/features/auth/useRequireAuth';
import { CheckoutDialog } from '@/features/checkout/CheckoutDialog';
import { useGoBack } from '@/shared/hooks/useGoBack';
import { ReviewDialog } from '@/features/review/ReviewDialog';
import {
  formatDate,
  formatDuration,
  formatPrice,
  plural,
  pluralize,
  WORDS,
} from '@/shared/lib/format';
import { Avatar, Badge, Button, EmptyState, Notice, Reveal, Stars } from '@/shared/ui';
import { useAppStore } from '@/store/appStore';
import { errorMessage } from '@/store/errors';
import { useCurrentUser } from '@/store/hooks';
import { getCourseOutline, isEnrolled } from '@/store/selectors';
import { values } from '@/store/table';
import { CourseCover } from '@/widgets/course-card/CourseCover';

const LESSON_ICONS: Record<LessonType, typeof FileText> = {
  video: Video,
  text: FileText,
  pdf: FileText,
};

export function CoursePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack('/');
  const requireAuth = useRequireAuth();
  const db = useAppStore((state) => state.db);
  const enroll = useAppStore((state) => state.enroll);
  const findPromo = useAppStore((state) => state.findPromo);
  const user = useCurrentUser();

  const [message, setMessage] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const course = db.courses[id];
  const outline = useMemo(() => getCourseOutline(db, id), [db, id]);
  const reviews = useMemo(
    () =>
      values(db.reviews)
        .filter((review) => review.courseId === id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [db.reviews, id],
  );
  const students = useMemo(
    () => values(db.enrollments).filter((item) => item.courseId === id).length,
    [db.enrollments, id],
  );

  const enrolled = isEnrolled(db, user?.id, id);
  // Authors (and the administrator) manage the course instead of buying it.
  const isAuthor = canEditCourse(course, user);
  const canSee =
    course && (course.status === 'published' || enrolled || canEditCourse(course, user));

  if (!course || !canSee) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={BookOpen}
          title="Курс не найден"
          text="Возможно, он снят с публикации."
          action={<Button onClick={() => navigate('/')}>В каталог</Button>}
        />
      </div>
    );
  }

  const tone = getTone(course.tone);
  const rating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  const price = applyPromo(course.price, promo);
  const firstLesson = outline.lessons[0];
  const previewLesson = outline.lessons.find((lesson) => lesson.isPreview);
  const progressLessonIds = new Set(
    values(db.lessonProgress)
      .filter((item) => item.userId === user?.id && item.courseId === id && item.completed)
      .map((item) => item.lessonId),
  );
  const nextLesson =
    outline.lessons.find((lesson) => !progressLessonIds.has(lesson.id)) ?? firstLesson;
  const { lessonsCount, modulesCount, totalMinutes } = outline.metrics;

  const enrollFree = () => {
    if (!requireAuth()) return;
    try {
      enroll(course.id);
      setMessage('Вы записаны на курс. Приятной учёбы!');
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  const startCheckout = () => {
    if (!requireAuth()) return;
    setCheckoutOpen(true);
  };

  const applyPromoCode = () => {
    if (!promoInput.trim()) return;
    try {
      setPromo(findPromo(promoInput));
      setPromoError('');
    } catch (err) {
      setPromo(null);
      setPromoError(errorMessage(err));
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4 md:px-8 md:pb-12 md:pt-8">
      <button
        type="button"
        onClick={goBack}
        className="hover-dim muted mb-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-[13.5px]"
      >
        <ArrowLeft size={16} aria-hidden /> Назад
      </button>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px] xl:gap-x-6">
        <div className="min-w-0 xl:col-start-1">
          <div className="rise relative overflow-hidden rounded-3xl">
            <CourseCover course={course} />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(150deg, ${tone.from}bf 0%, ${tone.to}4d 45%, rgba(9,7,18,0.9) 100%)`,
              }}
            />
            <div className="relative flex flex-col gap-4 p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                  {course.category}
                </span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium text-white">
                  {examLabel(course.exam)}
                </span>
                {course.status !== 'published' && (
                  <span className="rounded-full bg-black/35 px-3 py-1 text-[11px] font-medium text-white">
                    Черновик
                  </span>
                )}
              </div>
              <h1 className="font-display hyphens-auto break-words text-[26px] leading-[1.12] text-white sm:text-[34px] md:text-[40px]">
                {course.title}
              </h1>
              <p className="max-w-2xl text-[14.5px] leading-relaxed text-white/85">
                {course.subtitle || course.description}
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-white/85">
                <span className="flex items-center gap-1.5">
                  <Stars value={rating} size={13} />
                  {rating ? rating.toFixed(1) : 'нет оценок'} ·{' '}
                  {pluralize(reviews.length, WORDS.review)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={14} aria-hidden /> {pluralize(students, WORDS.student)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} aria-hidden /> {formatDuration(totalMinutes)}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen size={14} aria-hidden /> {pluralize(lessonsCount, WORDS.lesson)}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2.5">
                <Avatar name={course.teacherName} size={34} tone={3} />
                <div className="text-white">
                  <div className="text-[13.5px] font-medium">{course.teacherName}</div>
                  <div className="text-[11.5px] text-white/75">
                    {course.teacherHeadline || 'Преподаватель'}
                  </div>
                </div>
              </div>
              {course.coverCredit && (
                <p className="text-[10px] text-white/45">Фото: {course.coverCredit}</p>
              )}
            </div>
          </div>
        </div>

        <div className="min-w-0 xl:col-start-1">
          <Reveal as="section" className="card p-5 md:p-6">
            <h2 className="font-display text-lg">О курсе</h2>
            <p className="mt-2.5 whitespace-pre-line text-[14.5px] leading-relaxed">
              {course.description || 'Описание появится совсем скоро.'}
            </p>
          </Reveal>

          <section className="mt-5">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="font-display text-lg">Программа</h2>
              <span className="muted text-[12.5px]">
                {pluralize(modulesCount, WORDS.module)} · {pluralize(lessonsCount, WORDS.lesson)}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {outline.modules.map((module, index) => {
                const lessons = outline.lessonsByModule[module.id] ?? [];
                return (
                  <Reveal key={module.id} className="card overflow-hidden">
                    <div className="hairline-b flex items-center gap-3 px-4 py-3.5">
                      <span className="soft-bg flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold">
                        {index + 1}
                      </span>
                      <span className="font-display text-[14.5px]">{module.title}</span>
                      <span className="muted ml-auto shrink-0 text-[12px]">
                        {lessons.length} ур.
                      </span>
                    </div>
                    <ul className="divide-y divide-[rgb(var(--line)/0.08)]">
                      {lessons.map((lesson) => {
                        const Icon = LESSON_ICONS[lesson.type];
                        const open = enrolled || lesson.isPreview;
                        return (
                          <li key={lesson.id} className="flex items-center gap-3 px-4 py-3">
                            <Icon size={15} className="muted shrink-0" aria-hidden />
                            {open ? (
                              <Link
                                to={`/learn/${course.id}/${lesson.id}`}
                                className="min-w-0 flex-1 truncate text-[13.5px] hover:underline"
                              >
                                {lesson.title}
                              </Link>
                            ) : (
                              <span className="min-w-0 flex-1 truncate text-[13.5px]">
                                {lesson.title}
                              </span>
                            )}
                            {lesson.isPreview && !enrolled && <Badge tone="ok">Пробный</Badge>}
                            {!open && (
                              <Lock
                                size={13}
                                className="muted shrink-0"
                                aria-label="Доступен после записи"
                              />
                            )}
                            <span className="muted shrink-0 text-[12px]">
                              {formatDuration(lesson.duration)}
                            </span>
                          </li>
                        );
                      })}
                      {lessons.length === 0 && (
                        <li className="muted px-4 py-3 text-[13px]">Уроки ещё не добавлены</li>
                      )}
                    </ul>
                  </Reveal>
                );
              })}
              {outline.modules.length === 0 && (
                <EmptyState title="Программа пока пуста" text="Преподаватель ещё наполняет курс." />
              )}
            </div>
          </section>

          <section className="mt-5">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="font-display text-lg">Отзывы</h2>
              {enrolled && (
                <Button variant="soft" size="sm" onClick={() => setReviewOpen(true)}>
                  Оставить отзыв
                </Button>
              )}
            </div>
            {reviews.length === 0 ? (
              <EmptyState title="Отзывов пока нет" text="Станьте первым, кто оценит курс." />
            ) : (
              <div className="flex flex-col gap-3">
                {reviews.map((review) => (
                  <Reveal as="article" key={review.id} className="card p-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={review.userName} size={30} tone={1} />
                      <span className="text-[13.5px] font-medium">{review.userName}</span>
                      <span className="ml-auto">
                        <Stars value={review.rating} size={13} />
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed">
                      {review.text}
                    </p>
                    <p className="muted mt-2 text-[11.5px]">{formatDate(review.createdAt)}</p>
                  </Reveal>
                ))}
              </div>
            )}
          </section>

          <Reveal
            as="section"
            className="card mt-5 flex flex-col gap-3 p-5 md:flex-row md:items-center"
          >
            <Avatar name={course.teacherName} size={54} tone={3} />
            <div className="min-w-0">
              <p className="font-display text-[15px]">{course.teacherName}</p>
              <p className="muted text-[12.5px]">
                {course.teacherHeadline || 'Преподаватель Study Pro'}
              </p>
              {course.teacherBio && course.teacherBio !== course.teacherHeadline && (
                <p className="mt-2 text-[13.5px] leading-relaxed">{course.teacherBio}</p>
              )}
            </div>
          </Reveal>
        </div>

        <aside className="xl:sticky xl:top-6 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:self-start">
          <div className="card p-5">
            <div className="flex items-end gap-2">
              <span className="font-display text-[30px] leading-none">{formatPrice(price)}</span>
              {promo && course.price > 0 && (
                <span className="muted text-[15px] line-through">{formatPrice(course.price)}</span>
              )}
            </div>
            {promo && (
              <p className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-emerald-600 dark:text-emerald-400">
                <Tag size={13} aria-hidden /> Промокод «{promo.code}» · −{promo.percent}%
              </p>
            )}

            <div className="mt-4 flex flex-col gap-2">
              {isAuthor ? (
                <>
                  <Button size="lg" onClick={() => navigate(`/studio/${course.id}`)}>
                    <Pencil size={17} aria-hidden /> Редактировать курс
                  </Button>
                  {firstLesson && (
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/learn/${course.id}/${firstLesson.id}`)}
                    >
                      <Play size={16} aria-hidden /> Открыть уроки
                    </Button>
                  )}
                </>
              ) : enrolled ? (
                <>
                  <Button
                    size="lg"
                    onClick={() =>
                      navigate(nextLesson ? `/learn/${course.id}/${nextLesson.id}` : '/profile')
                    }
                  >
                    <Play size={17} aria-hidden /> Продолжить обучение
                  </Button>
                  <Link to="/profile" className="muted text-center text-[13px] hover:underline">
                    Мой прогресс по курсу
                  </Link>
                </>
              ) : course.price > 0 ? (
                <>
                  <Button
                    size="lg"
                    onClick={startCheckout}
                    disabled={course.status !== 'published'}
                  >
                    Купить курс
                  </Button>
                  {previewLesson && (
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/learn/${course.id}/${previewLesson.id}`)}
                    >
                      <Play size={16} aria-hidden /> Смотреть пробный урок
                    </Button>
                  )}
                </>
              ) : (
                <Button size="lg" onClick={enrollFree} disabled={course.status !== 'published'}>
                  Записаться бесплатно
                </Button>
              )}
            </div>

            {!enrolled && !isAuthor && course.price > 0 && (
              <div className="mt-4">
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={(event) => setPromoInput(event.target.value.toUpperCase())}
                    onKeyDown={(event) => event.key === 'Enter' && applyPromoCode()}
                    placeholder="Промокод"
                    className="inp !py-2 text-[13px] uppercase"
                    aria-label="Промокод"
                  />
                  <Button variant="soft" size="sm" onClick={applyPromoCode}>
                    ОК
                  </Button>
                </div>
                {promoError && (
                  <p role="alert" className="mt-1.5 text-[12px] text-red-500">
                    {promoError}
                  </p>
                )}
              </div>
            )}

            {message && <Notice className="mt-3">{message}</Notice>}

            <ul className="mt-4 flex flex-col gap-2 text-[13px]">
              {[
                `${pluralize(lessonsCount, WORDS.lesson)} и ${modulesCount} ${plural(modulesCount, WORDS.module)}`,
                'Тесты с автопроверкой после модулей',
                'Прогресс сохраняется автоматически',
                'PDF-сертификат после завершения',
                'Доступ навсегда',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="muted mt-3 px-1 text-[11.5px] leading-relaxed">
            Оплата проходит на стороне платёжного сервиса, доступ открывается сразу после
            подтверждения. 30 дней на возврат, если курс не подошёл.
          </p>
        </aside>
      </div>

      <CheckoutDialog
        course={course}
        promo={promo}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onPaid={() => {
          setCheckoutOpen(false);
          setMessage('Оплата прошла — курс открыт. Приятной учёбы!');
        }}
      />
      <ReviewDialog courseId={course.id} open={reviewOpen} onClose={() => setReviewOpen(false)} />
    </div>
  );
}
