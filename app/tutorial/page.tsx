import Navbar from "../_components/navbar";
import { redirect } from "next/navigation";
import { getEffectiveUserId } from "../_lib/get-effective-user-id";

const steps = [
  {
    title: "1. Adicionar transações",
    description:
      "No Dashboard, clique em \"Adicionar transação\" para registrar receitas, despesas ou investimentos. Informe o valor, categoria, data e método de pagamento. Para compras no cartão de crédito, selecione o cartão e o número de parcelas (até 48x).",
  },
  {
    title: "2. Cartões de crédito",
    description:
      "Em Cartões, adicione seus cartões informando nome, bandeira, banco, limite e dias de fechamento/vencimento. Escolha uma cor para identificar cada cartão. O resumo mostra a fatura atual separada entre compras à vista e parceladas, limite disponível e o percentual de uso.",
  },
  {
    title: "3. Orçamento mensal",
    description:
      "Em Orçamento, defina um limite de gastos por categoria (alimentação, transporte, lazer, etc.). O app mostra quanto você já gastou e quanto ainda pode gastar em cada categoria no mês.",
  },
  {
    title: "4. Despesas recorrentes",
    description:
      "Em Recorrentes, cadastre contas fixas como aluguel, internet e streaming. Informe o nome, valor, categoria e dia de vencimento. Use o botão \"Pagar\" para registrar o pagamento do mês. O badge mostra se está Pago ou Pendente.",
  },
  {
    title: "5. Categorias personalizadas",
    description:
      "Em Categorias, crie suas próprias categorias além das padrão do app. Útil para organizar gastos específicos como \"Pet\", \"Freelance\" ou \"Presentes\". (Recurso premium)",
  },
  {
    title: "6. Relatório com IA",
    description:
      "No Dashboard, clique no botão de relatório IA para gerar uma análise completa das suas finanças no mês. O relatório inclui score financeiro, insights e recomendações personalizadas. (Recurso premium)",
  },
  {
    title: "7. Configurar WhatsApp",
    description:
      "Em Config, vincule seu número de WhatsApp. Com isso você pode:\n\n• Cadastrar transações enviando mensagens como \"gastei 50 alimentação pix\" ou \"recebi 3000 salário transferência\"\n• Para compras no cartão, o bot pergunta qual cartão e quantas parcelas\n• Receber lembretes diários de contas recorrentes vencendo no dia",
  },
  {
    title: "8. Compartilhar conta",
    description:
      "No Dashboard, use o botão de compartilhamento para convidar um parceiro(a) a visualizar e gerenciar as finanças juntos. O convidado acessa os mesmos dados da sua conta. (Recurso premium)",
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
            {steps.map((step) => (
              <div
                key={step.title}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <h2 className="text-base font-semibold">{step.title}</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h2 className="text-base font-semibold">
              Formato de mensagem no WhatsApp
            </h2>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-white/80">Despesas:</p>
              <code className="block rounded bg-white/10 px-3 py-2">
                gastei 50 alimentação pix
              </code>
              <code className="block rounded bg-white/10 px-3 py-2">
                gastei 200 roupas crédito
              </code>
              <p className="mt-3 font-medium text-white/80">Receitas:</p>
              <code className="block rounded bg-white/10 px-3 py-2">
                recebi 3000 salário transferência
              </code>
              <p className="mt-3 font-medium text-white/80">
                Cartão de crédito:
              </p>
              <p>
                Ao usar &quot;crédito&quot; como pagamento, o bot pergunta qual
                cartão e quantas parcelas.
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
