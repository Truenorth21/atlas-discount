import { Nav } from "@/components/nav";
import { RegistrationForm } from "@/components/registration-form";

export default async function RouteSellerRegistrationPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <Nav />
      <main className="bg-gradient-to-b from-atlas-light to-white py-10">
        <div className="atlas-container">
          <RegistrationForm type="route_seller" error={params.error} />
        </div>
      </main>
    </>
  );
}
