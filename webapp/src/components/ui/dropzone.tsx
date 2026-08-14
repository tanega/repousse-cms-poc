"use client"

import * as React from "react"
import { useDropzone, type DropzoneOptions, type DropzoneState } from "react-dropzone"
import { Ban, Check, Upload } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface DropzoneContextValue extends DropzoneState {
  disabled?: boolean
}

const DropzoneContext = React.createContext<DropzoneContextValue | null>(null)

function useDropzoneContext() {
  const context = React.useContext(DropzoneContext)
  if (!context) {
    throw new Error("Dropzone parts must be rendered inside a <Dropzone>")
  }
  return context
}

function Dropzone({
  className,
  children,
  ...options
}: DropzoneOptions & { className?: string; children: React.ReactNode }) {
  const dropzoneState = useDropzone(options)

  return (
    <DropzoneContext.Provider value={{ ...dropzoneState, disabled: options.disabled }}>
      <div data-slot="dropzone" className={cn("flex flex-col gap-2", className)}>
        {children}
      </div>
    </DropzoneContext.Provider>
  )
}

function DropzoneZone({ className, ...props }: React.ComponentProps<"div">) {
  const { getRootProps, isDragActive, isDragReject, isFocused, disabled } = useDropzoneContext()

  return (
    <div
      data-slot="dropzone-zone"
      data-drag-active={isDragActive || undefined}
      data-drag-reject={isDragReject || undefined}
      data-focused={isFocused || undefined}
      data-disabled={disabled || undefined}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-colors outline-none",
        "hover:border-foreground/25 hover:bg-muted/50",
        "data-[focused]:border-ring data-[focused]:ring-3 data-[focused]:ring-ring/50",
        "data-[drag-active]:border-primary data-[drag-active]:bg-primary/5",
        "data-[drag-reject]:border-destructive data-[drag-reject]:bg-destructive/5",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...getRootProps()}
      {...props}
    />
  )
}

function DropzoneInput() {
  const { getInputProps } = useDropzoneContext()
  return <input data-slot="dropzone-input" {...getInputProps()} />
}

function DropzoneTrigger({
  className,
  variant = "outline",
  size = "sm",
  type,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { open } = useDropzoneContext()

  return (
    <Button
      data-slot="dropzone-trigger"
      type={type ?? "button"}
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={(e) => {
        e.stopPropagation()
        open()
      }}
      {...props}
    />
  )
}

function DropzoneUploadIcon({ className }: { className?: string }) {
  const { isDragActive, isDragReject } = useDropzoneContext()
  const Icon = isDragReject ? Ban : isDragActive ? Check : Upload

  return <Icon className={cn("size-5 text-muted-foreground", className)} />
}

function DropzoneEmptyState({
  title = "Glissez un fichier ici",
  description = "ou cliquez pour parcourir",
  className,
}: {
  title?: string
  description?: string
  className?: string
}) {
  return (
    <Empty data-slot="dropzone-empty-state" className={cn("border-none p-0", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <DropzoneUploadIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <DropzoneInput />
    </Empty>
  )
}

function DropzoneRejectionError({ className }: { className?: string }) {
  const { fileRejections } = useDropzoneContext()
  if (fileRejections.length === 0) return null

  return (
    <p data-slot="dropzone-rejection-error" className={cn("text-destructive text-xs", className)}>
      {fileRejections[0].errors[0]?.message ?? "Fichier refusé."}
    </p>
  )
}

export {
  Dropzone,
  DropzoneZone,
  DropzoneInput,
  DropzoneTrigger,
  DropzoneUploadIcon,
  DropzoneEmptyState,
  DropzoneRejectionError,
  useDropzoneContext,
}
