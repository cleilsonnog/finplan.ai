import type { Metadata } from "next";
import LegalDocument, { type LegalSection } from "../_components/legal-document";
import { LEGAL } from "../_lib/legal";
import { SITE_URL } from "../_lib/site";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Quais dados o FinPlan.ai coleta, para que usa, com quem compartilha e como você exerce seus direitos pela LGPD.",
  alternates: { canonical: "/privacidade" },
};

// Keep in sync with what the app really does: every processor and data type listed here exists in code
const SECTIONS: LegalSection[] = [
  {
    title: "Quem é o responsável pelos seus dados",
    paragraphs: [
      `O FinPlan.ai (${SITE_URL}) é mantido por ${LEGAL.controller}, que é o controlador dos dados pessoais tratados no serviço, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).`,
      `Contato para qualquer assunto de privacidade, inclusive como encarregado: ${LEGAL.email}.`,
    ],
  },
  {
    title: "Quais dados coletamos",
    items: [
      "Dados de cadastro: nome, e-mail e foto de perfil, recebidos da sua conta Google (ou informados no cadastro por e-mail).",
      "Dados financeiros que você registra: transações (valor, data, categoria, forma de pagamento, observações), cartões de crédito (nome, bandeira, banco, limite, dias de fechamento e vencimento e os 4 últimos dígitos), faturas, orçamentos, categorias, contas e receitas recorrentes e lista de compras.",
      "Arquivos que você importa: extratos bancários e faturas de cartão em PDF ou OFX. Os arquivos são lidos para extrair os lançamentos e não ficam guardados; ficam salvos apenas os lançamentos que você confirmar na revisão.",
      "WhatsApp (se você vincular): seu número de telefone, as mensagens e os áudios que você envia ao bot para registrar transações ou usar a lista de compras.",
      "Notificações: os dados técnicos de inscrição para notificações no navegador ou no celular, se você permitir.",
      "Pagamento: identificadores da assinatura ou da compra (por exemplo, o código do cliente no Stripe ou do pagamento no Mercado Pago). Os dados do cartão e do PIX são informados diretamente ao Stripe e ao Mercado Pago — o FinPlan.ai não recebe nem guarda número de cartão.",
    ],
  },
  {
    title: "Para que usamos seus dados",
    items: [
      "Prestar o serviço: mostrar seu saldo, gastos, faturas, previsões e lembretes.",
      "Ler os extratos e faturas importados e sugerir a categoria de cada lançamento.",
      "Gerar o relatório financeiro com inteligência artificial, quando você pedir.",
      "Entender os comandos de texto e de voz enviados pelo WhatsApp.",
      "Enviar lembretes de contas e faturas a vencer, pelo WhatsApp e por notificação.",
      "Processar pagamentos e liberar o plano contratado.",
      "Atender pedidos de suporte e cumprir obrigações legais.",
    ],
    paragraphs: [
      "A base legal é a execução do contrato com você (art. 7º, V, da LGPD) e, quando aplicável, o cumprimento de obrigação legal (art. 7º, II). Os lembretes e notificações podem ser desligados a qualquer momento — desvinculando o WhatsApp em Configurações ou bloqueando as notificações no aparelho.",
    ],
  },
  {
    title: "O que não fazemos",
    items: [
      "Não vendemos nem alugamos seus dados.",
      "Não mostramos anúncios e não usamos ferramentas de rastreamento publicitário.",
      "Não acessamos sua conta bancária: o FinPlan.ai só conhece o que você registra ou importa.",
    ],
  },
  {
    title: "Com quem compartilhamos",
    paragraphs: [
      "Para funcionar, o FinPlan.ai usa os fornecedores abaixo. Cada um recebe só o necessário para a sua função:",
    ],
    items: [
      "Clerk — login e gerenciamento da conta (nome, e-mail, foto).",
      "Vercel — hospedagem do site e do aplicativo.",
      "Neon — banco de dados onde ficam seus dados financeiros (servidores em São Paulo).",
      "OpenAI — leitura dos PDFs importados, sugestão de categorias, relatório com IA e transcrição dos áudios do WhatsApp. São enviados apenas o conteúdo necessário para cada tarefa (o arquivo, a descrição do lançamento, os números do mês ou o áudio). Segundo as políticas da OpenAI, os dados enviados pela API não são usados para treinar os modelos dela.",
      "Stripe e Mercado Pago — processamento dos pagamentos.",
      "Servidor próprio de integração com o WhatsApp — recebe e envia as mensagens trocadas com o bot.",
      "Autoridades públicas, quando houver obrigação legal ou ordem judicial.",
    ],
  },
  {
    title: "Transferência internacional",
    paragraphs: [
      "Alguns desses fornecedores (como Clerk, Vercel, OpenAI e Stripe) processam dados em servidores fora do Brasil, principalmente nos Estados Unidos. Essa transferência é necessária para executar o serviço que você contratou (art. 33, IX, da LGPD) e é feita com fornecedores que adotam medidas de segurança compatíveis.",
    ],
  },
  {
    title: "Cookies e armazenamento no navegador",
    paragraphs: [
      "Usamos apenas cookies essenciais para manter você conectado (gerenciados pelo Clerk) e o armazenamento local do navegador para lembrar preferências, como o tema claro ou escuro. Não usamos cookies de publicidade nem de análise de terceiros.",
    ],
  },
  {
    title: "Por quanto tempo guardamos",
    paragraphs: [
      "Seus dados ficam guardados enquanto sua conta existir. Ao excluir a conta em Configurações, ela e todos os dados financeiros são apagados na hora (pedidos por e-mail são atendidos em até 15 dias). Só mantemos o que a lei obriga — por exemplo, registros de pagamento, que também ficam com o Stripe ou o Mercado Pago conforme as regras deles.",
    ],
  },
  {
    title: "Seus direitos",
    paragraphs: ["Pela LGPD (art. 18), você pode, a qualquer momento:"],
    items: [
      "confirmar se tratamos seus dados e ter acesso a eles;",
      "corrigir dados incompletos, inexatos ou desatualizados;",
      "pedir a portabilidade ou uma cópia dos seus dados;",
      "excluir sua conta e seus dados (você mesmo faz isso em Configurações → Excluir conta);",
      "saber com quem seus dados são compartilhados;",
      "revogar consentimentos e reclamar à Autoridade Nacional de Proteção de Dados (ANPD).",
    ],
  },
  {
    title: "Como fazer um pedido",
    paragraphs: [
      `Envie um e-mail para ${LEGAL.email} (ou mensagem no WhatsApp ${LEGAL.whatsapp}) a partir do e-mail ou número cadastrado, dizendo o que deseja. Respondemos em até 15 dias. Boa parte você mesmo resolve dentro do app: corrigir ou apagar transações, cartões e importações, desvincular o WhatsApp ou excluir a conta inteira em Configurações.`,
    ],
  },
  {
    title: "Segurança",
    paragraphs: [
      "Os dados trafegam com criptografia (HTTPS), o acesso exige login e cada conta só enxerga os próprios dados — ou os de quem a compartilhou com você. Nenhum sistema é totalmente imune a falhas; se ocorrer um incidente de segurança que possa trazer risco a você, avisaremos os afetados e a ANPD, como manda a lei.",
    ],
  },
  {
    title: "Menores de idade",
    paragraphs: ["O FinPlan.ai é destinado a maiores de 18 anos."],
  },
  {
    title: "Mudanças nesta política",
    paragraphs: [
      "Podemos atualizar esta política quando o serviço mudar. A data no topo indica a última versão. Se a mudança for relevante, avisaremos no app ou por e-mail.",
    ],
  },
];

const PrivacyPage = () => (
  <LegalDocument
    title="Política de Privacidade"
    intro="Esta política explica, em linguagem direta, quais dados o FinPlan.ai coleta, para que usa, com quem compartilha e como você controla tudo isso."
    sections={SECTIONS}
  />
);

export default PrivacyPage;
