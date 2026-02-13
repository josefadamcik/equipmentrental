/**
 * Member create / edit form page.
 *
 * - If the URL contains an `:id` param, the form loads the existing member
 *   and submits a PUT request on save.
 * - Without an `:id`, the form submits a POST request and redirects to the
 *   new member's detail page on success.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createMember, getMember, updateMember } from '../api/members';
import { MembershipTier } from '../types/api';

const TIER_OPTIONS = [
  { value: MembershipTier.BASIC, label: 'Basic' },
  { value: MembershipTier.SILVER, label: 'Silver' },
  { value: MembershipTier.GOLD, label: 'Gold' },
  { value: MembershipTier.PLATINUM, label: 'Platinum' },
];

interface FormValues {
  name: string;
  email: string;
  tier: string;
  isActive: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  tier?: string;
}

const EMPTY_FORM: FormValues = {
  name: '',
  email: '',
  tier: MembershipTier.BASIC,
  isActive: true,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) {
    errors.name = 'Name is required';
  }
  if (!values.email.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address';
  }
  if (!values.tier) {
    errors.tier = 'Tier is required';
  }
  return errors;
}

export default function MemberFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(isEditing);

  // Load existing member for the edit flow
  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoadingExisting(true);
    setLoadError(null);

    getMember(id)
      .then((member) => {
        if (cancelled) return;
        setValues({
          name: member.name,
          email: member.email,
          tier: member.tier,
          isActive: member.isActive,
        });
        setLoadingExisting(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to load member';
        setLoadError(msg);
        setLoadingExisting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = e.target;
    const newValue =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setValues((prev) => ({ ...prev, [name]: newValue }));
    // Clear the field-level error as the user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const fieldErrors = validate(values);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditing && id) {
        const updated = await updateMember(id, {
          name: values.name.trim(),
          email: values.email.trim(),
          tier: values.tier as (typeof MembershipTier)[keyof typeof MembershipTier],
          isActive: values.isActive,
        });
        navigate(`/members/${updated.memberId}`);
      } else {
        const created = await createMember({
          name: values.name.trim(),
          email: values.email.trim(),
          tier: values.tier as (typeof MembershipTier)[keyof typeof MembershipTier],
        });
        navigate(`/members/${created.memberId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setSubmitError(msg);
      setSubmitting(false);
    }
  }

  const pageTitle = isEditing ? 'Edit Member' : 'Add Member';
  const submitLabel = isEditing ? 'Save Changes' : 'Create Member';

  if (loadingExisting) {
    return (
      <div className="flex items-center justify-center py-16">
        <svg
          className="h-8 w-8 animate-spin text-indigo-600"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span className="ml-3 text-sm text-gray-500">Loading member…</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <Link
          to="/members"
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          <svg
            className="mr-1 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to list
        </Link>
        <div className="mt-4 rounded-lg bg-red-50 p-4 shadow">
          <p className="text-sm font-medium text-red-800">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link
        to="/members"
        className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        <svg
          className="mr-1 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to list
      </Link>

      {/* Page header */}
      <div className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
      </div>

      {/* Form card */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
        {submitError && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="ml-3 text-sm text-red-700">{submitError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Name */}
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={values.name}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                  errors.name
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
                placeholder="e.g. Jane Smith"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="sm:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                  errors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
                placeholder="e.g. jane@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Tier */}
            <div>
              <label htmlFor="tier" className="block text-sm font-medium text-gray-700">
                Membership Tier <span className="text-red-500">*</span>
              </label>
              <select
                id="tier"
                name="tier"
                value={values.tier}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                  errors.tier
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              >
                {TIER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.tier && (
                <p className="mt-1 text-xs text-red-600">{errors.tier}</p>
              )}
            </div>

            {/* Active status (edit only) */}
            {isEditing && (
              <div className="flex items-center gap-3 self-end pb-2">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={values.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active member
                </label>
              </div>
            )}
          </div>

          {/* Form actions */}
          <div className="mt-8 flex items-center justify-end gap-3">
            <Link
              to={isEditing && id ? `/members/${id}` : '/members'}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {submitting && (
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {submitting ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
