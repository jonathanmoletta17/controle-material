
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

    // 2. Reference Value Expiration
    if (item.validadeValorReferencia) {
        const date = new Date(item.validadeValorReferencia);
        if (isBefore(date, now)) {
            alerts.push({ type: "exp_ref_expired", label: "Ref. Vencida", color: "destructive", icon: AlertOctagon });
        } else if (isBefore(date, threeMonthsFromNow)) {
            alerts.push({ type: "exp_ref_near", label: "Ref. Vence Logo", color: "warning", icon: CalendarClock });
        }
    }

    // 3. ATA Expiration
    if (item.validadeAta) {
        const date = new Date(item.validadeAta);
        if (isBefore(date, now)) {
            alerts.push({ type: "exp_ata_expired", label: "ATA Vencida", color: "destructive", icon: AlertOctagon });
        } else if (isBefore(date, threeMonthsFromNow)) {
            alerts.push({ type: "exp_ata_near", label: "ATA Vence Logo", color: "warning", icon: CalendarClock });
        }
    }

    return alerts;
}
