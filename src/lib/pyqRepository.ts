import { shuffleArray } from "./utils";

export interface PYQQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  type?: string;
  list_1?: string[];
  list_2?: string[];
  table?: {
    headers: string[];
    rows: string[][];
  };
  section?: string;
}

export interface Paper {
  exam: string;
  year: string;
}

// These are known to exist in the repository
export const PYQ_PAPERS: Paper[] = [
  { exam: 'dbt_bet', year: '2009' },
  { exam: 'dbt_bet', year: '2010' },
  { exam: 'dbt_bet', year: '2011' },
  { exam: 'dbt_bet', year: '2013' },
  { exam: 'dbt_bet', year: '2014' },
  { exam: 'dbt_bet', year: '2015' },
  { exam: 'dbt_bet', year: '2016' },
  { exam: 'dbt_bet', year: '2017' },
  { exam: 'dbt_bet', year: '2018' },
  { exam: 'dbt_bet', year: '2019' },
  { exam: 'dbt_bet', year: '2020' },
  { exam: 'dbt_bet', year: '2021' },
  { exam: 'dbt_bet', year: '2023' },
  { exam: 'dbt_bet', year: '2024' },
  { exam: 'csir_net', year: '2023_shift1' },
  { exam: 'csir_net', year: '2023_dec_shift1' },
  { exam: 'csir_net', year: '2023_dec_shift2' },
  { exam: 'csir_net', year: '2024' },
  { exam: 'csir_net', year: '2024_june_shift1' },
  { exam: 'csir_net', year: '2024_june_shift2' },
  { exam: 'csir_net', year: '2024_dec_shift1' },
  { exam: 'csir_net', year: '2024_dec_shift2' },
  { exam: 'csir_net', year: '2025_june' },
  // Grouped GATE Zoology papers
  { exam: 'gate', year: 'zoology/Animal Anatomy and Physiology' },
  { exam: 'gate', year: 'zoology/Animal Behavior' },
  { exam: 'gate', year: 'zoology/Animal World' },
  { exam: 'gate', year: 'zoology/Biochemistry and Molecular Biology' },
  { exam: 'gate', year: 'zoology/Cell Biology' },
  { exam: 'gate', year: 'zoology/Development Biology' },
  { exam: 'gate', year: 'zoology/Ecology' },
  { exam: 'gate', year: 'zoology/Evolution' },
  { exam: 'gate', year: 'zoology/Gene Expression in Eukaryotes' },
  { exam: 'gate', year: 'zoology/Genetics' },
  { exam: 'gate', year: 'zoology/Parasitology and Immunology' },
  // Grouped GATE Botany papers
  { exam: 'gate', year: 'botany/Plant Systematics' },
  { exam: 'gate', year: 'botany/Plant Anatomy' },
  { exam: 'gate', year: 'botany/Morphogenesis andDevelopment' },
  { exam: 'gate', year: 'botany/Physiology and Biochemistry' },
  { exam: 'gate', year: 'botany/Genetics' },
  { exam: 'gate', year: 'botany/Plant Breeding and Genetic Modification' },
  { exam: 'gate', year: 'botany/Economic Botany' },
  { exam: 'gate', year: 'botany/Plant Pathology' },
  { exam: 'gate', year: 'botany/Ecology and Environment' },
  // Grouped GATE Biochemistry papers
  { exam: 'gate', year: 'biochemistry/Biomolecules' },
  { exam: 'gate', year: 'biochemistry/Metabolism' },
  { exam: 'gate', year: 'biochemistry/Analytical Chemistry' },
  { exam: 'gate', year: 'biochemistry/Cell Structure and Signal Transduction' },
  { exam: 'gate', year: 'biochemistry/Expression and Transmission of Genetic Information' },
  { exam: 'gate', year: 'biochemistry/The Immune System' },
  // Grouped GATE Chemistry papers
  { exam: 'gate', year: 'chemistry/Atomic Structure and Periodicity' },
  { exam: 'gate', year: 'chemistry/Structure and Bonding' },
  { exam: 'gate', year: 'chemistry/The s, p and d Block Elements' },
  { exam: 'gate', year: 'chemistry/Chemical Equilibria' },
  { exam: 'gate', year: 'chemistry/Electrochemistry' },
  { exam: 'gate', year: 'chemistry/Reaction Kinetics' },
  { exam: 'gate', year: 'chemistry/Thermodynamics' },
  { exam: 'gate', year: 'chemistry/Structure Reactivity Correlations and Organic Reaction Mechanisms' },
  // Grouped ICMR JRF papers
  { exam: 'icmr_jrf', year: 'applied_biology/Transfection Techniques and Biosensors' },
  { exam: 'icmr_jrf', year: 'applied_biology/Transgenic Organisms' },
  { exam: 'icmr_jrf', year: 'bioinformatics/Nucleotide Sequence Database' },
  { exam: 'icmr_jrf', year: 'bioinformatics/Protein Sequence Database' },
  { exam: 'icmr_jrf', year: 'cell_biology/Cell Cycle, Mitosis and Meiosis' },
  { exam: 'icmr_jrf', year: 'cell_biology/Cell Wall and Cell Organelles' },
  { exam: 'icmr_jrf', year: 'cell_biology/Cytoskeleton' },
  { exam: 'icmr_jrf', year: 'cell_biology/Genome Organization' },
  { exam: 'icmr_jrf', year: 'cell_biology/Membrane Structure' },
  { exam: 'icmr_jrf', year: 'cell_biology/Membrane Transport and Potential' },
  { exam: 'icmr_jrf', year: 'cell_biology/Protein Sorting' },
  { exam: 'icmr_jrf', year: 'developmental_biology/Development' },
  { exam: 'icmr_jrf', year: 'developmental_biology/Specification, Cleavage, Gastrulation and Mammalian Development' },
  { exam: 'icmr_jrf', year: 'environmental_science/Environmental Science' },
  { exam: 'icmr_jrf', year: 'evolution/Convergent and Divergent Evolution' },
  { exam: 'icmr_jrf', year: 'evolution/Evolutionary Theories and Evidences' },
  { exam: 'icmr_jrf', year: 'evolution/Genetic Drift' },
  { exam: 'icmr_jrf', year: 'general_aptitude/Moving Object Dynamics' },
  { exam: 'icmr_jrf', year: 'general_aptitude/Problems On Work' },
  { exam: 'icmr_jrf', year: 'general_aptitude/Profit, Loss and Probability' },
  { exam: 'icmr_jrf', year: 'general_aptitude/Year, Week and Days' },
  { exam: 'icmr_jrf', year: 'general_knowledge/General Knowledge' },
  { exam: 'icmr_jrf', year: 'immunology/Antibody Structure, Diversity and Monoclonal Antibodies' },
  { exam: 'icmr_jrf', year: 'immunology/Antigens and Immunogenicity' },
  { exam: 'icmr_jrf', year: 'immunology/Humoral and Cell-Mediated Responses' },
  { exam: 'icmr_jrf', year: 'immunology/Hypersensitivity, Autoimmunity, Vaccines and Cancer' },
  { exam: 'icmr_jrf', year: 'methods_in_biology/Biophysical Methods' },
  { exam: 'icmr_jrf', year: 'methods_in_biology/Microscopy Methods' },
  { exam: 'icmr_jrf', year: 'methods_in_biology/Molecular and Immuno Techniques' },
  { exam: 'icmr_jrf', year: 'methods_in_biology/Recombinant DNA Methods' },
  { exam: 'icmr_jrf', year: 'microbiology/Agricultural, Soil, Air and Water Microbiology' },
  { exam: 'icmr_jrf', year: 'microbiology/Bacterial Genetics' },
  { exam: 'icmr_jrf', year: 'microbiology/Clinical Microbiology' },
  { exam: 'icmr_jrf', year: 'microbiology/Industrial, Food and Dairy Microbiology' },
  { exam: 'icmr_jrf', year: 'microbiology/Introduction to Microbiology' },
  { exam: 'icmr_jrf', year: 'microbiology/Microbial Cultivation' },
  { exam: 'icmr_jrf', year: 'microbiology/Microbial Taxonomy and Morphology' },
  { exam: 'icmr_jrf', year: 'microbiology/Pharmaceutical Microbiology' },
  { exam: 'icmr_jrf', year: 'molecular_biology/DNA Damage and Repair Mechanisms' },
  { exam: 'icmr_jrf', year: 'molecular_biology/DNA Replication' },
  { exam: 'icmr_jrf', year: 'molecular_biology/Eukaryotic Gene Regulation' },
  { exam: 'icmr_jrf', year: 'molecular_biology/Prokaryotic Gene Regulation' },
  { exam: 'icmr_jrf', year: 'molecular_biology/Transcription Process' },
  { exam: 'icmr_jrf', year: 'molecular_biology/Translation Process' },
  { exam: 'icmr_jrf', year: 'veterinary_science/Breeds' },
  { exam: 'icmr_jrf', year: 'veterinary_science/Ruminant Animals and Diseases' },
  { exam: 'icmr_jrf', year: 'zoology/Anatomy and Morphology' },
  { exam: 'icmr_jrf', year: 'zoology/Animal Physiology' },
  { exam: 'icmr_jrf', year: 'zoology/Taxonomy and Systematics' },
];

/**
 * Configuration for remote question updates.
 * If you host your JSON files on a website (e.g. Vercel/Firebase), 
 * the installed app will fetch the LATEST versions automatically.
 */
const REMOTE_REPO_URL = "https://csir-net-mocktest.web.app"; // Example: "https://lifescience-prep.web.app"

/**
 * Fetches questions from a specific PYQ paper.
 * Tries Remote URL first (for live updates), then falls back to Local Bundle.
 */
export async function fetchPYQQuestions(exam: string, year: string): Promise<PYQQuestion[]> {
  const relativePath = `/repository/pyq/${exam}/${year}.json`;

  // 1. Try Remote Fetch (Live Update)
  // Skip remote fetch on localhost to allow testing local JSON changes
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (REMOTE_REPO_URL && !isLocalhost) {
    try {
      const remoteRes = await fetch(`${REMOTE_REPO_URL}${relativePath}`, { cache: 'no-store' });
      if (remoteRes.ok) {
        return await remoteRes.json();
      }
    } catch (err) {
      console.log("Remote update not available, using bundled data.");
    }
  }

  // 2. Fallback to Local Bundle (Bundled with APK/App)
  try {
    const response = await fetch(relativePath);
    if (!response.ok) throw new Error(`Failed to fetch ${exam} ${year}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching PYQ questions:", error);
    return [];
  }
}

/**
 * Normalizes a PYQQuestion to the standard Question interface used by the test engine.
 */
export function normalizePYQToStandard(q: PYQQuestion, source: string): any {
  return {
    id: `pyq-${source}-${q.id}`,
    question: q.question,
    options: shuffleArray(q.options || []),
    correctAnswer: q.correct_answer,
    explanation: q.explanation,
    type: q.type,
    list_1: q.list_1,
    list_2: q.list_2,
    table: q.table,
    section: q.section,
    randomKey: Math.random(),
    source: source // Extra info for tracking
  };
}
