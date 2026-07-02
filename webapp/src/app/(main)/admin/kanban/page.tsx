import { initialBoard } from "@/app/(main)/dashboard/kanban/_components/data";
import { Kanban } from "@/app/(main)/dashboard/kanban/_components/kanban";

export default function Page() {
  return (
    <div data-content-padding="false">
      <Kanban initialBoard={initialBoard} />
    </div>
  );
}
