import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();

async function ensureDir(p){ await fs.mkdir(p, {recursive:true}); }

async function moveAdmin(){
  const src = path.join(root, "app", "admin");
  const dst = path.join(root, "app", "(admin)", "admin");
  try {
    const stat = await fs.stat(src).catch(()=>null);
    if (!stat) { console.log("✔ Nada para mover: app/admin não existe"); return; }
    await ensureDir(dst);
    async function walk(from, rel=""){
      const entries = await fs.readdir(path.join(from, rel), { withFileTypes: true });
      for (const e of entries){
        const relPath = path.join(rel, e.name);
        const fromPath = path.join(from, relPath);
        const toPath = path.join(dst, relPath);
        if (e.isDirectory()) { await ensureDir(toPath); await walk(from, relPath); }
        else { await fs.copyFile(fromPath, toPath); }
      }
    }
    await walk(src);
    console.log("✔ Copiado app/admin → app/(admin)/admin");
  } catch (e) {
    console.error("Erro movendo admin:", e);
  }
}

await moveAdmin();
console.log("✔ Patch de estrutura aplicado.");
