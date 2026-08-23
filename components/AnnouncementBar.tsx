export default function AnnouncementBar({ text }: { text: string }) {
  return (
    <div className="w-full bg-brand-gradient py-2 text-center text-sm font-medium text-white">
      <div className="container-xpera">{text}</div>
    </div>
  );
}
