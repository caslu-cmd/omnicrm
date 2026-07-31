import FiscoTela from "@/components/FiscoTela";

/**
 * O Fisco dentro da agência: a tela é a mesma do link compartilhado, só que
 * aqui ela vive dentro do layout do OmniCRM (barra lateral, cabeçalho) e a
 * Carol pode escolher o perfil e gerenciar os links de compartilhamento.
 */
export default function FiscoPage() {
  return <FiscoTela gerenciarLinks />;
}
