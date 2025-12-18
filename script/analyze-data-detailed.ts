
import 'dotenv/config';
import XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../server/db';
import { items } from '../shared/schema';
import { sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FILE_PATH = path.resolve(__dirname, '../Controle de Materiais.xlsx');
const REPORT_PATH = path.resolve(__dirname, '../ANALISE_DADOS_DETALHADA.md');

// Helper to normalize strings for comparison
const normalize = (str: string) => str ? str.toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

async function analyze() {
  console.log('Iniciando análise detalhada...');
  let report = `# Análise Detalhada de Dados: Controle de Materiais.xlsx\n\n`;
  report += `Data da Análise: ${new Date().toLocaleString()}\n\n`;

  const workbook = XLSX.readFile(FILE_PATH);
  
  // 1. Database Fetch
  console.log('Buscando dados do banco...');
  const dbItems = await db.select().from(items);
  const dbItemsMap = new Map(); // Key: Item Name (normalized) -> Item
  const dbGceMap = new Map();   // Key: GCE -> Item
  
  dbItems.forEach(item => {
    if (item.itemNome) dbItemsMap.set(normalize(item.itemNome), item);
    if (item.codigoGce && item.codigoGce !== 'S/CODIGO') dbGceMap.set(normalize(item.codigoGce), item);
  });

  report += `## Resumo do Banco de Dados Atual\n`;
  report += `- Total de Itens no Banco: **${dbItems.length}**\n`;
  report += `- Itens com Código GCE: **${dbGceMap.size}**\n\n`;

  let totalExcelItems = 0;
  let totalMatches = 0;
  let totalMissingInDb = 0;

  // 2. Excel Analysis per Sheet
  for (const sheetName of workbook.SheetNames) {
    if (sheetName === 'Folha7') continue; // Skip as per previous context

    report += `## Análise da Aba: ${sheetName}\n\n`;
    console.log(`Analisando aba: ${sheetName}`);
    
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');
    
    // Find Header
    let headerRowIndex = 0;
    let headers: string[] = [];
    
    for (let R = range.s.r; R <= Math.min(range.e.r, 10); ++R) {
      const rowValues: string[] = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
        rowValues.push(cell ? String(cell.v).trim() : '');
      }
      if (rowValues.includes('ITEM') || rowValues.includes('TINTAS PARA DOAÇÃO')) {
        headerRowIndex = R;
        headers = rowValues;
        break;
      }
    }

    if (headers.length === 0) {
      report += `⚠️ Não foi possível identificar o cabeçalho nesta aba.\n\n`;
      continue;
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex });
    
    // Column Analysis
    const columnStats: Record<string, any> = {};
    headers.forEach(h => {
        if(h) columnStats[h] = { count: 0, numericCount: 0, min: null, max: null, distinct: new Set(), types: new Set() };
    });

    const validRows: any[] = [];

    // Data Scan
    rows.forEach((row: any) => {
      // Validity check logic similar to import script
      const keys = Object.keys(row);
      const getKey = (patterns: string[]) => keys.find(k => patterns.some(p => k.toUpperCase().trim() === p.toUpperCase()));
      const keyItem = getKey(['ITEM', 'TINTAS PARA DOAÇÃO']);
      
      if (!keyItem) return;
      const itemNome = row[keyItem];
      if (!itemNome || itemNome === 'ITEM' || itemNome === 'TINTAS PARA DOAÇÃO') return;

      validRows.push(row);

      // Stats Update
      headers.forEach(header => {
        if (!header) return;
        const val = row[header];
        const stats = columnStats[header];
        
        if (val !== undefined && val !== null && val !== '') {
          stats.count++;
          stats.types.add(typeof val);
          stats.distinct.add(val);

          if (typeof val === 'number') {
            stats.numericCount++;
            if (stats.min === null || val < stats.min) stats.min = val;
            if (stats.max === null || val > stats.max) stats.max = val;
          }
        }
      });
    });

    totalExcelItems += validRows.length;

    // Report Column Stats
    report += `### Estatísticas das Colunas (${validRows.length} linhas de dados válidos)\n`;
    report += `| Coluna | Preenchimento | Tipos | Únicos | Min | Max | Padrão |\n`;
    report += `|---|---|---|---|---|---|---|\n`;

    Object.keys(columnStats).forEach(header => {
      const s = columnStats[header];
      const fillRate = ((s.count / validRows.length) * 100).toFixed(1);
      const types = Array.from(s.types).join(', ');
      const min = s.min !== null ? s.min : '-';
      const max = s.max !== null ? s.max : '-';
      let pattern = 'Misto';
      if (s.numericCount === s.count && s.count > 0) pattern = 'Numérico';
      else if (s.numericCount === 0 && s.count > 0) pattern = 'Texto';
      else if (s.count === 0) pattern = 'Vazio';

      report += `| ${header} | ${fillRate}% | ${types} | ${s.distinct.size} | ${min} | ${max} | ${pattern} |\n`;
    });
    report += `\n`;

    // 3. Comparison with DB
    report += `### Comparação com Banco de Dados\n`;
    let missingInDbCount = 0;
    let mismatchedDataCount = 0;
    const discrepancies: string[] = [];

    validRows.forEach((row: any) => {
       const keys = Object.keys(row);
       const getKey = (patterns: string[]) => keys.find(k => patterns.some(p => k.toUpperCase().trim() === p.toUpperCase()));
       
       const keyItem = getKey(['ITEM', 'TINTAS PARA DOAÇÃO']);
       const itemNome = row[keyItem];
       const normItemNome = normalize(itemNome);

       const keyCode = getKey(['CÓDIGO GCE', 'CÓDIGO', 'CODIGO']);
       const codigoGce = keyCode ? row[keyCode] : null;
       const normGce = codigoGce ? normalize(String(codigoGce)) : null;

       let dbMatch = dbItemsMap.get(normItemNome);
       if (!dbMatch && normGce) {
           dbMatch = dbGceMap.get(normGce);
       }

       if (dbMatch) {
           totalMatches++;
           // Check for discrepancies in Quantity
           const keyAtual = getKey(['Manut.', 'QUANT.', 'Quantidade', 'Estoque Atual']);
           const excelQty = keyAtual ? (Number(row[keyAtual]) || 0) : 0;
           
           if (dbMatch.estoqueAtual !== excelQty) {
               mismatchedDataCount++;
               if (discrepancies.length < 10) { // Limit detailed log
                   discrepancies.push(`- **${itemNome}**: Excel=${excelQty}, DB=${dbMatch.estoqueAtual}`);
               }
           }

       } else {
           missingInDbCount++;
           totalMissingInDb++;
           if (discrepancies.length < 20) {
               discrepancies.push(`- [AUSENTE NO BANCO] **${itemNome}** (GCE: ${codigoGce || 'N/A'})`);
           }
       }
    });

    report += `- Itens encontrados no Banco: **${validRows.length - missingInDbCount}**\n`;
    report += `- Itens ausentes no Banco: **${missingInDbCount}**\n`;
    report += `- Discrepâncias de Estoque (Amostra): **${mismatchedDataCount}**\n`;
    
    if (discrepancies.length > 0) {
        report += `\n#### Amostra de Discrepâncias/Ausências:\n`;
        discrepancies.forEach(d => report += `${d}\n`);
    }
    report += `\n---\n`;
  }

  report += `## Conclusão Geral\n`;
  report += `- Total de Itens no Excel (considerados válidos): **${totalExcelItems}**\n`;
  report += `- Total de Itens Sincronizados (match por Nome ou GCE): **${totalMatches}**\n`;
  report += `- Total de Itens do Excel não encontrados no Banco: **${totalMissingInDb}**\n`;
  
  if (totalMissingInDb === 0 && totalExcelItems === totalMatches) {
      report += `\n✅ **Estado**: Os dados do Excel parecem estar totalmente sincronizados com o banco de dados.\n`;
  } else {
      report += `\n⚠️ **Estado**: Existem diferenças entre o Excel e o Banco de Dados. Verifique os detalhes acima.\n`;
  }

  fs.writeFileSync(REPORT_PATH, report);
  console.log(`Relatório gerado em: ${REPORT_PATH}`);
  process.exit(0);
}

analyze();
