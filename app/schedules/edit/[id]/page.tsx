// app/schedules/edit/[id]/page.tsx
import { NextPage } from 'next';
import EditScheduleForm from './EditScheduleForm';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const Page: NextPage<PageProps> = async ({ params }) => {
  const { id } = await params;
  
  return <EditScheduleForm scheduleId={id} />;
};

export default Page;