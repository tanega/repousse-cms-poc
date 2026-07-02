import { Roles } from "@/app/(main)/dashboard/roles/_components/roles";
import { roles } from "@/app/(main)/dashboard/roles/_components/roles-table/data";

export default function Page() {
  return <Roles roles={roles} />;
}
