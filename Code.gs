/**
 * Criado por: rsantiag085
 * Prompt por: luanouts
 */

function processarERelatarPlantao() {
  // --- 1. CONFIGURAÇÕES (Substitua pelos seus IDs antes de rodar localmente) ---
  const API_KEY = "SUA_CHAVE_API_AQUI"; 
  const ID_MODELO_RASCUNHO = "ID_DO_ARQUIVO_RASCUNHO"; 
  const ID_TEMPLATE_COM_LOGO = "ID_DO_TEMPLATE_DOCS"; 
  const ID_PASTA_RAIZ = "ID_DA_PASTA_NO_DRIVE"; 
  const EMAIL_DESTINO = "lista-destino@exemplo.com.br"; 
  const EMAIL_ADMIN = "seu-email@exemplo.com.br"; 
  const REMETENTE_ALIAS = "seu-alias-configurado@exemplo.com.br";

  // --- VALIDAÇÃO DE ALTERAÇÃO RECENTE (TRAVA DE 5H) ---
  const arquivoRascunho = DriveApp.getFileById(ID_MODELO_RASCUNHO);
  const ultimaAlteracao = arquivoRascunho.getLastUpdated();
  const agora = new Date();
  
  const diferencaMinutos = (agora.getTime() - ultimaAlteracao.getTime()) / (1000 * 60);

  if (diferencaMinutos > 300) {
    console.log("Folga/Sem alterações: Rascunho parado há " + Math.round(diferencaMinutos) + " min.");
    return; 
  }

  const hoje = new Date();
  const dataFormatada = Utilities.formatDate(hoje, "GMT-3", "yyyyMMdd");
  const dataExibicao = Utilities.formatDate(hoje, "GMT-3", "dd/MM/yyyy");
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const mesAtual = (hoje.getMonth() + 1).toString().padStart(2, '0') + " " + meses[hoje.getMonth()];

  try {
    const docRascunho = DocumentApp.openById(ID_MODELO_RASCUNHO);
    const textoRascunho = docRascunho.getBody().getText();

    // --- PROMPT (MODO ANALISTA SÊNIOR COM LISTAS) ---
    const prompt = `
    ROLE (Papel):
    Você é um Analista de NOC Sênior. Analise o rascunho e gere um relatório técnico.

    DIRETRIZES:
    1. STATUS: 🟢 Normal, 🟡 Atenção, 🔴 Crítico.
    2. SEPARAÇÃO DE EVENTOS: Se houver múltiplas ocorrências em um mesmo grupo, gere uma lista com textos separados.
    3. REGRA DE OURO (🟢): Se status Normal, a lista deve conter APENAS UM item com o texto exato: "Sem ocorrências ou logs informativos no período."

    ESTRUTURA JSON:
    {
      "analista": "Nome do Analista",
      "proximo_analista": "Nome do Próximo",
      "tabela": [
        {"item": "DAG'S", "status": "[🟢/🟡/🔴]", "resumo": "Frase curta."},
        {"item": "LINKS DAS UNIDADES", "status": "[🟢/🟡/🔴]", "resumo": "Frase curta."},
        {"item": "DISPONIBILIDADE (Infra)", "status": "[🟢/🟡/🔴]", "resumo": "Frase curta."},
        {"item": "EQUIPAMENTOS DE TI", "status": "[🟢/🟡/🔴]", "resumo": "Frase curta."},
        {"item": "SISTEMAS CRÍTICOS", "status": "[🟢/🟡/🔴]", "resumo": "Frase curta."},
        {"item": "BACKUPS", "status": "[🟢/🟡/🔴]", "resumo": "Frase curta."},
        {"item": "EVENTUALIDADES", "status": "[🟢/🟡/🔴]", "resumo": "Frase curta."},
        {"item": "DEMANDAS", "status": "[🟢/🟡/🔴]", "resumo": "Frase curta."}
      ],
      "obsExecutiva": "Texto analítico.",
      "detalhamento": { 
        "1": ["..."], "2": ["..."], "3": ["..."], "4": ["..."], "5": ["..."], "6": ["..."], "7": ["..."], "8": ["..."] 
      },
      "pendencias": "Ações imediatas."
    }

    RASCUNHO: ${textoRascunho}`;

    // --- CHAMADA API ---
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${API_KEY}`;
    const payload = { 
      "contents": [{ "parts": [{ "text": prompt }] }],
      "generationConfig": { "temperature": 0.4 }
    };
    
    const response = UrlFetchApp.fetch(url, { method: "post", contentType: "application/json", payload: JSON.stringify(payload) });
    const jsonResponse = JSON.parse(response.getContentText());
    
    let textoIA = jsonResponse.candidates[0].content.parts[0].text;
    textoIA = textoIA.replace(/```json/g, "").replace(/```/g, ""); 

    const inicioJson = textoIA.indexOf("{");
    const fimJson = textoIA.lastIndexOf("}");

    if (inicioJson === -1 || fimJson === -1) throw new Error("JSON inválido retornado pela IA.");

    const dados = JSON.parse(textoIA.substring(inicioJson, fimJson + 1));

    // Validação de nomes
    const validarTexto = (valor, padrao) => (!valor || valor.includes("Definir") || valor === "N/A") ? padrao : valor;
    const analistaFinal = validarTexto(dados.analista, "Analista Plantonista");
    const proximoFinal = validarTexto(dados.proximo_analista || dados.proximo, "Próximo Analista");
    const obsExecutivaFinal = validarTexto(dados.obsExecutiva, "O plantão transcorreu com estabilidade.");

    // --- GERAÇÃO DO DOCUMENTO ---
    const pastaDestino = DriveApp.getFolderById(ID_PASTA_RAIZ).getFoldersByName(mesAtual).next();
    const nomeRelatorio = dataFormatada + "_RELATÓRIO_PASSAGEM_PLANTAO";
    const copiaDocFile = DriveApp.getFileById(ID_TEMPLATE_COM_LOGO).makeCopy(nomeRelatorio, pastaDestino);
    const doc = DocumentApp.openById(copiaDocFile.getId());
    const body = doc.getBody();

    const escrever = (texto, bold = false, size = 10, align = DocumentApp.HorizontalAlignment.LEFT) => {
      const p = body.appendParagraph(String(texto));
      p.setBold(bold).setFontSize(size).setAlignment(align).setForegroundColor("#000000").setFontFamily("Arial");
      return p;
    };

    // Cabeçalho
    escrever("RELATÓRIO DE PASSAGEM DE PLANTÃO", true, 13, DocumentApp.HorizontalAlignment.CENTER);
    escrever("\nIdentificação", true, 12);
    escrever("Data: " + dataExibicao, false, 12);
    escrever("Analista: " + analistaFinal, false, 12);
    escrever("Próximo analista: " + proximoFinal, false, 12);

    // Tabela
    escrever("\nRESUMO EXECUTIVO (Painel de Status)", true, 12);
    const tabela = body.appendTable();
    const header = tabela.appendTableRow();
    ["Indicador", "Status", "Resumo Rápido"].forEach(h => {
      header.appendTableCell(h).setBold(true).setBackgroundColor("#E2E2E2").getChild(0).asParagraph().setForegroundColor("#000000");
    });
    
    dados.tabela.forEach(row => {
      const tr = tabela.appendTableRow();
      tr.appendTableCell(String(row.item)).setFontSize(9);
      tr.appendTableCell(String(row.status)).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      tr.appendTableCell(String(row.resumo)).setFontSize(9);
    });
    
    tabela.setColumnWidth(0, 140);
    tabela.setColumnWidth(1, 50);

    escrever("\nObservação Executiva:", true, 12);
    escrever(obsExecutivaFinal, false, 11).setItalic(true);

    body.appendPageBreak(); 

    // Detalhamento Técnico
    escrever("DETALHAMENTO TÉCNICO", true, 13);
    const nomesItens = ["DAG's", "LINKS DAS UNIDADES", "DISPONIBILIDADE DAS UNIDADES", "EQUIPAMENTOS DE TI", "SISTEMAS CRÍTICOS", "BACKUPS", "EVENTUALIDADES", "DEMANDAS & ACESSOS"];
    
    nomesItens.forEach((nome, i) => {
      escrever("\n" + (i + 1) + ". " + nome, true, 12);
      let itens = dados.detalhamento[i + 1];
      if (!itens) itens = ["Sem ocorrências."];
      if (!Array.isArray(itens)) itens = [itens];

      itens.forEach(itemTexto => {
        body.appendListItem(itemTexto)
            .setGlyphType(DocumentApp.GlyphType.BULLET)
            .setFontSize(11)
            .setFontFamily("Arial");
      });
    });

   // Pendências
    escrever("\nPENDÊNCIAS E PRÓXIMOS PASSOS", true, 12);
    const textoPendencias = dados.pendencias || "Nenhuma pendência registrada.";
    body.appendListItem(textoPendencias).setGlyphType(DocumentApp.GlyphType.BULLET).setFontSize(11);

    doc.saveAndClose();

    // --- ENVIO ---
    const pdf = copiaDocFile.getBlob().getAs('application/pdf');
    pastaDestino.createFile(pdf).setName(nomeRelatorio + ".pdf");
    
    GmailApp.sendEmail(EMAIL_DESTINO, "Relatório de passagem do plantão - " + dataExibicao, "Segue relatório em anexo.", {
      attachments: [pdf], from: REMETENTE_ALIAS
    });

    GmailApp.sendEmail(EMAIL_ADMIN, "✅ Sucesso: Relatório NOC enviado", "O script rodou corretamente às " + new Date().toLocaleTimeString());

    copiaDocFile.setTrashed(true);

  } catch (e) { 
    console.log("Erro: " + e.message);
    GmailApp.sendEmail(EMAIL_ADMIN, "❌ ERRO CRÍTICO NO SCRIPT NOC", "Erro: " + e.message);
  }
}
