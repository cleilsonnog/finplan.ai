import Navbar from "../_components/navbar";
import { redirect } from "next/navigation";
import { getEffectiveUserId } from "../_lib/get-effective-user-id";

// Keep in sync with the app: every label in quotes here is the real button/card name
const steps = [
  {
    title: "Entendendo o Dashboard",
    description:
      "Use as setas ou o seletor no topo para escolher o mês (vale também em Transações, Cartões e Recorrentes).\n\n• Saldo do mês — o dinheiro que realmente saiu da conta: receita − gastos à vista − faturas pagas − investido. A fatura do cartão só desconta do saldo quando você a marca como paga.\n• Gastos do mês — tudo o que você comprou no mês, à vista e no cartão, pela data da compra. É esse valor que vale para categorias e orçamento.\n• Gráfico mensal — receita, despesas à vista, compras no cartão e investido dos últimos meses, com a linha tracejada da receita esperada (suas receitas recorrentes).\n• Cartões de crédito — a fatura do mês de cada cartão (situação e vencimento), a fatura aberta, o uso do limite e as próximas 6 faturas somadas.\n• Próximos meses — previsão do saldo dos próximos 6 meses com faturas e contas fixas, avisando quando um mês pode fechar no vermelho. Em \"Posso parcelar?\" você simula uma compra parcelada antes de fazer.",
  },
  {
    title: "Adicionar transações",
    description:
      "No Dashboard ou em Transações, clique em \"Adicionar transação\" para registrar receitas, despesas ou investimentos: valor, categoria, data, forma de pagamento e uma observação opcional. Para compras no cartão, escolha o cartão e as parcelas (até 48x). A compra fica na data real e cada parcela cai na fatura certa.\n\nNo plano grátis são 15 transações por mês.",
  },
  {
    title: "Importar extrato e fatura",
    description:
      "Em Importar, envie o extrato da conta (OFX ou PDF) ou a fatura do cartão (PDF ou OFX). Antes de salvar, você revisa cada linha:\n\n• As categorias são sugeridas automaticamente. Ao trocar uma, marque \"lembrar\" para o app usar essa categoria nas próximas importações.\n• Linhas já lançadas (à mão, pelo WhatsApp ou em outra importação) vêm desmarcadas como duplicadas.\n• PIX e transferências entre contas suas vêm desmarcados, para não contar como receita ou gasto.\n• O pagamento da fatura no extrato da conta marca a fatura do cartão como paga, sem criar outra despesa.\n\nVocê pode desfazer uma importação inteira na lista de importações recentes. No plano grátis: 1 importação por mês, com até 50 linhas.",
  },
  {
    title: "Cartões de crédito e faturas",
    description:
      "Em Cartões, cadastre cada cartão com bandeira, banco, limite e os dias de fechamento e vencimento. As compras são agrupadas por fatura, e você vê o total de cada uma, as parcelas futuras e o limite disponível.\n\nQuando pagar a fatura no banco, clique em \"Marcar como Paga\". O valor desconta do saldo do mês sem lançar as compras de novo.\n\nSe o banco mudar o dia de fechamento, as faturas antigas continuam com as datas reais. Ao importar o PDF da fatura, o app usa as datas impressas nela.",
  },
  {
    title: "Orçamento e categorias",
    description:
      "Em Orçamento, defina um limite de gastos por categoria e acompanhe quanto já gastou e quanto ainda pode gastar no mês. Ali você também renomeia as categorias padrão e cria categorias próprias, como \"Pet\" ou \"Presentes\" (categorias próprias são recurso premium).",
  },
  {
    title: "Contas e receitas recorrentes",
    description:
      "Em Recorrentes, cadastre contas fixas (aluguel, internet, streaming) com o dia de vencimento e receitas fixas (salário, freelance) com o dia do recebimento.\n\n• \"Marcar como pago\" e \"Marcar como recebido\" registram o mês selecionado. O selo mostra se está Pago/Recebido ou Pendente.\n• Outras entradas do mês — lista os PIX recebidos, as receitas importadas e as avulsas. Se uma delas for o seu salário, use o botão de vincular, que marca a receita fixa como recebida sem lançar o valor duas vezes.\n• O card \"Contas fixas\" do Dashboard mostra quanto já foi pago e quanto falta.",
  },
  {
    title: "Lembretes",
    description:
      "Todo dia às 9h, o app avisa pelo WhatsApp (se estiver vinculado) e por notificação no celular:\n\n• Contas fixas que vencem no dia e ainda não foram pagas.\n• Faturas do cartão 3 dias antes e no dia do vencimento, enquanto não estiverem marcadas como pagas.\n\nPara receber notificações no celular, instale o app (Adicionar à tela inicial) e permita as notificações quando o app pedir.",
  },
  {
    title: "Relatório com IA",
    description:
      "No Dashboard, clique em \"Relatório IA\" para gerar uma análise do mês: saúde financeira, categorias que mais cresceram, orçamento x realidade, cartões, gastos fora do padrão e um plano de ação. O relatório compara com os 3 meses anteriores. (Recurso premium)",
  },
  {
    title: "Lista de compras",
    description:
      "Em Compras, organize sua lista de supermercado. Adicione itens separados por vírgula e remova ao comprar. A lista também funciona pelo WhatsApp:\n\n• \"comprar arroz, feijão, leite\" — adiciona itens\n• \"comprei arroz, feijão\" — remove e mostra o que falta\n• \"lista\" — mostra todos os itens pendentes",
  },
  {
    title: "Configurar WhatsApp",
    description:
      "Em Config, vincule seu número de WhatsApp. Com isso você pode:\n\n• Cadastrar transações enviando mensagens como \"gastei 50 alimentação pix\" ou \"recebi 3000 salário transferência\"\n• Em compras no crédito, o bot pergunta qual cartão e quantas parcelas\n• Gerenciar sua lista de compras (comprar, comprei, lista)\n• Mandar áudio — o bot transcreve e entende o comando\n• Receber os lembretes de contas e faturas\n\nDigite \"ajuda\" no WhatsApp para ver todos os comandos. Para desistir de um lançamento no meio, envie \"cancelar\". (Recurso premium)",
  },
  {
    title: "Compartilhar conta",
    description:
      "No Dashboard, use o botão de compartilhamento para convidar seu parceiro(a). A pessoa convidada vê e gerencia os mesmos dados da sua conta. (Recurso premium)",
  },
  {
    title: "Assinatura",
    description:
      "Em Assinatura você vê seu plano. Quem assina o Premium mensal clica em \"Gerenciar assinatura\" para cancelar, trocar o cartão ou ver as faturas.",
  },
];

const TutorialPage = async () => {
  const result = await getEffectiveUserId();
  if (!result) {
    redirect("/");
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 flex-col overflow-auto scroll-smooth scrollbar-thin p-4 md:p-6">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Como usar o FinPlan.ai</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Guia rápido para você começar a organizar suas finanças
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="rounded-lg border border-border bg-muted/50 p-4"
              >
                <h2 className="text-base font-semibold">
                  {i + 1}. {step.title}
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h2 className="text-base font-semibold">
              Formato de mensagem no WhatsApp
            </h2>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground/80">Despesas:</p>
              <code className="block rounded bg-muted px-3 py-2">
                gastei 50 alimentação pix
              </code>
              <code className="block rounded bg-muted px-3 py-2">
                gastei 200 roupas crédito
              </code>
              <p className="mt-3 font-medium text-foreground/80">Receitas:</p>
              <code className="block rounded bg-muted px-3 py-2">
                recebi 3000 salário transferência
              </code>
              <p className="mt-3 font-medium text-foreground/80">
                Cartão de crédito:
              </p>
              <p>
                Ao usar &quot;crédito&quot; como pagamento, o bot pergunta qual
                cartão e quantas parcelas.
              </p>
              <p className="mt-3 font-medium text-foreground/80">
                Lista de compras:
              </p>
              <code className="block rounded bg-muted px-3 py-2">
                comprar arroz, feijão, leite
              </code>
              <code className="block rounded bg-muted px-3 py-2">
                comprei arroz, feijão
              </code>
              <code className="block rounded bg-muted px-3 py-2">
                lista
              </code>
              <p className="mt-3 font-medium text-foreground/80">
                Mensagem de voz:
              </p>
              <p>
                Envie um áudio com qualquer comando acima — o bot transcreve
                automaticamente e processa o comando.
              </p>
            </div>
          </div>

          <p className="pb-6 text-center text-xs text-muted-foreground">
            Dúvidas? Entre em contato pelo WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TutorialPage;
