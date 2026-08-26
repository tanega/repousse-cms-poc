import { QueryClient } from "@tanstack/query-core";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";

import {
  type AdminUserAttrs,
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
} from "@/lib/api/admin-users";
import type { CurrentUser } from "@/types/user";

const queryClient = new QueryClient();

/** Optimistic drafts only ever set these — strip the rest before hitting the API. */
function toAttrs(u: Partial<CurrentUser>): AdminUserAttrs {
  return {
    email: u.email,
    first_name: u.first_name ?? undefined,
    last_name: u.last_name ?? undefined,
    status: u.status,
    adhesion_active: u.adhesion_active,
    membership_year: u.membership_year ?? undefined,
  };
}

export const adherentCollection = createCollection(
  queryCollectionOptions<CurrentUser>({
    queryKey: ["admin-users"],
    queryFn: fetchAdminUsers,
    queryClient,
    getKey: (user) => user.id,
    onInsert: async ({ transaction }) => {
      await Promise.all(transaction.mutations.map((m) => createAdminUser(toAttrs(m.modified))));
    },
    onUpdate: async ({ transaction }) => {
      await Promise.all(transaction.mutations.map((m) => updateAdminUser(String(m.key), toAttrs(m.changes))));
    },
    onDelete: async ({ transaction }) => {
      await Promise.all(transaction.mutations.map((m) => deleteAdminUser(String(m.key))));
    },
  }),
);
