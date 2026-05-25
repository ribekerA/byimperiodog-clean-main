import ContractForm from "@/components/ContractForm";

export default function ContractPage({ params }: { params: { code: string }}) {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Dados para Contrato</h1>
      <p className="text-sm text-zinc-600 mb-6">Insira seus dados e anexos. Código: <strong>{params.code}</strong></p>
      <ContractForm code={params.code} />
    </div>
  );
}
