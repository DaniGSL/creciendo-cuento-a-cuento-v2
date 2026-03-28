export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen"
      style={{ background: "#F3F4F6" }}
    >
      {children}
    </div>
  );
}
