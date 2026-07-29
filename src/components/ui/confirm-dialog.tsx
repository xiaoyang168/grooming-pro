"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  /** When true, shows a red warning icon and uses destructive button style */
  danger?: boolean
  loading?: boolean
  onConfirm: () => void | Promise<void>
}

/**
 * Replaces the ugly native `window.confirm()` dialog.
 * Usage:
 *   const [open, setOpen] = useState(false)
 *   <ConfirmDialog open={open} onOpenChange={setOpen} title="..." danger onConfirm={doDelete} />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  async function handleConfirm() {
    await onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <div className="flex items-start gap-4">
          {danger && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                variant={danger ? "destructive" : "gradient"}
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {confirmText}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
