import { redirect } from 'next/navigation';

// os planos agora ficam numa página só, aberta a todos
export default function PlanosAluno() {
  redirect('/planos');
}
