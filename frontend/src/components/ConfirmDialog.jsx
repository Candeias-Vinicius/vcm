import { AlertTriangle } from 'lucide-react';

/**
 * Custom confirm dialog matching the app's dark design.
 * Replaces native window.confirm().
 *
 * Usage:
 *   <ConfirmDialog
 *     open={open}
 *     message="Tem certeza?"
 *     confirmLabel="Confirmar"
 *     danger      // makes confirm button red (default: true)
 *     onConfirm={() => { ... }}
 *     onCancel={() => setOpen(false)}
 *   />
 */
export default function ConfirmDialog({
  open,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = true,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center px-4">
      <div className="bg-valorant-card border border-valorant-border rounded-2xl p-5 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-gray-200 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-valorant-border text-gray-400 hover:text-white hover:border-gray-500 text-sm transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white text-sm font-bold transition-colors ${
              danger
                ? 'bg-valorant-red hover:bg-red-700'
                : 'bg-green-700 hover:bg-green-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
