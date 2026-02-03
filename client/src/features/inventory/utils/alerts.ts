
import { addMonths, isBefore } from "date-fns";
import type { Item } from "@shared/schema";
import { AlertOctagon, CalendarClock } from "lucide-react";

export type AlertType =
    | "st_disabled"
    | "st_negative"
    | "st_low"
    | "exp_ref_expired"
    | "exp_ref_near"
    | "exp_ata_expired"
    | "exp_ata_near";

export interface ItemAlert {
    type: AlertType;
    label: string;
    color: "secondary" | "destructive" | "warning";
    icon?: any;
}

export function getItemAlerts(item: Item): ItemAlert[] {
    const alerts: ItemAlert[] = [];
    const now = new Date();
    const threeMonthsFromNow = addMonths(now, 3);

    // 1. Stock Alerts
    if (!item.ativo) {
        alerts.push({ type: "st_disabled", label: "Desativado", color: "secondary" });
    } else if (item.estoqueAtual < 0) {
        alerts.push({ type: "st_negative", label: "Negativo", color: "destructive" });
    } else if (item.estoqueAtual <= item.estoqueMinimo) {
        alerts.push({ type: "st_low", label: "Baixo Estoque", color: "destructive" });
    }

    // 2. Expiration Alerts (Strict Rule: Both must match if both exist)
    const hasRef = !!item.validadeValorReferencia;
    const hasAta = !!item.validadeAta;

    if (hasRef || hasAta) {
        let refDate = hasRef ? new Date(item.validadeValorReferencia!) : null;
        let ataDate = hasAta ? new Date(item.validadeAta!) : null;

        // Check Expired
        let isExpired = false;
        if (hasRef && hasAta) {
            isExpired = isBefore(refDate!, now) && isBefore(ataDate!, now);
        } else if (hasRef) {
            isExpired = isBefore(refDate!, now);
        } else if (hasAta) {
            isExpired = isBefore(ataDate!, now);
        }

        if (isExpired) {
            // If strictly expired, show badges for what is expired
            // Or just a general "Vencido" badge?
            // "Validation rule applies to the ITEM". 
            // If item is expired, show the specific dates causing it.
            if (hasRef && isBefore(refDate!, now)) alerts.push({ type: "exp_ref_expired", label: "Ref. Vencida", color: "destructive", icon: AlertOctagon });
            if (hasAta && isBefore(ataDate!, now)) alerts.push({ type: "exp_ata_expired", label: "ATA Vencida", color: "destructive", icon: AlertOctagon });
        } else {
            // Check Expiring (Only if not expired)
            // Logic: Both must be expiring (or already expired?) 
            // Actually, if one is Expired and one is Expiring -> Item is Expiring?
            // User Rule: "Considerado A VENCER... se AMBOS a vencer".

            let isRefExpiring = hasRef && isBefore(refDate!, threeMonthsFromNow); // Note: This includes expired dates technically
            let isAtaExpiring = hasAta && isBefore(ataDate!, threeMonthsFromNow);

            let isExpiring = false;
            if (hasRef && hasAta) {
                isExpiring = isRefExpiring && isAtaExpiring;
            } else if (hasRef) {
                isExpiring = isRefExpiring;
            } else if (hasAta) {
                isExpiring = isAtaExpiring;
            }

            if (isExpiring) {
                if (hasRef && isRefExpiring) {
                    // Determine label based on if it's already expired or just near
                    const label = isBefore(refDate!, now) ? "Ref. Vencida" : "Ref. Vence Logo";
                    const color = isBefore(refDate!, now) ? "destructive" : "warning";
                    alerts.push({ type: "exp_ref_near", label, color, icon: CalendarClock });
                }
                if (hasAta && isAtaExpiring) {
                    const label = isBefore(ataDate!, now) ? "ATA Vencida" : "ATA Vence Logo";
                    const color = isBefore(ataDate!, now) ? "destructive" : "warning";
                    alerts.push({ type: "exp_ata_near", label, color, icon: CalendarClock });
                }
            }
        }
    }

    return alerts;
}
