import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default defineConfig([
  js.configs.recommended,
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{js,cjs,mjs,jsx,ts,tsx}"],
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // `strict: true` já impede `any` implícito. O aviso de `any` explícito
      // gerava 454 ocorrências em adaptadores legados sem migração automática
      // segura; deixa de ser gate genérico e é tratado quando o módulo muda.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", disallowTypeAnnotations: false },
      ],
      "import/order": [
        "error",
        {
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
        },
      ],
      "no-console": ["error", { allow: ["error", "warn"] }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-trailing-spaces": "error",
      "no-irregular-whitespace": "error",
      "no-useless-escape": "error",
      // Aspas em texto JSX são escapadas pelo React; exigir entidades HTML
      // aqui é apenas preferência de escrita, sem ganho de segurança.
      "react/no-unescaped-entities": "off",
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-img-element": "error",
      "@next/next/no-assign-module-variable": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/no-unused-expressions": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/label-has-associated-control": "error",
      // Os clipes do catálogo e seus previews não têm narração. Caso o
      // produto passe a publicar fala, o pipeline deve gerar VTT e reativar o gate.
      "jsx-a11y/media-has-caption": "off",
      // Foco inicial é intencional em paletas e etapas de formulário abertas
      // pelo próprio usuário.
      "jsx-a11y/no-autofocus": "off",
      "jsx-a11y/no-interactive-element-to-noninteractive-role": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/no-noninteractive-element-to-interactive-role": "error",
      "jsx-a11y/no-redundant-roles": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      // Regras de preparação do React Compiler. O projeto não usa o Compiler;
      // reativar este conjunto junto com uma adoção formal dele.
      "react-hooks/error-boundaries": "off",
      "react-hooks/immutability": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
    settings: {
      "import/resolver": {
        typescript: {},
        node: { extensions: [".js", ".ts", ".tsx"] },
      },
    },
  },
  {
    // Console é a interface dos scripts/CLIs e do servidor local. Regras de
    // navegação do Next também não se aplicam a esses arquivos.
    files: ["scripts/**/*.{js,cjs,mjs,ts}", "server-https.mjs", "netlify/**/*.{js,cjs,mjs,ts}"],
    rules: {
      "no-console": "off",
      "@next/next/no-assign-module-variable": "off",
      "@next/next/no-html-link-for-pages": "off",
      // Scripts e funções de compatibilidade mantêm argumentos de CLI/API
      // reservados; o compilador continua validando sua sintaxe e seus tipos.
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-require-imports": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
  {
    // Previews administrativos aceitam blob/data URLs arbitrárias e a
    // assinatura do contrato é uma data URL; não são candidatas ao otimizador.
    files: [
      "app/(admin)/**/blog/preview/**/*.tsx",
      "app/(admin)/**/puppies/**/*.tsx",
      "app/(public)/contract/**/documento/**/*.tsx",
    ],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  {
    // Headings recebem conteúdo dinamicamente por props no renderer MDX.
    files: ["src/components/MDXContent.tsx"],
    rules: {
      "jsx-a11y/heading-has-content": "off",
    },
  },
  {
    // O evento de arraste nativo fica no contêiner; remover e recolocar por
    // botões mudaria o contrato desses editores. Remoção e capa já são botões.
    files: [
      "app/(admin)/**/puppies/_components/MediaManager.tsx",
      "src/components/puppies/MediaGallery.tsx",
    ],
    rules: {
      "jsx-a11y/no-static-element-interactions": "off",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
    },
  },
  {
    // Evento de arraste do calendário; edição e exclusão continuam em
    // botões, e a grade possui navegação por teclado.
    files: ["app/(admin)/**/content/calendar/page.tsx"],
    rules: {
      "jsx-a11y/no-static-element-interactions": "off",
    },
  },
  {
    // Mocks de DOM/Next não representam navegação de produção.
    files: ["tests/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@next/next/no-assign-module-variable": "off",
      "@next/next/no-html-link-for-pages": "off",
      "@typescript-eslint/no-require-imports": "off",
      // Elementos simplificados nos mocks não são UI entregue ao usuário.
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-static-element-interactions": "off",
    },
  },
  globalIgnores([
    // Diretorio de trabalho: scripts de patch de uso unico e textos de
    // especificacao. Nada aqui e codigo do site, e nada aqui vai para o git
    // (ver .gitignore) — sem esta linha o gate fica vermelho por rascunho.
    "scratchpad/**",
    ".next*/**",
    ".netlify/**",
    ".contentlayer/**",
    "coverage/**",
    "out/**",
    "build/**",
    "playwright-report/**",
    "test-results/**",
    "reports/**",
    "midia-original/**",
    "next-env.d.ts",
    "src/components/clientPhotos.ts",
    "src/lib/_generated-image-sizes.ts",
    "src/lib/_generated-lastmod.ts",
    "src/lib/_generated-posts.ts",
  ]),
]);
