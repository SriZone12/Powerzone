"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { friendlyError } from "@/lib/errors";
import { MEMBERSHIP_PLANS } from "@/lib/plans";
import { findPlanByLabel, previewRenewal } from "@/lib/renew";
import { formatYmd, todayYmd } from "@/lib/dates";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui";
import { Modal, Field } from "./Modal";

export type RenewableMember = {
  id: string;
  full_name: string | null;
  membership_plan: string | null;
  membership_end: string | null;
};

/**
 * Owner-only action: extend a membership by a plan. Deliberately not exposed
 * to members — this app has a single admin operator.
 */
export default function RenewModal({
  member,
  onClose,
  onRenewed,
}: {
  member: RenewableMember;
  onClose: () => void;
  onRenewed: () => void | Promise<void>;
}) {
  const currentPlan = findPlanByLabel(member.membership_plan);
  const [planId, setPlanId] = useState(currentPlan?.id ?? MEMBERSHIP_PLANS[0].id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const preview = useMemo(
    () =>
      previewRenewal({ membershipEnd: member.membership_end, planId, today: todayYmd() }),
    [member.membership_end, planId]
  );

  async function handleRenew() {
    if (!preview) return;

    setSaving(true);
    setError(null);

    // membership_start is intentionally left alone: it records when the member
    // originally joined and isn't shown anywhere in the app.
    const { error } = await supabase
      .from("members")
      .update({
        membership_end: preview.nextEnd,
        membership_plan: preview.planLabel,
        status: "active",
      })
      .eq("id", member.id);

    setSaving(false);

    if (error) {
      setError(friendlyError(error.code));
      return;
    }

    setSuccess(`Renewed until ${formatYmd(preview.nextEnd)}.`);
    await onRenewed();
  }

  return (
    <Modal title="Renew Membership" onClose={onClose}>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Renewing{" "}
        <span className="font-medium text-neutral-900 dark:text-white">
          {member.full_name ?? "this member"}
        </span>
        {member.membership_end ? (
          <>
            {" "}· currently expires {formatYmd(member.membership_end)}
            {currentPlan ? ` (${currentPlan.label})` : ""}
          </>
        ) : (
          " · no expiry date on record"
        )}
      </p>

      <div className="mt-4">
        <Field label="Plan" htmlFor="renew-plan" required>
          <select
            id="renew-plan"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            disabled={saving}
            className={inputClass}
          >
            {MEMBERSHIP_PLANS.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {preview && (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-800/50">
          <p className="text-neutral-600 dark:text-neutral-300">
            {preview.restarts ? (
              <>
                New period starts <span className="font-medium">today</span> (already
                lapsed)
              </>
            ) : (
              <>
                Stacks on {formatYmd(preview.base)} — keeps{" "}
                <span className="font-medium">{preview.carriedOverDays}</span>{" "}
                {preview.carriedOverDays === 1 ? "day" : "days"} already paid
              </>
            )}
          </p>
          <p className="mt-1 font-medium text-neutral-900 dark:text-white">
            New expiry: {formatYmd(preview.nextEnd)}
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          {success}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className={secondaryButtonClass}
        >
          {success ? "Done" : "Cancel"}
        </button>
        <button
          type="button"
          onClick={handleRenew}
          disabled={saving || !preview || !!success}
          className={primaryButtonClass}
        >
          {saving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-white dark:border-neutral-400 dark:border-t-neutral-900" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {saving ? "Renewing…" : "Renew"}
        </button>
      </div>
    </Modal>
  );
}
