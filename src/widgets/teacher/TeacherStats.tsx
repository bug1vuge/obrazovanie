import { ChartColumn, Coins, Receipt, ShoppingBag, Star, Users, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import type { User } from '@/entities/types';
import { formatMoney, formatShortDate, plural, WORDS } from '@/shared/lib/format';
import { EmptyState, Reveal, StatCard } from '@/shared/ui';
import { BarList, ColumnChart } from '@/shared/ui/charts';
import { useAppStore } from '@/store/appStore';
import { getTeacherStats, PLATFORM_FEE } from '@/store/selectors';

function Trend({ current, previous }: { current: number; previous: number }) {
  if (!previous) return null;
  const delta = Math.round(((current - previous) / previous) * 100);
  const positive = delta >= 0;
  return (
    <span className={positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
      {positive ? '▲' : '▼'} {Math.abs(delta)}% к тому же периоду прошлого месяца
    </span>
  );
}

/** «Статистика» tab of the teacher cabinet: income from sold courses. */
export function TeacherStats({ user, now }: { user: User; now?: Date }) {
  const db = useAppStore((state) => state.db);
  const stats = useMemo(() => getTeacherStats(db, user.id, now ?? new Date()), [db, user.id, now]);
  const payout = Math.round(stats.revenue * (1 - PLATFORM_FEE));

  return (
    <section aria-labelledby="stats-title">
      <h2 id="stats-title" className="font-display text-lg">
        Статистика и доход
      </h2>
      <p className="muted mt-1 text-[13.5px]">Продажи ваших курсов за всё время и по месяцам.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          icon={Coins}
          label="Доход с продаж"
          value={formatMoney(stats.revenue)}
          hint={<Trend current={stats.revenueThisMonth} previous={stats.revenuePrevMonthToDate} />}
        />
        <StatCard
          icon={Wallet}
          label={`К выплате (комиссия ${Math.round(PLATFORM_FEE * 100)}%)`}
          value={formatMoney(payout)}
        />
        <StatCard icon={ShoppingBag} label="Продано курсов" value={stats.sales} />
        <StatCard icon={Receipt} label="Средний чек" value={formatMoney(stats.averageCheck)} />
        <StatCard icon={Users} label="Учеников" value={stats.students} />
        <StatCard
          icon={Star}
          label={`Средняя оценка · ${stats.reviews} ${plural(stats.reviews, WORDS.review)}`}
          value={stats.rating ? stats.rating.toFixed(1) : '—'}
        />
      </div>

      {stats.sales === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={ChartColumn}
            title="Продаж пока нет"
            text="Опубликуйте платный курс — здесь появятся доход, продажи и графики."
          />
        </div>
      ) : (
        <>
          <Reveal className="card mt-4 p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-display text-[14.5px]">Доход по месяцам</h3>
              <span className="muted text-[12px]">
                В этом месяце: {formatMoney(stats.revenueThisMonth)}
              </span>
            </div>
            <ColumnChart
              title="Доход по месяцам"
              data={stats.byMonth.map((item) => ({ label: item.label, value: item.revenue }))}
              format={formatMoney}
            />
          </Reveal>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Reveal className="card p-4 md:p-5">
              <h3 className="font-display mb-3 text-[14.5px]">Доход по курсам</h3>
              <BarList
                title="Доход по курсам"
                data={stats.byCourse.map((item) => ({ label: item.title, value: item.revenue }))}
                format={formatMoney}
              />
            </Reveal>

            <div className="card overflow-hidden">
              <h3 className="font-display px-4 pt-4 text-[14.5px] md:px-5">Последние продажи</h3>
              <div className="overflow-x-auto">
                <table className="mt-2 w-full text-left text-[12.5px]">
                  <thead className="muted text-[11px] uppercase tracking-wide">
                    <tr className="hairline-b">
                      <th scope="col" className="px-4 py-2 font-semibold md:px-5">
                        Дата
                      </th>
                      <th scope="col" className="px-2 py-2 font-semibold">
                        Ученик
                      </th>
                      <th scope="col" className="px-2 py-2 font-semibold">
                        Курс
                      </th>
                      <th scope="col" className="px-4 py-2 text-right font-semibold md:px-5">
                        Сумма
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgb(var(--line)/0.08)]">
                    {stats.recent.map((sale) => (
                      <tr key={sale.id}>
                        <td className="muted whitespace-nowrap px-4 py-2.5 md:px-5">
                          {formatShortDate(sale.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5">{sale.userName}</td>
                        <td className="max-w-[180px] truncate px-2 py-2.5" title={sale.courseTitle}>
                          {sale.courseTitle}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold md:px-5">
                          {formatMoney(sale.amount)}
                          {sale.promoCode && (
                            <span className="muted block text-[10.5px] font-normal">
                              {sale.promoCode}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
