import { ArrowLeft, Download, Printer } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { certificateNumber } from '@/entities/certificate/lib';
import { CertificateView } from '@/features/certificate/CertificateView';
import { downloadElementAsPdf } from '@/features/certificate/exportPdf';
import { useAuthDialog } from '@/features/auth/authDialogStore';
import { Button, EmptyState, Notice } from '@/shared/ui';
import { useAppStore } from '@/store/appStore';
import { useCurrentUser } from '@/store/hooks';
import { getCourseOutline, getLessonProgressIndex } from '@/store/selectors';

export function CertificatePage() {
  const { courseId = '' } = useParams();
  const navigate = useNavigate();
  const db = useAppStore((state) => state.db);
  const issueCertificate = useAppStore((state) => state.issueCertificate);
  const openAuth = useAuthDialog((state) => state.open);
  const user = useCurrentUser();
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const course = db.courses[courseId];
  const outline = useMemo(() => getCourseOutline(db, courseId), [db, courseId]);
  const progress = useMemo(() => getLessonProgressIndex(db, user?.id), [db, user?.id]);
  const done = outline.lessons.filter((lesson) => progress[lesson.id]?.completed).length;
  const finished = outline.lessons.length > 0 && done >= outline.lessons.length;
  const number = user && course ? certificateNumber(user.id, course.id) : '';
  const certificate = number ? db.certificates[number] : undefined;

  useEffect(() => {
    if (finished && user && course && !certificate) issueCertificate(course.id);
  }, [finished, user, course, certificate, issueCertificate]);

  if (!course) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <EmptyState title="Курс не найден" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <EmptyState
          title="Войдите, чтобы получить сертификат"
          action={<Button onClick={openAuth}>Войти</Button>}
        />
      </div>
    );
  }

  const download = async () => {
    if (!ref.current) return;
    setBusy(true);
    setError('');
    try {
      await downloadElementAsPdf(ref.current, `studypro-certificate-${course.id}.pdf`);
    } catch {
      setError('Не удалось собрать PDF — попробуйте ещё раз или воспользуйтесь печатью.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4 md:px-8 md:py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="hover-dim muted mb-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-[13.5px]"
      >
        <ArrowLeft size={16} aria-hidden /> Назад
      </button>
      {finished ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-xl md:text-2xl">Сертификат о завершении</h1>
              <p className="muted mt-1 text-[13px]">
                Скачайте PDF или распечатайте — файл совпадает с тем, что на экране.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="soft" onClick={() => window.print()}>
                <Printer size={16} aria-hidden /> Печать
              </Button>
              <Button onClick={download} disabled={busy}>
                <Download size={16} aria-hidden /> {busy ? 'Готовим…' : 'Скачать PDF'}
              </Button>
            </div>
          </div>
          {error && (
            <Notice tone="error" className="mb-3">
              {error}
            </Notice>
          )}
          <div className="bd overflow-x-auto rounded-3xl p-2 sm:p-4">
            <CertificateView
              ref={ref}
              number={number}
              studentName={user.displayName}
              courseTitle={course.title}
              teacherName={course.teacherName}
              issuedAt={certificate?.issuedAt ?? new Date().toISOString()}
            />
          </div>
        </>
      ) : (
        <EmptyState
          title="Курс ещё не завершён"
          text={`Пройдено ${done} из ${outline.lessons.length} уроков. Дойдите до конца — и сертификат откроется.`}
          action={
            <Button onClick={() => navigate(`/course/${course.id}`)}>Вернуться к курсу</Button>
          }
        />
      )}
    </div>
  );
}
