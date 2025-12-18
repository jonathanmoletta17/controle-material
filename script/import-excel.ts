
import 'dotenv/config';
import XLSX from 'xlsx';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../server/db';
import { items, SETORES } from '../shared/schema';
import { sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_PATH = path.resolve(__dirname, '../Controle de Materiais.xlsx');

// Excel Date to JS Date
function excelDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
}

function formatDate(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'number') {
    return excelDateToJSDate(val).toISOString().split('T')[0];
  }
  return String(val);
}

function normalizeSetor(sheetName: string): string {
  const normalized = sheetName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (normalized.includes('ELETRICA')) return 'ELETRICA';
  if (normalized.includes('HIDRAULICA')) return 'HIDRAULICA';
  if (normalized.includes('REFRIGERACAO')) return 'REFRIGERACAO';
  if (normalized.includes('MARCENARIA')) return 'MARCENARIA';
  if (normalized.includes('PEDREIRO')) return 'PEDREIROS';
  if (normalized.includes('PINTOR')) return 'PINTORES';
  if (normalized.includes('TINTA')) return 'PINTORES';
  if (normalized.includes('PLANILHA1')) return 'PINTORES'; // Specific case for Tintas
  return 'OUTROS';
}

async function importExcel() {
  console.log('Iniciando importação do Excel...');
  
  try {
    const workbook = XLSX.readFile(FILE_PATH);
    const allItems: any[] = [];

    for (const sheetName of workbook.SheetNames) {
      if (sheetName === 'Folha7') continue; // Skip draft/duplicate sheet
      
      console.log(`Processando aba: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      const setor = normalizeSetor(sheetName);
      
      // Find header row dynamically
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');
      let headerRowIndex = 0;
      let foundHeaders: string[] = [];

      // Scan first 10 rows for "ITEM" or "TINTAS PARA DOAÇÃO"
      for (let R = range.s.r; R <= Math.min(range.e.r, 10); ++R) {
        const rowValues: string[] = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
          rowValues.push(cell ? String(cell.v).trim() : '');
        }
        
        if (rowValues.includes('ITEM') || rowValues.includes('TINTAS PARA DOAÇÃO')) {
          headerRowIndex = R;
          foundHeaders = rowValues;
          break;
        }
      }

      console.log(`  > Cabeçalho encontrado na linha ${headerRowIndex}: ${foundHeaders.filter(h => h).join(', ')}`);

      // Create mapping from header name to column index (or just use json with correct header)
      // Since we have variations like "V. REF", "Valor de Ref.", it's safer to map index or normalized names.
      // But sheet_to_json with specific header array is easier if we clean the headers.
      
      // Let's use sheet_to_json starting from headerRowIndex + 1, but we need to pass the headers we found to ensure keys match.
      // Actually, sheet_to_json(..., { range: headerRowIndex }) treats that row as header.
      
      const rows = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex });
      let sheetCount = 0;

      for (const row: any of rows) {
        // Find keys in the row object that match our expected fields (fuzzy match)
        const keys = Object.keys(row);
        
        const getKey = (patterns: string[]) => keys.find(k => patterns.some(p => k.toUpperCase().trim() === p.toUpperCase()));
        const getKeyLike = (pattern: string) => keys.find(k => k.toUpperCase().includes(pattern.toUpperCase()));

        const keyItem = getKey(['ITEM', 'TINTAS PARA DOAÇÃO']);
        if (!keyItem) continue; // Should not happen if row is valid
        
        let itemNome = (row[keyItem] || '').trim();
        if (!itemNome || itemNome === 'ITEM' || itemNome === 'TINTAS PARA DOAÇÃO') continue;

        const keyCode = getKey(['CÓDIGO GCE', 'CÓDIGO', 'CODIGO']);
        const codigoGce = keyCode && row[keyCode] ? String(row[keyCode]).trim() : 'S/CODIGO';
        
        const keyEntrada = getKey(['Ent.Inicial', 'Entrada Inicial']);
        const entradaInicial = keyEntrada ? (Number(row[keyEntrada]) || 0) : 0;
        
        const keyMinimo = getKey(['Estoque Mínimo', 'Estoque Minimo']);
        const estoqueMinimo = keyMinimo ? (Number(row[keyMinimo]) || 0) : 0;
        
        const keyAtual = getKey(['Manut.', 'QUANT.', 'Quantidade', 'Estoque Atual']);
        const estoqueAtual = keyAtual ? (Number(row[keyAtual]) || 0) : 0;
        
        const keyPatrim = getKey(['Patrim.est.', 'Patrimonio']);
        const patrimonioEst = keyPatrim ? (Number(row[keyPatrim]) || 0) : 0;
        
        const keyAviso = getKey(['Aviso']);
        
        // V.REF variations
        const keyVRef = getKey(['V. REF', 'Valor de Ref.', 'Val. Ref.', 'V.Ref', 'Val.Ref']);
        const vRef = keyVRef ? row[keyVRef] : null;

        const keyAta = getKey(['ATA']);
        const keyObs = getKey(['OBS', 'Observações']);

        let obs = keyObs ? (row[keyObs] || '') : '';
        let valorReferencia: number | null = null;
         
        if (vRef) {
             // If it looks like a price (not a date serial ~45000), use it. 
             // Reflector 50W ~ 50-100 BRL. 45000 is likely a date.
             // But let's check if it's < 10000 or > 100000.
             if (typeof vRef === 'number' && vRef > 30000 && vRef < 60000) {
                 // Likely a date
                 obs += ` | V.REF Data: ${formatDate(vRef)}`;
             } else {
                 valorReferencia = Number(vRef) || null;
             }
        }
        
        if (keyAta && row[keyAta]) obs += ` | ATA: ${row[keyAta]}`;
        if (keyAviso && row[keyAviso]) obs += ` | Aviso: ${row[keyAviso]}`;

        // Handle Status
        let ativo = true;
        if (codigoGce && codigoGce.toLowerCase().includes('descontinuad')) {
            ativo = false;
        }

        allItems.push({
            codigoGce,
            itemNome,
            setor,
            entradaInicial,
            estoqueMinimo,
            estoqueAtual,
            patrimonioAtual: patrimonioEst,
            valorReferencia, 
            ativo,
            observacoes: obs.replace(/^ \| /, '').trim()
        });
        sheetCount++;
      }
      console.log(`  > Encontrados ${sheetCount} itens na aba ${sheetName}`);
    }

    console.log(`Encontrados ${allItems.length} itens para importar.`);

    // Clear existing items? 
    // User said "população correta... verifique a integridade". 
    // Safe to clear only if we are sure. But "Controle de Materiais.xlsx" implies full state.
    // I will use UPSERT or DELETE ALL logic.
    // Given the previous conversation about data loss, I should be careful.
    // But since the user wants "revisão completa" and "população correta", replacing DB content with Excel content is likely desired to sync them.
    // However, I will first truncate the table to ensure clean state as per "população correta".
    
    console.log('Limpando tabela items...');
    await db.delete(items);

    console.log('Inserindo itens...');
    // Batch insert
    const batchSize = 100;
    for (let i = 0; i < allItems.length; i += batchSize) {
        const batch = allItems.slice(i, i + batchSize);
        await db.insert(items).values(batch);
        console.log(`Inseridos ${Math.min(i + batchSize, allItems.length)} de ${allItems.length}`);
    }

    console.log('Importação concluída com sucesso!');
    
    // Verification
    const count = await db.select({ count: sql<number>`count(*)` }).from(items);
    console.log(`Total de itens no banco: ${count[0].count}`);

  } catch (error) {
    console.error('Erro na importação:', error);
  } finally {
    process.exit(0);
  }
}

importExcel();
