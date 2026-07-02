import { AdherentForm } from "../../_components/adherent-form";

export default function ModifierAdherentPage() {
  return (
    <AdherentForm
      mode="edit"
      defaultValues={{
        firstName: "Marie",
        lastName: "Dupont",
        email: "marie.dupont@gmail.com",
        profileTypes: ["Administrateur", "Bénévole"],
        status: "Actif",
        source: "Manuel",
        memberSince: "2020-01-10",
      }}
    />
  );
}
