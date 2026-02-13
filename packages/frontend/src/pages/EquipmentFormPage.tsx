/**
 * Equipment create / edit form page.
 *
 * - If the URL contains an `:id` param, the form loads the existing equipment
 *   and submits a PUT request on save.
 * - Without an `:id`, the form submits a POST request and redirects to the
 *   new equipment's detail page on success.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createEquipment, getEquipment, updateEquipment } from '../api/equipment';
import { EquipmentCondition } from '../types/api';
import type { CreateEquipmentRequest } from '../types/api';

const CONDITION_OPTIONS = [
  { value: EquipmentCondition.EXCELLENT, label: 'Excellent' },
  { value: EquipmentCondition.GOOD, label: 'Good' },
  { value: EquipmentCondition.FAIR, label: 'Fair' },
  { value: EquipmentCondition.POOR, label: 'Poor' },
  { value: EquipmentCondition.DAMAGED, label: 'Damaged' },
  { value: EquipmentCondition.UNDER_REPAIR, label: 'Under Repair' },
];

interface FormValues {
  name: string;
  description: string;
  category: string;
  dailyRate: string;
  condition: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  category?: string;
  dailyRate?: string;
  condition?: string;
}

const EMPTY_FORM: FormValues = {
  name: '',
  description: '',
  category: '',
  dailyRate: '',
  condition: EquipmentCondition.GOOD,
};

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) {
    errors.name = 'Name is required';
  }
  if (!values.category.trim()) {
    errors.category = 'Category is required';
  }
  const rate = parseFloat(values.dailyRate);
  if (!values.dailyRate.trim()) {
    errors.dailyRate = 'Daily rate is required';
  } else if (isNaN(rate) || rate <= 0) {
    errors.dailyRate = 'Daily rate must be a positive number';
  }
  if (!values.condition) {
    errors.condition = 'Condition is required';
  }
  return errors;
}

export default function EquipmentFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(isEditing);

  // Load existing equipment for the edit flow
  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoadingExisting(true);
    setLoadError(null);

    getEquipment(id)
      .then((equipment) => {
        if (cancelled) return;
        setValues({
          name: equipment.name,
          description: equipment.description,
          category: equipment.category,
          dailyRate: String(equipment.dailyRate),
          condition: equipment.condition,
        });
        setLoadingExisting(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to load equipment';
        setLoadError(msg);
        setLoadingExisting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
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

    const payload: CreateEquipmentRequest = {
      name: values.name.trim(),
      description: values.description.trim(),
      category: values.category.trim(),
      dailyRate: parseFloat(values.dailyRate),
      condition: values.condition as CreateEquipmentRequest['condition'],
    };

    try {
      if (isEditing && id) {
        const updated = await updateEquipment(id, payload);
        navigate(`/equipment/${updated.equipmentId}`);
      } else {
        const created = await createEquipment(payload);
        navigate(`/equipment/${created.equipmentId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setSubmitError(msg);
      setSubmitting(false);
    }
  }

  const pageTitle = isEditing ? 'Edit Equipment' : 'Add Equipment';
  const submitLabel = isEditing ? 'Save Changes' : 'Create Equipment';

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
        <span className="ml-3 text-sm text-gray-500">Loading equipment…</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <Link
          to="/equipment"
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
        to="/equipment"
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
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
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
                placeholder="e.g. DeWalt 20V Cordless Drill"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700"
              >
                Category <span className="text-red-500">*</span>
              </label>
              <input
                id="category"
                name="category"
                type="text"
                value={values.category}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                  errors.category
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
                placeholder="e.g. Power Tools"
              />
              {errors.category && (
                <p className="mt-1 text-xs text-red-600">{errors.category}</p>
              )}
            </div>

            {/* Daily Rate */}
            <div>
              <label
                htmlFor="dailyRate"
                className="block text-sm font-medium text-gray-700"
              >
                Daily Rate ($) <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-400 text-sm">$</span>
                </div>
                <input
                  id="dailyRate"
                  name="dailyRate"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={values.dailyRate}
                  onChange={handleChange}
                  className={`block w-full rounded-md border pl-7 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                    errors.dailyRate
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                  placeholder="25.00"
                />
              </div>
              {errors.dailyRate && (
                <p className="mt-1 text-xs text-red-600">{errors.dailyRate}</p>
              )}
            </div>

            {/* Condition */}
            <div>
              <label
                htmlFor="condition"
                className="block text-sm font-medium text-gray-700"
              >
                Condition <span className="text-red-500">*</span>
              </label>
              <select
                id="condition"
                name="condition"
                value={values.condition}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                  errors.condition
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              >
                {CONDITION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.condition && (
                <p className="mt-1 text-xs text-red-600">{errors.condition}</p>
              )}
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={values.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Optional: describe the equipment, its features, included accessories, etc."
              />
            </div>
          </div>

          {/* Form actions */}
          <div className="mt-8 flex items-center justify-end gap-3">
            <Link
              to={isEditing && id ? `/equipment/${id}` : '/equipment'}
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
