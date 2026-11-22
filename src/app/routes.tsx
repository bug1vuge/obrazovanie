import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { CatalogPage } from '@/pages/catalog/CatalogPage';
import { CoursePage } from '@/pages/course/CoursePage';
import { LearnPage } from '@/pages/learn/LearnPage';
import { NotFoundPage } from '@/pages/not-found/NotFoundPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { Spinner } from '@/shared/ui';
import { AppLayout } from '@/widgets/layout/AppLayout';
import { Root } from './Root';

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

export const routes: RouteObject[] = [
  {
    element: <Root />,
    children: [
      { path: '/learn/:courseId/:lessonId?', element: <LearnPage /> },
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <CatalogPage /> },
          { path: 'course/:id', element: <CoursePage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'studio/:id', element: withSuspense(<CourseEditorPage />) },
          { path: 'admin', element: withSuspense(<AdminPage />) },
          { path: 'certificate/:courseId', element: withSuspense(<CertificatePage />) },
          // Former standalone sections now live inside the personal cabinet.
          { path: 'my', element: <Navigate to="/profile?tab=learning" replace /> },
          { path: 'studio', element: <Navigate to="/profile?tab=courses" replace /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
