import { getHomeMarkup } from "./lib/legacy-content";

export const dynamic = "force-static";

export default function HomePage() {
  const markup = getHomeMarkup();

  return (
    <>
      <div
        id="home-page"
        className="route-page route-page--home"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: markup }}
      />
      <script src="/legacy-script" defer />
    </>
  );
}
