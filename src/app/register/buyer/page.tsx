import { Nav } from "@/components/nav";
import { RegistrationForm } from "@/components/registration-form";

export default async function BuyerRegistrationPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <Nav />
      <main className="atlas-container py-10">
        <RegistrationForm type="buyer" error={params.error} />
      </main>
    </>
  );
}
