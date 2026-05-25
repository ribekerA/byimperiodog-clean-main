'use client';
import { useForm } from "react-hook-form";

type Props = { code: string };

export default function ContractForm({ code }: Props) {
  const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm();

  const onSubmit = async (data: any) => {
    const form = new FormData();
    form.append("code", code);
    for (const [k, v] of Object.entries(data)) {
      if (v instanceof File) form.append(k, v);
    }
    form.set("payload", JSON.stringify({
      nome: data.nome,
      cpf: data.cpf,
      email: data.email,
      telefone: data.telefone,
      endereco: data.endereco,
    }));

    const res = await fetch("/api/contract", { method: "POST", body: form });
    if (!res.ok) alert("Erro ao enviar contrato.");
    else alert("Dados enviados com sucesso!");
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <input {...register("nome")} placeholder="Nome completo" className="w-full border rounded-lg px-3 py-2"/>
        <input {...register("cpf")} placeholder="CPF" className="w-full border rounded-lg px-3 py-2"/>
        <input {...register("email")} placeholder="E-mail" className="w-full border rounded-lg px-3 py-2"/>
        <input {...register("telefone")} placeholder="Telefone/WhatsApp" className="w-full border rounded-lg px-3 py-2"/>
      </div>
      <input {...register("endereco")} placeholder="Endereço completo" className="w-full border rounded-lg px-3 py-2"/>

      <div className="card space-y-2">
        <p className="font-semibold">Anexos no ato da entrega</p>
        <label className="text-sm">Hemograma (PDF/JPG)</label>
        <input type="file" accept=".pdf,image/*" {...register("hemograma")} />
        <label className="text-sm mt-2">Laudo do Veterinário (PDF/JPG)</label>
        <input type="file" accept=".pdf,image/*" {...register("laudo")} />
      </div>

      <button disabled={isSubmitting} className="btn-primary">{isSubmitting ? "Enviando..." : "Enviar dados"}</button>
    </form>
  );
}
