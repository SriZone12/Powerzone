"use client";

import { useEffect, useState } from "react";
import { FormEvent } from "react";
import { Pencil, Trash2, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { MEMBERSHIP_PLANS } from "@/lib/plans";
import { friendlyError } from "@/lib/errors";

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
];

const inputClass =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:focus:border-white";

type Member = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  membership_plan: string | null;
  status: string | null;
  membership_end: string | null;
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function refresh() {
    const { data, error } = await supabase.from("members").select("*").order("full_name");
    setError(error ? friendlyError(error.code) : null);
    if (data) setMembers(data);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase.from("members").select("*").order("full_name");

      if (cancelled) return;

      if (error) {
        setError(friendlyError(error.code));
      } else {
        setMembers(data ?? []);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError(null);
    const { error } = await supabase.from("members").delete().eq("id", deleteTarget.id);
    setDeleting(false);

    if (error) {
      setDeleteError(friendlyError(error.code));
      return;
    }

    setDeleteTarget(null);
    await refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-white">
        Members
      </h1>
      <div className="mt-3 h-px w-16 bg-neutral-300 dark:bg-neutral-700" />
      <p className="mt-4 text-neutral-500 dark:text-neutral-400">
        Manage all registered gym members.
      </p>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
        {loading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-16">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-600 dark:border-t-white" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading members…</p>
          </div>
        ) : members.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              No members yet
            </p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Members will appear here once you add them.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                  <th className="px-6 py-3 font-medium">Full Name</th>
                  <th className="px-6 py-3 font-medium">Phone</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Membership Plan</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Membership End Date</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  >
                    <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">
                      {member.full_name}
                    </td>
                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">
                      {member.phone ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">
                      {member.email ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      {member.membership_plan ? (
                        <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
                          {member.membership_plan}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={member.status} />
                    </td>
                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">
                      {member.membership_end ? formatDate(member.membership_end) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditMember(member)}
                          aria-label={`Edit ${member.full_name}`}
                          className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-blue-500/10 hover:text-blue-600 dark:text-neutral-400 dark:hover:bg-blue-500/15 dark:hover:text-blue-400"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget(member);
                            setDeleteError(null);
                          }}
                          aria-label={`Delete ${member.full_name}`}
                          className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editMember && (
        <EditMemberModal
          member={editMember}
          onClose={() => setEditMember(null)}
          onSaved={refresh}
        />
      )}

      {deleteTarget && (
        <Modal title="Delete member" onClose={() => !deleting && setDeleteTarget(null)}>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Are you sure you want to delete{" "}
            <span className="font-medium text-neutral-900 dark:text-white">
              {deleteTarget.full_name}
            </span>
            ? This action cannot be undone.
          </p>

          {deleteError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              {deleteError}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function EditMemberModal({
  member,
  onClose,
  onSaved,
}: {
  member: Member;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [fullName, setFullName] = useState(member.full_name);
  const [phone, setPhone] = useState(member.phone ?? "");
  const [email, setEmail] = useState(member.email ?? "");
  const [plan, setPlan] = useState(member.membership_plan ?? MEMBERSHIP_PLANS[0].label);
  const [status, setStatus] = useState(member.status ?? "active");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError(null);

    if (!fullName.trim()) {
      setSaveError("Full Name is required.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("members")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        membership_plan: plan,
        status,
      })
      .eq("id", member.id);
    setSaving(false);

    if (error) {
      setSaveError(friendlyError(error.code));
      return;
    }

    await onSaved();
    onClose();
  }

  return (
    <Modal title="Edit Member" onClose={() => !saving && onClose()}>
      {saveError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {saveError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Full Name" htmlFor="edit-name" required>
          <input
            id="edit-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={saving}
            className={inputClass}
          />
        </Field>

        <Field label="Phone" htmlFor="edit-phone">
          <input
            id="edit-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={saving}
            className={inputClass}
          />
        </Field>

        <Field label="Email" htmlFor="edit-email">
          <input
            id="edit-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={saving}
            className={inputClass}
          />
        </Field>

        <Field label="Membership Plan" htmlFor="edit-plan">
          <select
            id="edit-plan"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            disabled={saving}
            className={inputClass}
          >
            {MEMBERSHIP_PLANS.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status" htmlFor="edit-status">
          <select
            id="edit-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={saving}
            className={inputClass}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
      >
        {label}
        {required && <span className="text-red-500 dark:text-red-400"> *</span>}
      </label>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-neutral-400">—</span>;

  const active = status.toLowerCase() === "active";

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
      }`}
    >
      {status}
    </span>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}