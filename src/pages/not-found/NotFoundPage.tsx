import { Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, EmptyState } from '@/shared/ui';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <EmptyState
        icon={Compass}
        title="Страница не найдена"
        text="Возможно, ссылка устарела. Начните с каталога курсов."
        action={<Button onClick={() => navigate('/')}>В каталог</Button>}
      />
    </div>
  );
}
