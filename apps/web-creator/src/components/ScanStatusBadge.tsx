import type { ScanStatus } from '@keylaunch/shared';

const STATUS_LABELS: Record<ScanStatus, string> = {
  pending_scan: 'Pendiente',
  scanning: 'Escaneando',
  clean: 'Limpio',
  infected: 'Infectado',
  rejected: 'Rechazado',
};

const STATUS_CLASS: Record<ScanStatus, string> = {
  pending_scan: 'badge-warning',
  scanning: 'badge-warning',
  clean: 'badge-success',
  infected: 'badge-danger',
  rejected: 'badge-danger',
};

export function ScanStatusBadge({ status }: { status: ScanStatus }) {
  return (
    <span className={STATUS_CLASS[status]}>
      {STATUS_LABELS[status]}
    </span>
  );
}
