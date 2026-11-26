"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoaderCircle, Trash2 } from "lucide-react";

type DeleteTarget =
  | { kind: "single"; styleName?: string }
  | { kind: "all" };

interface ThumbnailDeleteDialogProps {
  open: boolean;
  target: DeleteTarget | null;
  isPending: boolean;
  isCooldownActive: boolean;
  error: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function ThumbnailDeleteDialog({
  open,
  target,
  isPending,
  isCooldownActive,
  error,
  onOpenChange,
  onConfirm,
}: ThumbnailDeleteDialogProps) {
  const isBulkDelete = target?.kind === "all";
  const title = isBulkDelete ? "Delete all thumbnails?" : "Delete this thumbnail?";
  const description = isBulkDelete
    ? "This will permanently delete every thumbnail in this job. This action cannot be undone."
    : `This will permanently delete the ${target?.kind === "single" && target.styleName ? target.styleName.replace(/_/g, " ") + " " : ""}thumbnail. This action cannot be undone.`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="gap-6 border-red-500/30 bg-[#171415]">
        <AlertDialogHeader>
          <div className="mb-2 grid size-11 place-items-center rounded-full border border-red-400/30 bg-red-500/10 text-red-300">
            <Trash2 aria-hidden="true" className="size-5" />
          </div>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending || isCooldownActive}
            className="!border-red-400 !text-red-300 hover:!bg-red-500 hover:!text-white"
            onClick={(event) => {
              event.preventDefault();
              if (!isPending && !isCooldownActive) onConfirm();
            }}
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 aria-hidden="true" />}
            {isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export type { DeleteTarget };
