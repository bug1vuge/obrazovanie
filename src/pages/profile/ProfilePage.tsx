import { GraduationCap, LogIn, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ROLE_LABELS } from '@/entities/user/lib';
import type { User } from '@/entities/types';
import { useAuthDialog } from '@/features/auth/authDialogStore';
import { formatDate } from '@/shared/lib/format';
import { Avatar, Badge, Button, EmptyState, Segmented, Tabs } from '@/shared/ui';
import { useAppStore } from '@/store/appStore';
import { useCurrentUser } from '@/store/hooks';
import { ProfileSettings } from '@/widgets/profile/ProfileSettings';
import { ExamGoalPicker } from '@/widgets/student/ExamGoalPicker';
import { MyLearning } from '@/widgets/student/MyLearning';
import { TeacherCourses } from '@/widgets/teacher/TeacherCourses';
import { TeacherStats } from '@/widgets/teacher/TeacherStats';
import { tabsFor, type ProfileTab } from './tabs';

const ROLE_OPTIONS = [
  { id: 'student', label: ROLE_LABELS.student },
  { id: 'teacher', label: ROLE_LABELS.teacher },
] as const;

function ProfileHeader({ user }: { user: User }) {
  const updateProfile = useAppStore((state) => state.updateProfile);
  return (
    <>
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <Avatar name={user.displayName} size={62} tone={2} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display truncate text-[20px] leading-tight">{user.displayName}</h1>
            <Badge tone={user.role === 'teacher' ? 'primary' : 'neutral'}>
              {ROLE_LABELS[user.role]}
            </Badge>
            {user.isOwner && (
              <Badge tone="ok">
                <ShieldCheck size={12} aria-hidden /> Администратор
              </Badge>
            )}
          </div>
          <p className="muted mt-1 truncate text-[13px]">{user.email}</p>
          <p className="muted text-[11.5px]">С нами с {formatDate(user.since)}</p>
        </div>
      </div>
      <div className="mt-4">
        <Segmented
          label="Роль в личном кабинете"
          value={user.role}
          options={ROLE_OPTIONS}
          onChange={(role) => updateProfile({ role })}
        />
        <p className="muted mt-2 px-1 text-[11.5px]">
          Роль можно менять в любой момент: ученик готовится к экзаменам, преподаватель публикует
          курсы и видит доход.
        </p>
      </div>
    </>
  );
}

export function ProfilePage() {
  const user = useCurrentUser();
  const openAuth = useAuthDialog((state) => state.open);
  const [params, setParams] = useSearchParams();

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 md:px-8">
        <EmptyState
          icon={LogIn}
          title="Личный кабинет Study Pro"
          text="Войдите, чтобы выбрать экзамен и курс, следить за прогрессом и получать сертификаты. Преподаватели видят здесь свои курсы и доход."
          action={<Button onClick={openAuth}>Войти или создать аккаунт</Button>}
        />
      </div>
    );
  }

  const tabs = tabsFor(user);
  const requested = params.get('tab') as ProfileTab | null;
  const tab = tabs.some((item) => item.id === requested) ? (requested as ProfileTab) : tabs[0]!.id;
  const selectTab = (next: ProfileTab) => setParams({ tab: next }, { replace: true });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-10">
      <ProfileHeader user={user} />

      <div className="mt-6">
        <Tabs label="Разделы кабинета" tabs={tabs} value={tab} onChange={selectTab} />
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-5">
        {tab === 'learning' && (
          <div className="flex flex-col gap-6">
            <ExamGoalPicker key={user.id} user={user} />
            <MyLearning user={user} />
          </div>
        )}
        {tab === 'courses' && <TeacherCourses user={user} />}
        {tab === 'stats' && <TeacherStats user={user} />}
        {tab === 'settings' && <ProfileSettings key={user.id} user={user} />}
      </div>

      {user.role === 'student' && !user.isOwner && (
        <p className="muted mt-8 flex items-center gap-1.5 text-[12px]">
          <GraduationCap size={14} aria-hidden /> Хотите преподавать? Переключите роль на
          «Преподаватель».
        </p>
      )}
    </div>
  );
}
