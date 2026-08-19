# Game Catalog

Projeto de portfólio em **React + TypeScript** criado para demonstrar construção de interface responsiva, consumo de API REST, estados assíncronos e organização de UI para produto real.

## O que o projeto faz

O app consome a API pública da **CheapShark** para listar ofertas de jogos e permite:

- buscar jogos por título;
- filtrar por loja;
- limitar o preço máximo;
- paginar resultados;
- navegar entre rotas no cliente;
- visualizar estados de carregamento, erro e vazio.

## Stack

- **React**
- **TypeScript**
- **TanStack Router**
- **TanStack Query**
- **Axios**
- **CSS responsivo**
- **Vite**

## Decisões técnicas

### 1. Estado do servidor com TanStack Query

Usei TanStack Query para separar claramente estado local de estado remoto. Isso simplifica:

- cache de requisições;
- refetch automático;
- tratamento de loading e error;
- preservação da lista anterior durante troca de página.

### 2. Consumo de API com Axios

O consumo da API foi feito com Axios para manter a leitura simples e facilitar acesso a headers de resposta, especialmente o `X-Total-Page-Count`, usado na paginação.

### 3. Rotas com TanStack Router

Mesmo sendo um projeto pequeno, incluí rotas no cliente para mostrar organização mínima de navegação:

- `/` — catálogo principal
- `/about` — explicação do projeto e das escolhas técnicas

### 4. Estados explícitos de interface

O projeto trata deliberadamente os estados que normalmente aparecem em produto:

- **loading**
- **error**
- **empty**
- **updating/fetching**

Isso foi uma escolha intencional para mostrar raciocínio de frontend além do “happy path”.

## Como rodar localmente

```bash
npm install
npm run dev
```

Para gerar build de produção:

```bash
npm run build
```

## O que eu quis demonstrar

Mais do que “uma tela bonita”, este projeto foi pensado para mostrar:

- atenção à responsividade;
- clareza no fluxo de dados;
- componentes reaproveitáveis;
- leitura crítica de estados assíncronos;
- organização suficiente para ser evoluído.

## Melhorias futuras

- adicionar testes de interface;
- criar rota de detalhe para cada jogo;
- adicionar persistência de filtros na URL;
- incluir fallback visual para imagens ausentes.

## Autor

**Jesus Gabriel Leiva Conessa**  
GitHub: [@JesusGabriel4002](https://github.com/JesusGabriel4002)
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
