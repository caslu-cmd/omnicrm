import { useSearchParams } from "react-router-dom";
import CarrosselStudio from "@/components/CarrosselStudio";

/**
 * Rota direta do estúdio (/carrossel). O lugar oficial da ferramenta é a aba
 * "Carrossel & Posts" dentro do workspace de cada cliente — esta rota existe
 * para abrir o estúdio solto, sem cliente definido.
 */
export default function CarrosselPage() {
  const [searchParams] = useSearchParams();
  return <CarrosselStudio clientIdInicial={searchParams.get("cliente") ?? ""} />;
}
