import { act, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DRAFT_COURSE_ID } from '@/data/catalog';
import { DEMO_OWNER_ID, DEMO_STUDENT_ID, DEMO_TEACHER_ID } from '@/data/seed';
import { DEMO_PAYMENT_DELAY_MS } from '@/features/checkout/CheckoutDialog';
import { useAppStore } from '@/store/appStore';
import { values } from '@/store/table';
import { renderApp } from '@/test/utils';

const courseLinks = () =>
  screen.getAllByRole('link').filter((link) => link.getAttribute('href')?.startsWith('/course/'));

describe('catalog', () => {
  it('renders all published courses with unique cover images', () => {
    const { container } = renderApp('/');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Подготовься к экзаменам ЕГЭ и ОГЭ',
    );
    expect(courseLinks()).toHaveLength(36);
    const images = [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));
    expect(images).toHaveLength(36);
    expect(new Set(images).size).toBe(36);
  });

  it('has no price filter and no «Популярные» sort; the exam filter only offers ОГЭ and ЕГЭ', async () => {
    const { user } = renderApp('/');
    expect(screen.queryByRole('combobox', { name: 'Цена' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Сортировка' }));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Новые',
      'По рейтингу',
    ]);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Экзамен' }));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'ОГЭ и ЕГЭ',
      'ОГЭ',
      'ЕГЭ',
    ]);
  });

  it('keeps filters in the URL so they survive going to a course and back', async () => {
    const { user, router } = renderApp('/');
    await user.click(screen.getByRole('combobox', { name: 'Экзамен' }));
    await user.click(screen.getByRole('option', { name: 'ОГЭ' }));
    expect(router.state.location.search).toBe('?exam=oge');
    await user.click(screen.getByRole('link', { name: /География: ОГЭ с экспертом/ }));
    expect(router.state.location.pathname).toBe('/course/sp-geo-oge-expert');
    await act(() => router.navigate(-1));
    expect(screen.getByRole('combobox', { name: 'Экзамен' })).toHaveTextContent('ОГЭ');
    expect(screen.queryByText('География: ЕГЭ с экспертом')).not.toBeInTheDocument();
  });

  it('filters by exam, subject and search', async () => {
    const { user } = renderApp('/');
    await user.click(screen.getByRole('combobox', { name: 'Экзамен' }));
    await user.click(screen.getByRole('option', { name: 'ЕГЭ' }));
    const egeCount = courseLinks().length;
    expect(egeCount).toBeLessThan(36);
    expect(screen.queryByText('География: ОГЭ с экспертом')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'География' }));
    expect(courseLinks().map((link) => link.textContent)).toEqual([
      expect.stringContaining('География: ЕГЭ с экспертом'),
      expect.stringContaining('География: онлайн-занятия со студентом вуза'),
    ]);

    await user.click(screen.getByRole('button', { name: /Сбросить$/ }));
    await user.type(screen.getByRole('searchbox', { name: 'Поиск курсов' }), 'несуществующий');
    expect(screen.getByText('Ничего не нашлось')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Сбросить всё' }));
    expect(courseLinks()).toHaveLength(36);
  });

  it('keeps only «Каталог» and «Профиль» in the bottom navigation', () => {
    renderApp('/');
    const nav = screen.getByRole('navigation', { name: 'Нижняя навигация' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Каталог', 'Профиль']);
  });
});

describe('auth', () => {
  it('signs in with a demo account from the dialog', async () => {
    const { user } = renderApp('/');
    await user.click(screen.getAllByRole('button', { name: 'Войти' })[0]!);
    const dialog = screen.getByRole('dialog', { name: 'Вход в Study Pro' });
    await user.click(within(dialog).getByRole('button', { name: /Ученик/ }));
    expect(useAppStore.getState().session.userId).toBe(DEMO_STUDENT_ID);
    expect(await screen.findByRole('heading', { name: 'Алиса Смирнова' })).toBeInTheDocument();
  });

  it('validates the e-mail form', async () => {
    const { user } = renderApp('/profile');
    await user.click(screen.getByRole('button', { name: 'Войти или создать аккаунт' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('E-mail'), 'bad');
    await user.click(within(dialog).getByRole('button', { name: 'Войти или создать аккаунт' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('корректный e-mail');
  });
});

describe('profile settings', () => {
  it('shows the stored name after saving an empty one', async () => {
    const { user } = renderApp('/profile?tab=settings', { userId: DEMO_STUDENT_ID });
    const name = screen.getByLabelText('Имя');
    await user.clear(name);
    await user.click(screen.getByRole('button', { name: /Сохранить/ }));
    expect(name).toHaveValue('Алиса Смирнова');
  });
});

describe('student cabinet', () => {
  it('asks to choose ОГЭ/ЕГЭ and a course, then shows the goal', async () => {
    const { user } = renderApp('/profile', { userId: DEMO_STUDENT_ID });
    expect(
      screen.getByRole('heading', { name: 'К какому экзамену готовитесь?' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Курс' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /ЕГЭ/ }));
    const list = screen.getByRole('radiogroup', { name: 'Курс' });
    expect(within(list).queryByText('География: ОГЭ с экспертом')).not.toBeInTheDocument();

    await user.click(within(list).getByRole('radio', { name: /Математика: ЕГЭ профиль/ }));
    expect(useAppStore.getState().db.users[DEMO_STUDENT_ID]?.goal).toEqual({
      exam: 'ege',
      courseId: 'k-math',
    });
    const goal = screen.getByRole('region', { name: 'Цель подготовки' });
    expect(goal).toHaveTextContent('Готовлюсь к ЕГЭ');
    expect(within(goal).getByRole('button', { name: /Продолжить/ })).toBeInTheDocument();
  });

  it('shows learning progress and certificates', async () => {
    const { user } = renderApp('/profile', { userId: DEMO_STUDENT_ID });
    expect(screen.getByRole('heading', { name: 'Моё обучение' })).toBeInTheDocument();
    expect(screen.getByText('В процессе · 2')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Настройки' }));
    expect(screen.getByText(/SP-DENT-ENTS/)).toBeInTheDocument();
  });
});

describe('teacher cabinet', () => {
  it('has a statistics tab with income from sold courses', async () => {
    const { user } = renderApp('/profile', { userId: DEMO_TEACHER_ID });
    expect(screen.getByRole('tab', { name: 'Курсы' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Геометрия для ОГЭ: задачи с чертежом')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Статистика' }));
    expect(screen.getByRole('heading', { name: 'Статистика и доход' })).toBeInTheDocument();
    expect(screen.getByText('Доход с продаж')).toBeInTheDocument();
    expect(screen.getByText(/К выплате/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Доход по месяцам' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Доход по курсам' })).toHaveTextContent(
      'Русский язык: ЕГЭ',
    );
    expect(screen.getByRole('heading', { name: 'Последние продажи' })).toBeInTheDocument();
  });

  it('creates a course and edits its programme in the studio', async () => {
    const { user } = renderApp('/profile?tab=courses', { userId: DEMO_TEACHER_ID });
    await user.click(screen.getByRole('button', { name: 'Создать курс' }));
    await user.type(screen.getByLabelText('Название курса'), 'Тригонометрия');
    await user.click(screen.getByRole('button', { name: 'Создать и открыть' }));

    expect(await screen.findByRole('heading', { name: 'Программа' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Добавить модуль' }));
    await user.click(screen.getByRole('button', { name: /Урок/ }));
    const dialog = screen.getByRole('dialog', { name: 'Новый урок' });
    await user.type(within(dialog).getByLabelText('Название'), 'Единичная окружность');
    await user.click(within(dialog).getByRole('button', { name: /Сохранить/ }));
    expect(screen.getByRole('button', { name: 'Единичная окружность' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /На модерацию/ }));
    expect(screen.getByRole('status')).toHaveTextContent('отправлен на модерацию');
    const created = values(useAppStore.getState().db.courses).find(
      (course) => course.title === 'Тригонометрия',
    );
    expect(created?.status).toBe('pending');
  });
});

describe('course and learning', () => {
  it('keeps the visitor on the course after signing in from «Записаться»', async () => {
    const { user, router } = renderApp('/course/sp-geo-students');
    await user.click(screen.getByRole('button', { name: 'Записаться бесплатно' }));
    const dialog = screen.getByRole('dialog', { name: 'Вход в Study Pro' });
    await user.click(within(dialog).getByRole('button', { name: /Ученик/ }));
    expect(router.state.location.pathname).toBe('/course/sp-geo-students');
    await user.click(screen.getByRole('button', { name: 'Записаться бесплатно' }));
    expect(screen.getByText('Вы записаны на курс. Приятной учёбы!')).toBeInTheDocument();
  });

  it('shows «Редактировать курс» instead of buying to the author', async () => {
    const { user, router } = renderApp('/course/k-rus', { userId: DEMO_TEACHER_ID });
    expect(screen.queryByRole('button', { name: 'Купить курс' })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Промокод' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Редактировать курс/ }));
    expect(router.state.location.pathname).toBe('/studio/k-rus');
  });

  it('enrolls into a free course', async () => {
    const { user } = renderApp('/course/sp-geo-students', { userId: DEMO_STUDENT_ID });
    await user.click(screen.getByRole('button', { name: 'Записаться бесплатно' }));
    expect(screen.getByText('Вы записаны на курс. Приятной учёбы!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Продолжить обучение/ })).toBeInTheDocument();
  });

  it('asks a guest to sign in before buying', async () => {
    const { user } = renderApp('/course/sp-geo-ege-expert');
    await user.click(screen.getByRole('button', { name: 'Купить курс' }));
    expect(screen.getByRole('dialog', { name: 'Вход в Study Pro' })).toBeInTheDocument();
  });

  it('buys a paid course with a promo code through the demo checkout', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { user } = renderApp('/course/sp-geo-ege-expert', { userId: DEMO_STUDENT_ID });
      await user.type(screen.getByRole('textbox', { name: 'Промокод' }), 'ege2026');
      await user.click(screen.getByRole('button', { name: 'ОК' }));
      expect(screen.getByText(/Промокод «EGE2026»/)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Купить курс' }));
      const dialog = screen.getByRole('dialog', { name: 'Оплата курса' });
      await user.click(within(dialog).getByRole('button', { name: /Оплатить/ }));
      await act(async () => {
        vi.advanceTimersByTime(DEMO_PAYMENT_DELAY_MS);
      });
      expect(screen.getByText(/Оплата прошла/)).toBeInTheDocument();
      const enrollment =
        useAppStore.getState().db.enrollments[`${DEMO_STUDENT_ID}:sp-geo-ege-expert`];
      expect(enrollment).toMatchObject({ amount: 1992, promoCode: 'EGE2026' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('opens the preview lesson but locks the rest for guests', () => {
    renderApp('/learn/sp-geo-ege-expert/sp-geo-ege-expert-l2');
    expect(screen.getByRole('heading', { name: 'Урок доступен после записи' })).toBeInTheDocument();
  });

  it('marks lessons as completed and passes a module test', async () => {
    const { user } = renderApp('/learn/k-math/k-math-l4', { userId: DEMO_STUDENT_ID });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Графики функций и производная',
    );
    await user.click(screen.getByRole('button', { name: /Отметить пройденным/ }));
    expect(screen.getByRole('button', { name: /Пройдено/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('4 из 6 уроков · 67%')).toBeInTheDocument();

    const nav = screen.getAllByRole('navigation', { name: 'Содержание курса' })[0]!;
    await user.click(within(nav).getAllByRole('button', { name: /Тест модуля/ })[1]!);
    const quiz = useAppStore.getState().db.quizzes['k-math-q2']!;
    for (const [index, question] of quiz.questions.entries()) {
      const fieldset = screen.getByRole('group', { name: `Вопрос ${index + 1}` });
      await user.click(
        within(fieldset).getByRole('button', {
          name: new RegExp(question.options[question.correct]!),
        }),
      );
    }
    await user.click(screen.getByRole('button', { name: 'Проверить ответы' }));
    expect(screen.getByText('Тест сдан')).toBeInTheDocument();
    expect(useAppStore.getState().db.quizResults[`${DEMO_STUDENT_ID}:k-math-q2`]?.passed).toBe(
      true,
    );
  });
});

describe('admin', () => {
  it('is closed for non-owners', async () => {
    renderApp('/admin', { userId: DEMO_STUDENT_ID });
    expect(
      await screen.findByText('Доступ есть только у администратора платформы.'),
    ).toBeInTheDocument();
  });

  it('publishes a course from the moderation queue', async () => {
    const { user } = renderApp('/admin', { userId: DEMO_OWNER_ID });
    expect(await screen.findByRole('heading', { name: 'Админ-панель' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Опубликовать$/ }));
    expect(useAppStore.getState().db.courses[DRAFT_COURSE_ID]?.status).toBe('published');
    expect(screen.getByText('Очередь пуста')).toBeInTheDocument();
  });
});

describe('page scroll lock', () => {
  it('locks page scrolling while a dialog is open and releases it afterwards', async () => {
    const { user } = renderApp('/');
    const html = document.documentElement;
    expect(html).not.toHaveClass('scroll-locked');
    await user.click(screen.getAllByRole('button', { name: 'Войти' })[0]!);
    expect(html).toHaveClass('scroll-locked');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(html).not.toHaveClass('scroll-locked');
  });

  it('locks scrolling for the lesson contents drawer', async () => {
    const { user } = renderApp('/learn/k-math/k-math-l1', { userId: DEMO_STUDENT_ID });
    await user.click(screen.getByRole('button', { name: 'Содержание' }));
    const drawer = screen.getByRole('dialog', { name: 'Содержание' });
    expect(document.documentElement).toHaveClass('scroll-locked');
    await user.click(within(drawer).getByRole('button', { name: 'Закрыть' }));
    expect(document.documentElement).not.toHaveClass('scroll-locked');
  });
});

describe('routing', () => {
  it('«Назад» on a directly opened course goes to the catalog instead of leaving the app', async () => {
    const { user, router } = renderApp('/course/k-math');
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(router.state.location.pathname).toBe('/');
  });

  it('redirects old sections into the cabinet and shows 404 for unknown pages', () => {
    renderApp('/studio', { userId: DEMO_TEACHER_ID });
    expect(screen.getByRole('tab', { name: 'Курсы' })).toHaveAttribute('aria-selected', 'true');
  });

  it('shows the not-found page', () => {
    renderApp('/nope');
    expect(screen.getByText('Страница не найдена')).toBeInTheDocument();
  });
});
