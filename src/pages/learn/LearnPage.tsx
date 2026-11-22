import {
  ArrowLeft,
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleCheck,
  FileText,
  List,
  Video,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getTone } from '@/entities/course/lib';
import { canEditCourse } from '@/entities/course/permissions';
import type { Lesson } from '@/entities/types';
import { useRequireAuth } from '@/features/auth/useRequireAuth';
import { QuizRunner } from '@/features/quiz/QuizRunner';
import { isEmbeddableVideo, toEmbedUrl } from '@/shared/lib/video';
import { cn } from '@/shared/lib/cn';
import { formatDuration } from '@/shared/lib/format';
import { Badge, Button, EmptyState, ProgressBar } from '@/shared/ui';
import { useAppStore } from '@/store/appStore';
import { useCurrentUser } from '@/store/hooks';
import {
  getCourseOutline,
  getLessonProgressIndex,
  getQuizResultIndex,
  isEnrolled,
} from '@/store/selectors';

function LessonMedia({ lesson }: { lesson: Lesson }) {
  const [broken, setBroken] = useState(false);
  if (lesson.type === 'video' && lesson.videoUrl) {
    return (
      <div className="mt-4 overflow-hidden rounded-2xl bg-black">
        {broken ? (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 p-6 text-center text-white/80">
            <Video size={26} aria-hidden />
            <p className="text-[13.5px]">Видео недоступно по этой ссылке.</p>
            <a
              href={lesson.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] underline"
            >
              Открыть ссылку
            </a>
          </div>
        ) : isEmbeddableVideo(lesson.videoUrl) ? (
          <iframe
            src={toEmbedUrl(lesson.videoUrl)}
            title={lesson.title}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={lesson.videoUrl}
            controls
            playsInline
            className="aspect-video w-full"
            onError={() => setBroken(true)}
          />
        )}
      </div>
    );
  }
  if (lesson.type === 'pdf' && lesson.pdfUrl) {
    return (
      <div className="bd mt-4 overflow-hidden rounded-2xl">
        <iframe src={lesson.pdfUrl} title={lesson.title} className="h-[70vh] w-full" />
        <a
          href={lesson.pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="hover-dim flex items-center gap-2 px-4 py-3 text-[13px]"
        >
          <FileText size={15} aria-hidden /> Открыть PDF в новой вкладке
        </a>
      </div>
    );
  }
  return null;
}

export function LearnPage() {
  const { courseId = '', lessonId } = useParams();
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const db = useAppStore((state) => state.db);
  const setLessonCompleted = useAppStore((state) => state.setLessonCompleted);
  const submitQuiz = useAppStore((state) => state.submitQuiz);
  const user = useCurrentUser();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  const course = db.courses[courseId];
  const outline = useMemo(() => getCourseOutline(db, courseId), [db, courseId]);
  const progress = useMemo(() => getLessonProgressIndex(db, user?.id), [db, user?.id]);
  const quizResults = useMemo(() => getQuizResultIndex(db, user?.id), [db, user?.id]);

  const lesson = outline.lessons.find((item) => item.id === lessonId) ?? outline.lessons[0] ?? null;
  const lessonIndex = lesson ? outline.lessons.findIndex((item) => item.id === lesson.id) : -1;
  const enrolled = isEnrolled(db, user?.id, courseId);
  const hasFullAccess = enrolled || canEditCourse(course, user);
  const canOpenLesson = hasFullAccess || Boolean(lesson?.isPreview);
  const completedCount = outline.lessons.filter((item) => progress[item.id]?.completed).length;
  const percent = outline.lessons.length ? (completedCount / outline.lessons.length) * 100 : 0;
  const finished = outline.lessons.length > 0 && completedCount >= outline.lessons.length;
  const activeQuiz = activeQuizId ? db.quizzes[activeQuizId] : undefined;

  useEffect(() => {
    setActiveQuizId(null);
  }, [lesson?.id]);

  if (!course) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState
          title="Курс не найден"
          action={<Button onClick={() => navigate('/')}>В каталог</Button>}
        />
      </div>
    );
  }

  const tone = getTone(course.tone);
  const currentModule = outline.modules.find((module) => module.id === lesson?.moduleId);
  const isDone = lesson ? Boolean(progress[lesson.id]?.completed) : false;

  const go = (step: -1 | 1) => {
    const target = outline.lessons[lessonIndex + step];
    if (target) navigate(`/learn/${courseId}/${target.id}`);
  };

  const toggleDone = () => {
    if (!lesson || !requireAuth()) return;
    setLessonCompleted(lesson.id, !isDone);
  };

  const contents = (
    <nav aria-label="Содержание курса" className="flex flex-col">
      {outline.modules.map((module, moduleIndex) => {
        const quiz = outline.quizByModule[module.id];
        const quizResult = quiz ? quizResults[quiz.id] : undefined;
        return (
          <div key={module.id} className="hairline-b py-3">
            <p className="muted px-4 text-[11px] font-semibold uppercase tracking-wider">
              Модуль {moduleIndex + 1} · {module.title.replace(/^Модуль \d+\.\s*/, '')}
            </p>
            <ul className="mt-1.5">
              {(outline.lessonsByModule[module.id] ?? []).map((item) => {
                const done = progress[item.id]?.completed;
                const current = lesson?.id === item.id && !activeQuiz;
                return (
                  <li key={item.id}>
                    <Link
                      to={`/learn/${courseId}/${item.id}`}
                      onClick={() => {
                        setDrawerOpen(false);
                        setActiveQuizId(null);
                      }}
                      aria-current={current ? 'page' : undefined}
                      className={cn(
                        'flex items-start gap-2.5 px-4 py-2.5 text-[13px] transition',
                        current ? 'bg-primary/10' : 'hover-dim',
                      )}
                    >
                      {done ? (
                        <CircleCheck
                          size={16}
                          className="mt-0.5 shrink-0 text-emerald-500"
                          aria-label="Пройден"
                        />
                      ) : (
                        <Circle size={16} className="muted mt-0.5 shrink-0" aria-hidden />
                      )}
                      <span
                        className={cn('min-w-0 flex-1 leading-snug', current && 'font-semibold')}
                      >
                        {item.title}
                      </span>
                      <span className="muted shrink-0 text-[11px]">
                        {formatDuration(item.duration)}
                      </span>
                    </Link>
                  </li>
                );
              })}
              {quiz && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasFullAccess) return;
                      setActiveQuizId(quiz.id);
                      setDrawerOpen(false);
                    }}
                    disabled={!hasFullAccess}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] disabled:opacity-50',
                      activeQuiz?.id === quiz.id ? 'bg-primary/10 font-semibold' : 'hover-dim',
                    )}
                  >
                    <Award size={16} className="muted shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1">Тест модуля</span>
                    {quizResult?.passed && <Badge tone="ok">{quizResult.score}%</Badge>}
                  </button>
                </li>
              )}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-full flex-col">
      <header className="hairline-b surface z-20 flex shrink-0 items-center gap-2 px-3 pb-2.5 pt-[calc(env(safe-area-inset-top,0px)+0.6rem)] md:px-5">
        <button
          type="button"
          onClick={() => navigate(`/course/${courseId}`)}
          className="hover-dim rounded-full p-2"
          aria-label="К странице курса"
        >
          <ArrowLeft size={19} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold leading-tight">{course.title}</p>
          <p className="muted truncate text-[11.5px]">
            {completedCount} из {outline.lessons.length} уроков · {Math.round(percent)}%
          </p>
        </div>
        <div className="hidden w-32 sm:block">
          <ProgressBar value={percent} thin />
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="hover-dim rounded-full p-2 lg:hidden"
          aria-label="Содержание"
        >
          <List size={19} />
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hairline-r hidden w-80 shrink-0 overflow-y-auto lg:block">
          <div className="p-4 pb-1">
            <ProgressBar value={percent} thin />
            {finished && (
              <Link
                to={`/certificate/${courseId}`}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-secondary px-3.5 py-2 text-[13px] font-medium text-white"
              >
                <Award size={15} aria-hidden /> Получить сертификат
              </Link>
            )}
          </div>
          {contents}
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-5 pb-24 md:px-8">
            {!canOpenLesson ? (
              <div className="card p-6">
                <h2 className="font-display text-lg">Урок доступен после записи</h2>
                <p className="muted mt-1.5 text-[14px]">
                  Запишитесь на курс, чтобы открыть все уроки, тесты и сертификат.
                </p>
                <Button className="mt-4" onClick={() => navigate(`/course/${courseId}`)}>
                  К странице курса
                </Button>
              </div>
            ) : activeQuiz ? (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-xl">{activeQuiz.title}</h2>
                  <button
                    type="button"
                    onClick={() => setActiveQuizId(null)}
                    className="hover-dim rounded-full p-2"
                    aria-label="Закрыть тест"
                  >
                    <X size={18} />
                  </button>
                </div>
                <QuizRunner
                  key={activeQuiz.id}
                  quiz={activeQuiz}
                  previous={quizResults[activeQuiz.id]}
                  onSubmit={(answers) => submitQuiz(activeQuiz.id, answers)}
                />
              </div>
            ) : lesson ? (
              <article>
                <div className="muted mb-1 text-[12px] font-semibold uppercase tracking-wider">
                  {currentModule?.title ?? 'Урок'}
                </div>
                <h1 className="font-display text-[22px] leading-tight md:text-[27px]">
                  {lesson.title}
                </h1>
                <LessonMedia key={lesson.id} lesson={lesson} />
                {lesson.content && (
                  <div className="mt-4 whitespace-pre-line text-[15px] leading-[1.75]">
                    {lesson.content}
                  </div>
                )}
                {!hasFullAccess && (
                  <p className="soft-bg mt-5 rounded-2xl px-4 py-3 text-[13px]">
                    Это пробный урок. Запишитесь на курс, чтобы открыть остальные уроки и тесты.
                  </p>
                )}
                <div className="hairline-t mt-6 flex flex-wrap items-center gap-2 pt-5">
                  <Button
                    variant={isDone ? 'soft' : 'primary'}
                    onClick={toggleDone}
                    aria-pressed={isDone}
                  >
                    <Check size={16} aria-hidden /> {isDone ? 'Пройдено' : 'Отметить пройденным'}
                  </Button>
                  <div className="ml-auto flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => go(-1)}
                      disabled={lessonIndex <= 0}
                    >
                      <ChevronLeft size={16} aria-hidden /> Назад
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => go(1)}
                      disabled={lessonIndex >= outline.lessons.length - 1}
                    >
                      Далее <ChevronRight size={16} aria-hidden />
                    </Button>
                  </div>
                </div>
                {finished && (
                  <div
                    className="mt-5 rounded-2xl p-5"
                    style={{ background: `linear-gradient(130deg, ${tone.from}, ${tone.to})` }}
                  >
                    <p className="font-display text-lg text-white">Курс пройден полностью</p>
                    <p className="mt-1 text-[13.5px] text-white/85">
                      Заберите именной сертификат в PDF.
                    </p>
                    <Link
                      to={`/certificate/${courseId}`}
                      className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14.5px] font-medium text-[#1a1620]"
                    >
                      <Award size={16} aria-hidden /> Открыть сертификат
                    </Link>
                  </div>
                )}
              </article>
            ) : (
              <EmptyState
                title="В курсе пока нет уроков"
                text="Преподаватель скоро добавит материалы."
              />
            )}
          </div>
        </main>
      </div>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 flex bg-black/50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Содержание"
            className="surface ml-auto flex h-full w-[86%] max-w-sm flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="hairline-b flex items-center justify-between px-4 py-3">
              <span className="font-display text-[14px]">Содержание</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="hover-dim rounded-full p-2"
                aria-label="Закрыть"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pb-6">
              <div className="px-4 pt-3">
                <ProgressBar value={percent} thin />
              </div>
              {contents}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
