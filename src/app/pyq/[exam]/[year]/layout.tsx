import fs from "fs";
import path from "path";

export function generateStaticParams() {
  const exams = ['csir_net', 'dbt_bet', 'gate'];
  const params: { exam: string, year: string }[] = [];
  
  exams.forEach(exam => {
    try {
      const dirPath = path.join(process.cwd(), 'public', 'repository', 'pyq', exam);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        files.forEach((file: string) => {
          if (file.endsWith('.json')) {
            const name = file.replace('.json', '');
            params.push({ exam, year: name });
            if (name.includes(' ')) {
              params.push({ exam, year: encodeURIComponent(name) });
            }
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
  });

  return params.length > 0 ? params : [
    { exam: 'dbt_bet', year: '2025' },
    { exam: 'csir_net', year: '2024' }
  ];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
