import { GraduationCap, ShieldCheck, UserRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEMO_OWNER_ID, DEMO_STUDENT_ID, DEMO_TEACHER_ID } from '@/data/seed';
import { useAppStore } from '@/store/appStore';
import { errorMessage } from '@/store/errors';
import { Button, Field, Modal, Notice } from '@/shared/ui';
import { useAuthDialog } from './authDialogStore';

const DEMO_ACCOUNTS = [
  {
    id: DEMO_STUDENT_ID,
    title: 'Ученик',
    text: 'Алиса Смирнова · готовится к экзаменам',
    icon: UserRound,
  },
  {
    id: DEMO_TEACHER_ID,
    title: 'Преподаватель',
    text: 'Ирина Соколова · курсы, статистика и доход',
    icon: GraduationCap,
  },
  {
    id: DEMO_OWNER_ID,
    title: 'Администратор',
    text: 'Модерация курсов и статистика платформы',
    icon: ShieldCheck,
  },
] as const;

export function AuthDialog() {
  const { isOpen, close } = useAuthDialog();
  const signIn = useAppStore((state) => state.signIn);
  const signInWithEmail = useAppStore((state) => state.signInWithEmail);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const finish = () => {
    setName('');
    setEmail('');
    setError('');
    close();
  };

  const loginAs = (userId: string) => {
    signIn(userId);
    finish();
    navigate(userId === DEMO_OWNER_ID ? '/admin' : '/profile');
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    try {
      signInWithEmail({ name, email });
      finish();
      navigate('/profile');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Modal open={isOpen} onClose={finish} title="Вход в Study Pro" maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        <div>
          <p className="muted text-[13px]">Демо-доступ — войдите в один клик:</p>
          <div className="mt-2 flex flex-col gap-2">
            {DEMO_ACCOUNTS.map(({ id, title, text, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => loginAs(id)}
                className="bd hover-line flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition"
              >
                <span className="soft-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <Icon size={19} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold">{title}</span>
                  <span className="muted block truncate text-[12px]">{text}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="muted flex items-center gap-3 text-[11.5px] uppercase tracking-wider">
          <span className="hairline-t flex-1" />
          или по e-mail
          <span className="hairline-t flex-1" />
        </div>

        <form className="flex flex-col gap-3" onSubmit={onSubmit} noValidate>
          <Field label="Имя">
            <input
              className="inp"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Как к вам обращаться"
              autoComplete="name"
            />
          </Field>
          <Field label="E-mail">
            <input
              className="inp"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </Field>
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" size="lg">
            Войти или создать аккаунт
          </Button>
          <p className="muted text-center text-[11.5px]">
            Это демо-версия: данные хранятся только в вашем браузере.
          </p>
        </form>
      </div>
    </Modal>
  );
}
