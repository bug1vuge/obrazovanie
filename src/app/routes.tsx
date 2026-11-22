import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CatalogPage } from '@/pages/catalog/CatalogPage';
import { CoursePage } from '@/pages/course/CoursePage';
import { LearnPage } from '@/pages/learn/LearnPage';
import { NotFoundPage } from '@/pages/not-found/NotFoundPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { Spinner } from '@/shared/ui';
import { AppLayout } from '@/widgets/layout/AppLayout';

// Rarely visited screens are split into separate chunks.
const CourseEditorPage = lazy(() =>
  import('@/pages/studio/CourseEditorPage').then((module) => ({
    default: module.CourseEditorPage,
  })),
);
const AdminPage = lazy(() =>
  import('@/pages/admin/AdminPage').then((module) => ({ default: module.AdminPage })),
);
const CertificatePage = lazy(() =>
  import('@/pages/certificate/CertificatePage').then((module) => ({
    default: module.CertificatePage,
  })),
);

const withSuspense = (node: ReactNode) => <Suspense fallback={<Spinner />}>{node}</Suspense>;

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/learn/:courseId/:lessonId?" element={<LearnPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<CatalogPage />} />
        <Route path="course/:id" element={<CoursePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="studio/:id" element={withSuspense(<CourseEditorPage />)} />
        <Route path="admin" element={withSuspense(<AdminPage />)} />
        <Route path="certificate/:courseId" element={withSuspense(<CertificatePage />)} />
        {/* Former standalone sections now live inside the personal cabinet. */}
        <Route path="my" element={<Navigate to="/profile?tab=learning" replace />} />
        <Route path="studio" element={<Navigate to="/profile?tab=courses" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
