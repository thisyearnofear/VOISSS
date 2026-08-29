import MascotLoader from "@/components/MascotLoader";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <MascotLoader label="Loading VOISSS…" size="lg" />
    </div>
  );
}
