# 🤖 Automação de Relatórios de NOC com IA Generativa (Gemini)

> Um pipeline *serverless* que transforma anotações brutas de plantão em relatórios executivos formatados (PDF) usando Google Apps Script e a API do Gemini.

![Status](https://img.shields.io/badge/Status-Production-green) ![Stack](https://img.shields.io/badge/Tech-Google%20Apps%20Script%20|%20Gemini%20API-blue)

## 🎯 O Problema
A passagem de plantão no NOC (Network Operations Center) exigia formatação manual de incidentes, correções gramaticais e estruturação visual em tabelas. Esse processo manual consumia tempo precioso do analista e estava sujeito a erros humanos e inconsistências de padrão.

## 🚀 A Solução
Desenvolvi um agente autônomo rodando na nuvem do Google (Apps Script) que monitora uma pasta do Drive. Ele lê o rascunho do analista, interpreta o contexto técnico (incidentes críticos vs. logs normais) e gera um PDF padronizado automaticamente.

### Principais Funcionalidades
* **Interpretação Semântica:** Transforma texto desestruturado (ex: "link caiu 10 min") em dados estruturados com status visual (🟢/🟡/🔴).
* **Validação Temporal:** Mecanismo de *Time-Check* que impede o processamento de arquivos antigos (regra de < 59 min), economizando recursos.
* **Geração de PDF Nativa:** Criação dinâmica de tabelas, cabeçalhos e formatação visual via código.
* **Entrega Automática:** Envio do relatório final por e-mail para os stakeholders.

## 🛠️ Arquitetura do Projeto

O fluxo de dados segue a seguinte esteira de automação:

1.  **Acionador:** O script acorda a cada hora (Cron Job).
2.  **Validação:** Verifica se o arquivo `modelo de relatório` foi modificado recentemente.
3.  **Processamento (LLM):** Envia o texto bruto para a API do **Google Gemini 2.0 Flash**.
4.  **Estruturação (JSON):** A IA retorna um objeto JSON estrito com os incidentes categorizados.
5.  **Renderização:** O script desenha o documento (Tabelas, Negritos, Cores) baseado no JSON.
6.  **Deploy:** Salva o PDF na pasta do mês corrente e dispara o e-mail.

## 🧠 Engenharia de Prompt (Destaque)

Para garantir consistência, utilizei uma estratégia de *System Prompting* forçando a saída em JSON puro.

**Exemplo da Lógica de Prompt:**
```javascript
const SYSTEM_PROMPT = `
Você é um NOC Assistant.
ENTRADA: Texto bruto com anotações de incidentes.
SAÍDA: Apenas JSON válido.
REGRAS:
- Classifique "Queda de Link" como 🔴 Crítico.
- Classifique "Lentidão pontual" como 🟡 Atenção.
- Se não houver dados, preencha com "Sem alterações" e status 🟢.
`;

```

## ⚙️ Configuração Técnica

### Pré-requisitos

* Conta Google (Pessoal ou Workspace).
* API Key do Google AI Studio.

### Instalação

1. Crie um novo projeto no [Google Apps Script](script.google.com).
2. Copie o código fonte do arquivo `Código.gs`.
3. Defina as variáveis de ambiente no início do script:
```javascript
const CONFIG = {
  API_KEY: "SUA_CHAVE_AQUI",
  ID_PASTA_RAIZ: "ID_DA_SUA_PASTA_DRIVE",
  ...
};

```


4. Configure um acionador para rodar `processarERelatarPlantao` conforme a sua necessidade.

## 📊 Resultados

| Antes (Manual) | Depois (Automático) |
| --- | --- |
| ~20 min para formatar e enviar | **0 min** (Automático) |
| Erros de digitação frequentes | **Correção gramatical via IA** |
| Layout inconsistente | **Padrão corporativo garantido** |

---

*Desenvolvido por Robson Santiago*
