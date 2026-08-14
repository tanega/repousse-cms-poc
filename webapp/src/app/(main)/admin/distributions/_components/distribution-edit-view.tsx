"use client";

import { useMemo } from "react";

import { notFound } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";

import { findEventById } from "@/types/distribution";

import { createSlotCollection, createStockCollection, distributionEventCollection } from "./collection";
import { DistributionForm } from "./distribution-form";

export function DistributionEditView({ id }: { id: string }) {
  const { data: events, isLoading: eventsLoading } = useLiveQuery(distributionEventCollection);
  const event = findEventById(id, events ?? []);

  const slotCollection = useMemo(() => createSlotCollection(id), [id]);
  const stockCollection = useMemo(() => createStockCollection(id), [id]);
  const { data: slots, isLoading: slotsLoading } = useLiveQuery(slotCollection);
  const { data: stocks, isLoading: stocksLoading } = useLiveQuery(stockCollection);

  if (eventsLoading || slotsLoading || stocksLoading) return null;
  if (!event || !slots || !stocks) notFound();

  return (
    <DistributionForm
      mode="edit"
      distributionId={event.id}
      status={event.status}
      defaultValues={{
        title: event.title,
        description: event.description ?? "",
        general_contact: event.general_contact ?? "",
        image_url: event.image_url,
        slots,
        stocks,
      }}
    />
  );
}
