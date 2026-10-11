"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api/notifications";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/notification";

const POLL_INTERVAL_MS = 60_000;

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function NotificationBell() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { items, unreadCount } = await fetchNotifications();
      setItems(items);
      setUnread(unreadCount);
    } catch {
      // Silent: the bell is a convenience, a failed poll must not disturb the page.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  async function handleOpenItem(n: AppNotification) {
    setOpen(false);
    if (!n.read_at) {
      await markNotificationRead(n.id).catch(() => undefined);
      void refresh();
    }
  }

  async function handleReadAll() {
    await markAllNotificationsRead().catch(() => undefined);
    void refresh();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 && (
            <Badge
              data-testid="notification-count"
              className="-top-1 -right-1 absolute h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
            >
              {unread > 9 ? "9+" : unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="font-medium text-sm">Notifications</span>
          {unread > 0 && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={handleReadAll}>
              Tout marquer comme lu
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="px-3 py-8 text-center text-muted-foreground text-sm">Aucune notification</p>
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id}>
                  <NotificationRow notification={n} onOpen={() => handleOpenItem(n)} />
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({ notification: n, onOpen }: { notification: AppNotification; onOpen: () => void }) {
  const content = (
    <div className={cn("flex gap-2 px-3 py-2.5 text-left hover:bg-muted/50", !n.read_at && "bg-primary/5")}>
      <span
        className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-primary")}
        aria-hidden
      />
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium text-sm leading-snug">{n.title}</p>
        {n.body && <p className="text-muted-foreground text-xs">{n.body}</p>}
        <p className="text-muted-foreground text-[11px]">{dateFormat.format(new Date(n.inserted_at))}</p>
      </div>
    </div>
  );

  return n.link ? (
    <Link href={n.link} onClick={onOpen} className="block">
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onOpen} className="block w-full">
      {content}
    </button>
  );
}
