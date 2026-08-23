// Script de teste para verificar se os posts estão sendo retornados pela API
// Execute: node scripts/test-blog-api.mjs

const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const ADMIN_PASS = process.env.ADMIN_PASS || '';

async function testBlogAPI() {
  console.log('🔍 Testando API de Blog...\n');

  try {
    const url = `${API_URL}/api/admin/blog?page=1&perPage=10`;
    console.log('📡 Fazendo requisição para:', url);

    const response = await fetch(url, {
      headers: {
        'x-admin-pass': ADMIN_PASS,
      },
    });

    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('\n📦 Dados retornados:');
    console.log(JSON.stringify(data, null, 2));

    if (data.items && Array.isArray(data.items)) {
      console.log(`\n✅ Total de posts: ${data.items.length}`);
      console.log(`📊 Total no banco: ${data.total || 0}`);

      if (data.items.length > 0) {
        console.log('\n📝 Primeiro post:');
        console.log(JSON.stringify(data.items[0], null, 2));
      } else {
        console.log('\n⚠️ Nenhum post encontrado no resultado');
      }
    } else {
      console.log('\n❌ Estrutura de dados inesperada');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  }
}

testBlogAPI();
