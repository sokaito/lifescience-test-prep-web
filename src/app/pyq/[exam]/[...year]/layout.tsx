import fs from "fs";
import path from "path";

// Helper to recursively find all JSON files and return their relative paths
function getJsonFiles(dir: string, baseDir: string = dir): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getJsonFiles(filePath, baseDir));
    } else if (file.endsWith('.json')) {
      const relative = path.relative(baseDir, filePath);
      // Normalize backslashes to forward slashes, strip .json extension
      const normalized = relative.replace(/\\/g, '/').replace(/\.json$/, '');
      results.push(normalized);
    }
  });
  return results;
}

export function generateStaticParams() {
  const exams = ['csir_net', 'dbt_bet', 'gate', 'icmr_jrf'];
  const params: { exam: string, year: string[] }[] = [];
  
  exams.forEach(exam => {
    try {
      const dirPath = path.join(process.cwd(), 'public', 'repository', 'pyq', exam);
      if (fs.existsSync(dirPath)) {
        const relativePaths = getJsonFiles(dirPath);
        relativePaths.forEach(relPath => {
          const parts = relPath.split('/');
          params.push({ exam, year: parts });
          
          // Next.js handles space characters in catch-all routes well, 
          // but we can generate both encoded and unencoded paths just in case.
          const encodedParts = parts.map(p => encodeURIComponent(p));
          if (encodedParts.some((p, i) => p !== parts[i])) {
            params.push({ exam, year: encodedParts });
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
  });

  return params.length > 0 ? params : [
    { exam: 'dbt_bet', year: ['2025'] },
    { exam: 'csir_net', year: ['2024'] }
  ];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
