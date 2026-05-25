"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

type BaseProps = {
  label?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  id?: string;
  className?: string;
};

function FieldWrapper({ id, label, helper, error, required, children }: React.PropsWithChildren<BaseProps>) {
  const helpId = helper ? `${id}-help` : undefined;
  const errId = error ? `${id}-error` : undefined;
  return (
    <div className="grid gap-1">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-[var(--text)]">
          {label} {required ? <span className="text-[var(--error)]">*</span> : null}
        </label>
      ) : null}
      {children}
      {helper ? (
        <p id={helpId} className="text-[11px] text-[var(--text-muted)]">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={errId} role="alert" aria-live="polite" className="text-[11px] text-[var(--error)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export type TextFieldProps = BaseProps & React.InputHTMLAttributes<HTMLInputElement>;
export function TextField({ id, label, helper, error, required, className, ...props }: TextFieldProps) {
  return (
    <FieldWrapper id={id} label={label} helper={helper} error={error} required={required}>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={[helper ? `${id}-help` : undefined, error ? `${id}-error` : undefined]
          .filter(Boolean)
          .join(" ")}
        className={cn(
          "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]",
          error && "border-[var(--error)]",
          className,
        )}
        {...props}
      />
    </FieldWrapper>
  );
}

export type SelectFieldProps = BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>;
export function SelectField({ id, label, helper, error, required, className, children, ...props }: SelectFieldProps) {
  return (
    <FieldWrapper id={id} label={label} helper={helper} error={error} required={required}>
      <select
        id={id}
        aria-invalid={!!error}
        aria-describedby={[helper ? `${id}-help` : undefined, error ? `${id}-error` : undefined]
          .filter(Boolean)
          .join(" ")}
        className={cn(
          "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm",
          error && "border-[var(--error)]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}

export type DateFieldProps = BaseProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;
export function DateField({ id, label, helper, error, required, className, ...props }: DateFieldProps) {
  return (
    <FieldWrapper id={id} label={label} helper={helper} error={error} required={required}>
      <input
        id={id}
        type="date"
        aria-invalid={!!error}
        aria-describedby={[helper ? `${id}-help` : undefined, error ? `${id}-error` : undefined]
          .filter(Boolean)
          .join(" ")}
        className={cn(
          "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm",
          error && "border-[var(--error)]",
          className,
        )}
        {...props}
      />
    </FieldWrapper>
  );
}

function formatPhoneBR(input: string) {
  const digits = input.replace(/\D/g, "");
  const d = digits.slice(0, 11);
  const part1 = d.slice(0, 2);
  const part2 = d.length > 10 ? d.slice(2, 7) : d.slice(2, 6);
  const part3 = d.length > 10 ? d.slice(7, 11) : d.slice(6, 10);
  if (!part1) return d;
  if (!part2) return `(${part1}`;
  if (!part3) return `(${part1}) ${part2}`;
  return `(${part1}) ${part2}-${part3}`;
}

export type PhoneFieldProps = BaseProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value?: string;
  onChange?: (value: string) => void;
};
export function PhoneField({ id, label, helper, error, required, className, value, onChange, ...props }: PhoneFieldProps) {
  const [internal, setInternal] = React.useState<string>(value || "");
  React.useEffect(() => setInternal(value || ""), [value]);
  return (
    <FieldWrapper id={id} label={label} helper={helper} error={error} required={required}>
      <input
        id={id}
        inputMode="tel"
        aria-invalid={!!error}
        aria-describedby={[helper ? `${id}-help` : undefined, error ? `${id}-error` : undefined]
          .filter(Boolean)
          .join(" ")}
        className={cn(
          "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-medium tracking-wide",
          error && "border-[var(--error)]",
          className,
        )}
        value={internal}
        onChange={(e) => {
          const next = formatPhoneBR(e.target.value);
          setInternal(next);
          onChange?.(next);
        }}
        {...props}
      />
    </FieldWrapper>
  );
}

export type TextareaFieldProps = BaseProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value"> & {
  showCounter?: boolean;
  value?: string;
};
export function TextareaField({ id, label, helper, error, required, className, maxLength, showCounter = true, value, onChange, ...props }: TextareaFieldProps) {
  const [count, setCount] = React.useState<number>(typeof value === "string" ? value.length : 0);
  return (
    <FieldWrapper id={id} label={label} helper={helper} error={error} required={required}>
      <textarea
        id={id}
        aria-invalid={!!error}
        aria-describedby={[helper ? `${id}-help` : undefined, error ? `${id}-error` : undefined]
          .filter(Boolean)
          .join(" ")}
        className={cn(
          "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm",
          error && "border-[var(--error)]",
          className,
        )}
        value={value}
        onChange={(e) => {
          setCount(e.target.value.length);
          onChange?.(e);
        }}
        maxLength={maxLength}
        {...props}
      />
      {showCounter && (maxLength || typeof value === "string") ? (
        <div className="flex items-center justify-end text-[11px] text-[var(--text-muted)]">
          {count}
          {maxLength ? ` / ${maxLength}` : null}
        </div>
      ) : null}
    </FieldWrapper>
  );
}

export type UploadFieldProps = BaseProps & {
  accept?: string;
  value?: string | null; // existing URL
  onChangeFile?: (file: File | null, previewUrl?: string | null) => void;
};
export function UploadField({ id, label, helper, error, required, className, accept = "image/*", value, onChangeFile }: UploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(value || null);

  React.useEffect(() => {
    setPreview(value || preview);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  React.useEffect(() => () => {
    // cleanup blob urls
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setPreview(value || null);
      onChangeFile?.(null, value || null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChangeFile?.(file, url);
  }

  return (
    <FieldWrapper id={id} label={label} helper={helper} error={error} required={required}>
      <div className={cn("flex items-start gap-3", className)}>
        <div className="w-32 h-20 overflow-hidden rounded border border-[var(--border)] bg-[var(--surface)]">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Pré-visualização" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[11px] text-[var(--text-muted)]">
              Sem imagem
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={inputRef} id={id} type="file" accept={accept} className="hidden" onChange={handleFileChange} />
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
              onClick={() => inputRef.current?.click()}
            >
              Selecionar arquivo
            </button>
            {preview ? (
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-sm text-[var(--error)] hover:bg-[var(--error)]/10"
                onClick={() => {
                  setPreview(null);
                  if (inputRef.current) inputRef.current.value = "";
                  onChangeFile?.(null, null);
                }}
              >
                Remover
              </button>
            ) : null}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">Tipos suportados: {accept}</span>
        </div>
      </div>
    </FieldWrapper>
  );
}

const FormControls = {
  TextField,
  SelectField,
  DateField,
  PhoneField,
  TextareaField,
  UploadField,
};

export default FormControls;
