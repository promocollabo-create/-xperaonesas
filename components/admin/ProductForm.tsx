"use client";

import { useState, useTransition } from "react";
import { saveProductAction, deleteProductImageAction } from "../../lib/admin/productActions";
import type { Category, ProductWithImages } from "../../types/database";

export default function ProductForm({
  product,
  categories
}: {
  product?: ProductWithImages;
  categories: Category[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const result = await saveProductAction(formData);
          if (result?.error) setError(result.error);
        })
      }
      encType="multipart/form-data"
      className="grid grid-cols-1 gap-6 lg:grid-cols-3"
    >
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="flex flex-col gap-4 lg:col-span-2">
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <Card title="General">
          <Field label="Name" name="name" defaultValue={product?.name} required />
          <Field label="Slug" name="slug" defaultValue={product?.slug} required placeholder="my-product-name" />
          <Field label="Short Description" name="short_description" defaultValue={product?.short_description ?? ""} />
          <TextArea label="Description" name="description" defaultValue={product?.description ?? ""} rows={6} />
          <TextArea label="Features (one per line)" name="features" defaultValue={product?.features?.join("\n") ?? ""} rows={4} />
          <Field label="License" name="license" defaultValue={product?.license ?? ""} />
          <Field label="Tags (comma-separated)" name="tags" defaultValue={product?.tags?.join(", ") ?? ""} />
        </Card>

        <Card title="Media">
          {product?.product_images && product.product_images.length > 0 && (
            <div className="mb-4 grid grid-cols-4 gap-3">
              {product.product_images.map((img) => (
                <div key={img.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="aspect-square rounded-lg object-cover" />
                  <form action={deleteProductImageAction} className="absolute right-1 top-1">
                    <input type="hidden" name="imageId" value={img.id} />
                    <input type="hidden" name="productId" value={product.id} />
                    <button className="rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">×</button>
                  </form>
                </div>
              ))}
            </div>
          )}
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Add Images
            <input type="file" name="images" accept="image/*" multiple className="text-sm" />
          </label>
          <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Digital File {product?.digital_file_name && <span className="text-xs text-slate-400">(current: {product.digital_file_name})</span>}
            <input type="file" name="digitalFile" className="text-sm" />
          </label>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card title="Pricing & Status">
          <Field label="Price" name="price" type="number" step="0.01" defaultValue={String(product?.price ?? "")} required />
          <Field label="Sale Price (optional)" name="sale_price" type="number" step="0.01" defaultValue={product?.sale_price != null ? String(product.sale_price) : ""} />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Status
            <select name="status" defaultValue={product?.status ?? "draft"} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Category
            <select name="category_id" defaultValue={product?.category_id ?? ""} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm">
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="is_new" defaultChecked={product?.is_new} /> Mark as NEW
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="is_featured" defaultChecked={product?.is_featured} /> Mark as Featured
          </label>
        </Card>

        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Saving..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card flex flex-col gap-4 p-6">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}
function Field({ label, name, type = "text", defaultValue, required, placeholder, step }: any) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        step={step}
        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
      />
    </label>
  );
}
function TextArea({ label, name, defaultValue, rows }: any) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
      />
    </label>
  );
}
