import { CreditCard, Lock, Tag } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { applyPromo } from '@/entities/enrollment/lib';
import type { Course, PromoCode } from '@/entities/types';
import { formatPrice } from '@/shared/lib/format';
import { Button, Modal, Notice } from '@/shared/ui';
import { useAppStore } from '@/store/appStore';
import { errorMessage } from '@/store/errors';

/** Delay that imitates the payment provider round-trip in the demo. */
export const DEMO_PAYMENT_DELAY_MS = 900;

interface CheckoutDialogProps {
  course: Course;
  promo: PromoCode | null;
  open: boolean;
  onClose: () => void;
  onPaid: () => void;
}

export function CheckoutDialog({ course, promo, open, onClose, onPaid }: CheckoutDialogProps) {
  const enroll = useAppStore((state) => state.enroll);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const total = applyPromo(course.price, promo);

  useEffect(() => () => clearTimeout(timer.current), []);

  const pay = () => {
    setError('');
    setProcessing(true);
    timer.current = setTimeout(() => {
      try {
        enroll(course.id, promo?.code ?? null);
        onPaid();
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setProcessing(false);
      }
    }, DEMO_PAYMENT_DELAY_MS);
  };

  return (
    <Modal
      open={open}
      onClose={processing ? () => undefined : onClose}
      title="Оплата курса"
      maxWidth="max-w-md"
      footer={
        <Button size="lg" className="w-full" onClick={pay} disabled={processing}>
          <CreditCard size={17} aria-hidden />
          {processing ? 'Проводим оплату…' : `Оплатить ${formatPrice(total)}`}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="soft-bg rounded-2xl p-4">
          <p className="muted text-[12px] uppercase tracking-wide">Курс</p>
          <p className="font-display mt-1 text-[15px] leading-snug">{course.title}</p>
          <p className="muted mt-1 text-[12.5px]">{course.teacherName}</p>
        </div>
        <dl className="flex flex-col gap-2 text-[14px]">
          <div className="flex justify-between">
            <dt className="muted">Стоимость</dt>
            <dd>{formatPrice(course.price)}</dd>
          </div>
          {promo && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <dt className="inline-flex items-center gap-1">
                <Tag size={13} aria-hidden /> Промокод {promo.code}
              </dt>
              <dd>−{promo.percent}%</dd>
            </div>
          )}
          <div className="hairline-t flex justify-between pt-2 font-semibold">
            <dt>Итого</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>
        {error && <Notice tone="error">{error}</Notice>}
        <p className="muted flex items-start gap-2 text-[12px] leading-snug">
          <Lock size={14} className="mt-0.5 shrink-0" aria-hidden />
          Демо-режим: оплата имитируется, деньги не списываются. В рабочей версии здесь будет
          платёжный сервис.
        </p>
      </div>
    </Modal>
  );
}
