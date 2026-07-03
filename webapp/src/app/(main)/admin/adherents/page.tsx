import { Adherents } from "./_components/adherents";
import { adherents } from "./_components/data";
import { ParcoursMembres } from "./_components/parcours-membres";

export default function MembresPage() {
  return (
    <div className="space-y-6">
      <ParcoursMembres />
      <Adherents adherents={adherents} />
    </div>
  );
}
