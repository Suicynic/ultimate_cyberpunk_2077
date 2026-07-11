import type { Metadata } from "next";
import { DistrictScan } from "@/app/map/DistrictScan";

export const metadata: Metadata = {
  title: "District Scan",
  description:
    "An original, deliberately approximate schematic map of Night City and Dogtown — browse fast-travel points, vendors, ripperdocs, collectibles and more, with per-run discovery and completion tracking.",
};

export default function MapPage() {
  return <DistrictScan />;
}
