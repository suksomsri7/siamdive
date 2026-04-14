import TripCard from "./TripCard";
import Link from "next/link";

type Trip = {
  id: string;
  slug: string;
  title: string;
  price: number;
  duration: string;
  type: "DAYTRIP" | "LIVEABOARD";
  destination: { name: string };
  media: { url: string; alt: string | null }[];
  description?: string;
};

export default function TripRow({ title, trips, viewAllHref, onCardClick }: {
  title: string;
  trips: Trip[];
  viewAllHref?: string;
  onCardClick?: (trip: Trip) => void;
}) {
  if (!trips.length) return null;

  return (
    <section className="mb-8 group/row">
      <div className="px-4 sm:px-10 mb-2 flex items-center gap-3">
        <h2 className="text-sm sm:text-base font-semibold tracking-wide text-gray-100">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref}
            className="text-xs font-medium opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
            style={{ color: "#60a5fa" }}>
            Explore All &rsaquo;
          </Link>
        )}
      </div>
      <div
        className="flex gap-2 overflow-x-auto row-scroll pl-4 sm:pl-10 pr-4"
        style={{ overflowY: "visible", paddingBottom: 8, paddingTop: 4 }}
      >
        {trips.map((trip) => (
          <TripCard
            key={trip.id}
            slug={trip.slug}
            title={trip.title}
            price={trip.price}
            duration={trip.duration}
            type={trip.type}
            destinationName={trip.destination.name}
            imageUrl={trip.media[0]?.url}
            description={trip.description}
            onClick={onCardClick ? () => onCardClick(trip) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
