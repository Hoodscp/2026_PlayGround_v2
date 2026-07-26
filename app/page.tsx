import { HomePage as HomePageContent } from "./components/home/home-page";
import {
  SECTION_COPY,
  type SectionName,
} from "./components/navigation/sections";

export const dynamic = "force-static";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section } = await searchParams;
  const initialSection = Object.keys(SECTION_COPY).find(
    (name) => name.toLowerCase() === section,
  ) as SectionName | undefined;

  return <HomePageContent initialSection={initialSection} />;
}
