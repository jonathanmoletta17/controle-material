
import 'dotenv/config';
import { db } from '../server/db';
import { items } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function verify() {
  console.log('Verificando integridade dos dados...');
  
  // Total items
  const count = await db.select({ count: sql<number>`count(*)` }).from(items);
  console.log(`Total de itens: ${count[0].count}`);
  
  // Count by Sector
  const bySetor = await db.select({
    setor: items.setor,
    count: sql<number>`count(*)`
  }).from(items).groupBy(items.setor);
  
  console.log('\nContagem por Setor:');
  bySetor.forEach(r => console.log(`- ${r.setor}: ${r.count}`));

  // Check for issues
  const issues = await db.select().from(items).where(sql`${items.itemNome} IS NULL OR ${items.itemNome} = ''`);
  if (issues.length > 0) {
      console.log(`\nAVISO: Encontrados ${issues.length} itens sem nome.`);
  }

  const inactive = await db.select({ count: sql<number>`count(*)` }).from(items).where(sql`${items.ativo} = false`);
  console.log(`\nItens Desativados: ${inactive[0].count}`);

  process.exit(0);
}

verify();
