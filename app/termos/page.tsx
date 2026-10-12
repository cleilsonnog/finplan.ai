import type { Metadata } from "next";
import LegalDocument, { type LegalSection } from "../_components/legal-document";
import { LEGAL } from "../_lib/legal";
import { SITE_URL } from "../_lib/site";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Regras de uso do FinPlan.ai: planos, pagamentos, cancelamento, reembolso e responsabilidades.",
  alternates: { canonical: "/termos" },
};

// Plan limits and prices must match the subscription page and CLAUDE.md "Pricing"
const SECTIONS: LegalSection[] = [
  {
    title: "Sobre o serviço",
    paragraphs: [
      `O FinPlan.ai (${SITE_URL}) é um aplicativo de organização de finanças pessoais, mantido por ${LEGAL.controller}. Ele permite registrar receitas e despesas, controlar cartões de crédito e faturas, importar extratos e faturas, definir orçamentos, receber lembretes e lançar gastos pelo WhatsApp.`,
      "Ao criar uma conta, você concorda com estes Termos e com a Política de Privacidade.",
    ],
  },
  {
    title: "Não é consultoria financeira",
    paragraphs: [
      "O FinPlan.ai é uma ferramenta de organização. As previsões, os relatórios gerados por inteligência artificial e as sugestões de categoria são estimativas baseadas nos dados que você informa e podem conter erros. Eles não são recomendação de investimento nem consultoria financeira, contábil ou jurídica. As decisões sobre o seu dinheiro são suas.",
      "Na importação de extratos e faturas, revise os lançamentos antes de confirmar: a leitura automática pode errar valores, datas ou categorias.",
    ],
  },
  {
    title: "Sua conta",
    items: [
      "Você precisa ter 18 anos ou mais.",
      "Você é responsável pelas informações que registra e por manter o acesso à sua conta Google ou e-mail em segurança.",
      "Ao compartilhar sua conta com outra pessoa, ela passa a ver e editar seus dados financeiros. Você pode desfazer o compartilhamento quando quiser.",
    ],
  },
  {
    title: "Planos e pagamentos",
    items: [
      "Plano Grátis: até 15 transações por mês e 1 importação de extrato ou fatura por mês (até 50 lançamentos), além de dashboard, cartões, orçamentos, contas recorrentes e lista de compras.",
      "Premium mensal (R$ 14,99 por mês): transações ilimitadas, relatórios com IA, compartilhamento de conta, categorias personalizadas, lançamentos e lembretes pelo WhatsApp. Cobrado no cartão de crédito pelo Stripe, renovando automaticamente a cada mês.",
      "Acesso vitalício (oferta de lançamento, pagamento único): os mesmos recursos do Premium, sem mensalidade, pago por cartão (Stripe) ou PIX (Mercado Pago). Vale enquanto o FinPlan.ai estiver em operação.",
      "Preços e recursos podem mudar. Mudanças de preço do Premium mensal valem a partir da renovação seguinte e serão avisadas com antecedência; quem já pagou o vitalício mantém o acesso.",
    ],
  },
  {
    title: "Cancelamento e reembolso",
    items: [
      "O Premium mensal pode ser cancelado a qualquer momento em Assinatura → Gerenciar assinatura, sem multa. O cancelamento interrompe as próximas cobranças, conforme as condições exibidas no momento do cancelamento.",
      "Direito de arrependimento: em compras feitas pela internet, você pode desistir em até 7 dias da contratação e receber o valor de volta (art. 49 do Código de Defesa do Consumidor). Basta pedir pelo e-mail ou WhatsApp abaixo.",
      "Fora desse prazo, valores já pagos não são reembolsados, salvo falha do serviço que impeça o uso.",
    ],
  },
  {
    title: "Uso permitido",
    paragraphs: ["Você concorda em não:"],
    items: [
      "usar o serviço para atividades ilegais ou para registrar dados de terceiros sem autorização;",
      "tentar acessar contas ou dados de outras pessoas, ou burlar limites do plano;",
      "sobrecarregar, copiar ou fazer engenharia reversa do serviço, nem enviar mensagens automatizadas em massa ao bot do WhatsApp.",
    ],
  },
  {
    title: "Disponibilidade",
    paragraphs: [
      "Trabalhamos para manter o FinPlan.ai sempre no ar, mas ele pode ficar indisponível por manutenção, falhas de fornecedores (como hospedagem, WhatsApp ou inteligência artificial) ou motivos fora do nosso controle. Recursos podem ser alterados ou descontinuados; se o serviço for encerrado, avisaremos com antecedência para que você possa pedir uma cópia dos seus dados.",
    ],
  },
  {
    title: "Responsabilidade",
    paragraphs: [
      "O FinPlan.ai não se responsabiliza por decisões financeiras tomadas com base nas informações do app, por dados registrados de forma incorreta pelo usuário, nem por cobranças, juros ou multas de bancos e cartões. Nada nestes Termos limita os direitos que você tem pelo Código de Defesa do Consumidor.",
    ],
  },
  {
    title: "Encerramento da conta",
    paragraphs: [
      "Você pode pedir a exclusão da sua conta a qualquer momento (veja a Política de Privacidade). Podemos suspender contas que violem estes Termos, avisando o motivo sempre que possível.",
    ],
  },
  {
    title: "Mudanças e lei aplicável",
    paragraphs: [
      "Estes Termos podem ser atualizados; a data no topo indica a versão vigente, e mudanças relevantes serão avisadas. Aplica-se a legislação brasileira, e fica eleito o foro do domicílio do consumidor.",
    ],
  },
];

const TermsPage = () => (
  <LegalDocument
    title="Termos de Uso"
    intro="Estas são as regras para usar o FinPlan.ai: o que o serviço oferece, como funcionam os planos, o cancelamento e as responsabilidades de cada parte."
    sections={SECTIONS}
  />
);

export default TermsPage;
