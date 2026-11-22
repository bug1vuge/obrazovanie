import { Award, LogOut, Moon, RotateCcw, Save, ShieldCheck, Sun } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@/entities/types';
import { formatDate } from '@/shared/lib/format';
import { Button, Field, Modal } from '@/shared/ui';
import { useAppStore } from '@/store/appStore';
import { values } from '@/store/table';
import { useThemeStore } from '@/store/themeStore';

export function ProfileSettings({ user }: { user: User }) {
  const updateProfile = useAppStore((state) => state.updateProfile);
  const signOut = useAppStore((state) => state.signOut);
  const resetDemo = useAppStore((state) => state.resetDemo);
  const certificates = useAppStore((state) => state.db.certificates);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const navigate = useNavigate();

  const [name, setName] = useState(user.displayName);
  const [headline, setHeadline] = useState(user.headline);
  const [bio, setBio] = useState(user.bio);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const own = useMemo(
    () => values(certificates).filter((item) => item.userId === user.id),
    [certificates, user.id],
  );

  const save = () => {
    updateProfile({ displayName: name, headline, bio });
    // Show what was actually stored (an empty name keeps the previous one).
    const saved = useAppStore.getState().db.users[user.id];
    if (saved) {
      setName(saved.displayName);
      setHeadline(saved.headline);
      setBio(saved.bio);
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="card p-4 md:p-5" aria-labelledby="profile-form-title">
        <h2 id="profile-form-title" className="font-display text-[15px]">
          Профиль
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          <Field label="Имя">
            <input value={name} onChange={(event) => setName(event.target.value)} className="inp" />
          </Field>
          <Field label="Коротко о себе" hint="Видно на странице курса">
            <input
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              className="inp"
              placeholder={
                user.role === 'teacher' ? 'Учитель математики, 12 лет практики' : 'Ученик 11 класса'
              }
            />
          </Field>
          {user.role === 'teacher' && (
            <Field label="О преподавателе">
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={4}
                className="inp"
              />
            </Field>
          )}
          <div className="flex items-center gap-2">
            <Button onClick={save}>
              <Save size={16} aria-hidden /> Сохранить
            </Button>
            {saved && (
              <span role="status" className="text-[12.5px] text-emerald-700 dark:text-emerald-400">
                Сохранено
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="card p-4 md:p-5" aria-labelledby="certificates-title">
        <h2 id="certificates-title" className="font-display flex items-center gap-2 text-[15px]">
          <Award size={16} aria-hidden /> Сертификаты
        </h2>
        {own.length === 0 ? (
          <p className="muted mt-2 text-[13px]">
            Пока нет. Завершите курс — и сертификат появится здесь.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-[rgb(var(--line)/0.08)]">
            {own.map((certificate) => (
              <li key={certificate.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium">{certificate.courseTitle}</p>
                  <p className="muted text-[11.5px]">
                    {certificate.id} · {formatDate(certificate.issuedAt)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="soft"
                  onClick={() => navigate(`/certificate/${certificate.courseId}`)}
                >
                  Открыть
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4 md:p-5" aria-labelledby="appearance-title">
        <h2 id="appearance-title" className="font-display text-[15px]">
          Оформление
        </h2>
        <button
          type="button"
          onClick={toggleTheme}
          className="hover-dim mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[14px]"
        >
          {theme === 'dark' ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
          {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        </button>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            signOut();
            navigate('/');
          }}
        >
          <LogOut size={16} aria-hidden /> Выйти из аккаунта
        </Button>
        {user.isOwner && (
          <Button variant="soft" onClick={() => navigate('/admin')}>
            <ShieldCheck size={16} aria-hidden /> Админ-панель
          </Button>
        )}
        <Button variant="ghost" onClick={() => setConfirmReset(true)}>
          <RotateCcw size={16} aria-hidden /> Сбросить демо-данные
        </Button>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Сбросить демо-данные?"
        maxWidth="max-w-sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                resetDemo();
                navigate('/');
              }}
            >
              Сбросить
            </Button>
          </div>
        }
      >
        <p className="text-[14px] leading-relaxed">
          Все записи на курсы, прогресс и изменения в этом браузере будут удалены, каталог вернётся
          в исходное состояние.
        </p>
      </Modal>
    </div>
  );
}
