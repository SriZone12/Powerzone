import { addMonths, daysUntil } from "./dates";
import { MEMBERSHIP_PLANS } from "./plans";

export type RenewalPreview = {
  /** The date the new period stacks on top of. */
  base: string;
  /** The membership_end this member ends up with. */
  nextEnd: string;
  /** True when the membership had already lapsed, so the period restarts today. */
  restarts: boolean;
  /** Plan label to write back to membership_plan. */
  planLabel: string;
  /** Whole days already paid for and carried into the new period. */
  carriedOverDays: number;
};

// membership_plan stores the plan LABEL (e.g. "3-months"), not the id.
export function findPlanByLabel(label: string | null) {
  return MEMBERSHIP_PLANS.find((plan) => plan.label === label) ?? null;
}

/**
 * Works out what renewing would do, without touching the database.
 *
 * A renewal stacks on top of max(today, current membership_end) rather than
 * starting from today. If an owner renews a member early, resetting the clock
 * from today would silently discard days the gym owner already paid for, so
 * the remaining days are carried into the new period instead. Only a lapsed
 * membership restarts from today.
 */
export function previewRenewal({
  membershipEnd,
  planId,
  today,
}: {
  membershipEnd: string | null;
  planId: string;
  today: string;
}): RenewalPreview | null {
  const plan = MEMBERSHIP_PLANS.find((p) => p.id === planId);
  if (!plan) return null;

  const remaining = membershipEnd ? daysUntil(membershipEnd, today) : null;
  const lapsed = remaining === null || remaining <= 0;
  const base = lapsed ? today : (membershipEnd as string);

  return {
    base,
    nextEnd: addMonths(base, plan.months),
    restarts: lapsed,
    planLabel: plan.label,
    carriedOverDays: lapsed ? 0 : (remaining as number),
  };
}
