import type { Metadata } from "next";
import BookingLookupForm from "@/components/booking/lookup-form";
import Reveal from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "My Booking",
  description: "Open your Content Colony booking portal — payments, ID verification, stay agreement and studio slots.",
};

export default function BookingIndexPage() {
  return (
    <div className="px-5 md:px-10 py-20 md:py-28">
      <Reveal>
        <BookingLookupForm />
      </Reveal>
      <p className="text-center text-sm text-ink-soft mt-8">
        New here? <a href="/stay#book" className="u-link font-medium">Find your stay</a> first.
      </p>
    </div>
  );
}
