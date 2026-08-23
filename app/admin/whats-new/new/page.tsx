import { saveWhatsNewAction } from "../../../../lib/admin/whatsNewActions";

export default function NewWhatsNewPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">New What's New Post</h1>
      <form action={saveWhatsNewAction} encType="multipart/form-data" className="card flex max-w-xl flex-col gap-4 p-6">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Type
          <select name="type" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm">
            <option value="announcement">Announcement</option>
            <option value="news">News</option>
            <option value="product_release">Product Release</option>
            <option value="update">Update</option>
            <option value="offer">Offer</option>
          </select>
        </label>
        <input name="title" placeholder="Title" required className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
        <input name="slug" placeholder="slug" required className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
        <textarea name="content" placeholder="Content" rows={6} required className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
        <input type="file" name="image" accept="image/*" className="text-sm" />
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Status
          <select name="status" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <button className="btn-primary">Save</button>
      </form>
    </div>
  );
}
