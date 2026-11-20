import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

const OUT_DIR = path.resolve(process.cwd(), 'public/demo-pdfs');
fs.mkdirSync(OUT_DIR, { recursive: true });

function drawHeaderBanner(
  doc: jsPDF,
  title: string,
  subtitle: string,
  specimenCode: string
) {
  // Navy top bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');

  // Accent stripe
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 32, 210, 2.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('UNIVERSITE FICTIVE DE DEMONSTRATION — POLE DOCTORAL GCD', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(191, 219, 254);
  doc.text('Centre d Etudes Doctorales Sciences & Technologies (CEDoc Demo)', 14, 18);
  doc.text(`Reference Specimen : ${specimenCode}`, 14, 24);

  // Specimen warning pill on top right
  doc.setFillColor(220, 38, 38);
  doc.roundedRect(142, 7, 56, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SPECIMEN FICTIF DEMO', 170, 13.5, { align: 'center' });

  // Document title block
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, 14, 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(subtitle, 14, 52.5);

  // Disclaimer banner
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(14, 57, 182, 10, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(153, 27, 27);
  doc.text(
    'AVERTISSEMENT : Document de demonstration genere avec des donnees 100% fictives. Ne constitue pas un acte officiel authentique.',
    105,
    63.2,
    { align: 'center' }
  );
}

function drawFooters(doc: jsPDF, docName: string) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 281, 196, 281);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `GCD Portail Doctorat · ${docName} · Document fictif a usage pedagogique`,
      14,
      287
    );
    doc.text(`Page ${i} / ${pageCount}`, 196, 287, { align: 'right' });
  }
}

function drawKeyValueBox(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  rows: Array<[string, string]>
): number {
  const rowH = 7.5;
  const h = rows.length * rowH + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  let curY = y + 7;
  for (const [k, v] of rows) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`${k} :`, x + 5, curY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(v, x + 56, curY);
    curY += rowH;
  }
  return y + h;
}

function writeWrapped(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 5.2
): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function savePdf(doc: jsPDF, filename: string) {
  const outPath = path.join(OUT_DIR, filename);
  const buffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated ${filename} (${buffer.length} bytes, ${doc.getNumberOfPages()} page(s))`);
}

// 1. Attestation de réussite
function buildAttestationReussite() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeaderBanner(
    doc,
    'ATTESTATION DE REUSSITE (SPECIMEN)',
    'Service de la Scolarite & des Etudes Superieures — Annee Universitaire Fictive 2025/2026',
    'DEMO-ATT-2026-001'
  );

  let y = 76;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  y = writeWrapped(
    doc,
    'Le Chef d etablissement fictif atteste par le present document de demonstration que l etudiant(e) identifie(e) ci-dessous a valide l ensemble des modules et soutenu avec succes son memoire de fin d etudes :',
    14,
    y,
    182
  );

  y += 4;
  y = drawKeyValueBox(doc, 14, y, 182, [
    ['Nom et Prenom', 'EL IDRISSI Yassine (Identite fictive de demonstration)'],
    ['Code Etudiant (CNE)', 'SPEC-CNE-2026-0041'],
    ['Numero CNIE fictif', 'XX000142'],
    ['Diplome prepare', 'Master Recherche en Sciences des Donnees & Intelligence Artificielle'],
    ['Etablissement', 'Ecole Superieure de Technologie Fictive (EST Demo)'],
    ['Session de validation', 'Juin 2026 — Session Normale'],
    ['Moyenne generale', '16.40 / 20'],
    ['Mention obtenue', 'Tres Bien (Specimen pedagogique)']
  ]);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  y = writeWrapped(
    doc,
    'La presente attestation de demonstration est delivree pour illustrer le depot et la verification des pieces justificatives dans la plateforme de Gestion des Candidatures Doctorales (GCD).',
    14,
    y,
    182
  );

  y += 14;
  doc.setDrawColor(148, 163, 184);
  doc.roundedRect(126, y, 68, 30, 2, 2, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Visa Pedagogique Numerique', 160, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Fait a Fes (Demo), le 15 Juillet 2026', 160, y + 16, { align: 'center' });
  doc.text('SCEAU SPECIMEN NON OFFICIEL', 160, y + 23, { align: 'center' });

  drawFooters(doc, 'Attestation de reussite');
  savePdf(doc, 'attestation-reussite-demo.pdf');
}

// 2. Diplôme universitaire
function buildDiplomeUniversitaire() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  // Formal border
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(1.2);
  doc.rect(7, 7, 196, 283);
  doc.setDrawColor(147, 197, 253);
  doc.setLineWidth(0.4);
  doc.rect(10, 10, 190, 277);

  drawHeaderBanner(
    doc,
    'DIPLOME UNIVERSITAIRE D ETAT (SPECIMEN)',
    'Grade d Ingenieur / Master Recherche — Modele de Demonstration GCD',
    'DEMO-DIP-2026-002'
  );

  let y = 78;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138);
  doc.text('VU LES PROCES-VERBAUX DE DELIBERATION DU JURY DE DEMONSTRATION', 105, y, {
    align: 'center'
  });

  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  y = writeWrapped(
    doc,
    'Le grade universitaire fictif d Ingenieur d Etat en Genie Logiciel & Systemes Intelligents est confere au titulaire suivant dans le cadre du jeu de donnees pedagogique GCD :',
    16,
    y,
    178
  );

  y += 6;
  y = drawKeyValueBox(doc, 16, y, 178, [
    ['Titulaire fictif', 'BENJELLOUN Sami (Specimen de demonstration)'],
    ['Date et lieu de naissance', '12 Mars 2002 — Ville Fictive'],
    ['Matricule national fictif', 'SPEC-MAT-884210'],
    ['Filiere accreditee', 'Genie Logiciel, Architecture Distribuee & IA'],
    ['Soutenance du PFE', 'Validée devant jury le 24 Juin 2026'],
    ['Classement / Mention', 'Mention Tres Bien — Major de promotion (Fictif)']
  ]);

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Authentification de demonstration :', 16, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  writeWrapped(
    doc,
    'Ce document est un fichier PDF reel multi-composants genere exclusivement pour tester le lecteur PDF integre PDF.js et la verification documentaire par les directeurs de these dans GCD.',
    16,
    y,
    178
  );

  drawFooters(doc, 'Diplome universitaire');
  savePdf(doc, 'diplome-universitaire-demo.pdf');
}

// 3. Relevé de notes (2 pages)
function buildReleveNotes() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeaderBanner(
    doc,
    'RELEVE DE NOTES OFFICIEL — CURSUS MASTER (SPECIMEN)',
    'Annee Universitaire Fictive 2024/2026 — Semestres S1 a S4',
    'DEMO-RN-2026-003'
  );

  let y = 73;
  y = drawKeyValueBox(doc, 14, y, 182, [
    ['Etudiant(e) fictif(ve)', 'ALAMI Nadia (Donnees de demonstration)'],
    ['Identifiant CNE fictif', 'SPEC-CNE-2026-0092'],
    ['Parcours', 'Master Recherche — Data Science & Systemes Embarques']
  ]);

  const drawGradeTable = (
    semesterTitle: string,
    startY: number,
    rows: Array<[string, string, string, string]>
  ): number => {
    let cy = startY;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(semesterTitle, 14, cy);
    cy += 4;

    // Table header
    doc.setFillColor(30, 41, 59);
    doc.rect(14, cy, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.text('Code Module', 17, cy + 5.5);
    doc.text('Intitule de l Unité d Enseignement', 46, cy + 5.5);
    doc.text('Note / 20', 145, cy + 5.5);
    doc.text('Resultat', 172, cy + 5.5);
    cy += 8;

    rows.forEach((row, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, cy, 182, 7.5, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(14, cy + 7.5, 196, cy + 7.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(row[0], 17, cy + 5);
      doc.text(row[1], 46, cy + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(row[2], 148, cy + 5);
      doc.setTextColor(5, 150, 105);
      doc.text(row[3], 172, cy + 5);
      cy += 7.5;
    });

    return cy + 8;
  };

  y = drawGradeTable('Semestre 1 — Fondements Mathematiques & Algorithmique', y + 8, [
    ['M101', 'Apprentissage Statistique & Probabilites Avancees', '16.50', 'Valide'],
    ['M102', 'Algorithmique Distribuee & Complexite', '15.80', 'Valide'],
    ['M103', 'Bases de Donnees NoSQL & Architecture Big Data', '17.10', 'Valide'],
    ['M104', 'Genie Logiciel Avance & Methodes Formelles', '16.20', 'Valide'],
    ['M105', 'Methodologie de la Recherche Scientifique', '17.00', 'Valide']
  ]);

  drawGradeTable('Semestre 2 — Intelligence Artificielle & Reseaux', y, [
    ['M201', 'Apprentissage Profond (Deep Learning) & Vision', '17.40', 'Valide'],
    ['M202', 'Traitement Automatique du Langage Naturel', '16.10', 'Valide'],
    ['M203', 'Cybersecurite des Systemes & Cryptographie', '15.90', 'Valide'],
    ['M204', 'Cloud Computing & Virtualisation Conteneurisee', '16.80', 'Valide'],
    ['M205', 'Anglais Scientifique & Redaction Academique', '17.20', 'Valide']
  ]);

  // Page 2
  doc.addPage();
  drawHeaderBanner(
    doc,
    'RELEVE DE NOTES OFFICIEL — SEMESTRES S3 & S4 (SUITE)',
    'Bilan Cumulatif de Demonstration — Donnees Fictives',
    'DEMO-RN-2026-003'
  );

  let y2 = drawGradeTable('Semestre 3 — Specialisation & Recherche', 76, [
    ['M301', 'Modeles Auto-Supervises & Imagerie Medicale', '17.60', 'Valide'],
    ['M302', 'Optimisation Stochastique & Calcul Haute Performance', '16.00', 'Valide'],
    ['M303', 'Systemes IoT Intelligents & Edge AI', '16.40', 'Valide'],
    ['M304', 'Seminaire Doctoral & Etat de l Art', '17.50', 'Valide']
  ]);

  y2 = drawGradeTable('Semestre 4 — Projet de Fin d Etudes (PFE Recherche)', y2, [
    ['M401', 'Stage en Laboratoire de Recherche (6 mois)', '17.20', 'Valide'],
    ['M402', 'Memoire & Soutenance Publique devant Jury', '17.80', 'Valide']
  ]);

  drawKeyValueBox(doc, 14, y2, 182, [
    ['Moyenne Generale Cumulee (S1-S4)', '16.75 / 20'],
    ['Decision finale du Jury (Demo)', 'Admis avec Mention Tres Bien'],
    ['Credits ECTS valides', '120 / 120 ECTS (Specimen)']
  ]);

  drawFooters(doc, 'Releve de notes (2 pages)');
  savePdf(doc, 'releve-notes-demo.pdf');
}

// 4. Curriculum Vitae (2 pages)
function buildCvAcademique() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeaderBanner(
    doc,
    'CURRICULUM VITAE ACADEMIQUE (SPECIMEN)',
    'Candidature au Cycle Doctoral — Profil Fictif de Demonstration',
    'DEMO-CV-2026-004'
  );

  let y = 74;
  y = drawKeyValueBox(doc, 14, y, 182, [
    ['Candidat fictif', 'CHRAIBI Salma (Identite de demonstration)'],
    ['Email academique fictif', 'specimen.candidat@demo-univ.ac.ma'],
    ['Domaine cible', 'Intelligence Artificielle, Vision par Ordinateur & Cloud'],
    ['Localisation', 'Campus Universitaire Fictif — Ville Demo']
  ]);

  const addSection = (heading: string, bullets: string[], curY: number): number => {
    let ny = curY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text(heading, 14, ny);
    doc.setDrawColor(191, 219, 254);
    doc.line(14, ny + 1.5, 196, ny + 1.5);
    ny += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    for (const b of bullets) {
      ny = writeWrapped(doc, `• ${b}`, 16, ny, 178, 4.8) + 2;
    }
    return ny;
  };

  y = addSection(
    'FORMATION UNIVERSITAIRE (DONNEES FICTIVES)',
    [
      '2024 - 2026 : Master Recherche en Sciences des Donnees & Intelligence Artificielle — Mention Tres Bien (16.75/20).',
      '2021 - 2024 : Licence Fondamentale en Sciences Mathematiques et Informatique — Mention Bien.',
      '2020 - 2021 : Baccalaureat Sciences Mathematiques — Mention Tres Bien.'
    ],
    y
  );

  y = addSection(
    'EXPERIENCES DE RECHERCHE & PROJETS ACADEMIQUE',
    [
      'Stage PFE (6 mois, 2026) — Laboratoire Demo LISS : Conception de modeles legers de segmentation d imagerie medicale par apprentissage auto-supervise (PyTorch, MONAI).',
      'Projet Recherche M1 (2025) : Detection d anomalies temps reel sur flux IoT avec reseaux de neurones quantifies pour materiel embarque.',
      'Encadrement de travaux pratiques (tutorat etudiant fictif) en programmation Python et bases de donnees relationnelles.'
    ],
    y
  );

  // Page 2
  doc.addPage();
  drawHeaderBanner(
    doc,
    'CURRICULUM VITAE ACADEMIQUE — SUITE (PAGE 2)',
    'Publications Fictives, Competences Techniques & Langues',
    'DEMO-CV-2026-004'
  );

  let y2 = 72;
  y2 = addSection(
    'PUBLICATIONS & COMMUNICATIONS SCIENTIFIQUES (SPECIMENS FICTIFS)',
    [
      'Chraibi S. et al. (2026), "Lightweight Self-Supervised Vision Transformers for Medical Screening", Workshop Pedagogique Demo-AI, pp. 12-19.',
      'Chraibi S. (2025), "Optimisation de l inference sur architecture Edge", Poster Scientifique Journee Doctorale Fictive.'
    ],
    y2
  );

  y2 = addSection(
    'COMPETENCES TECHNIQUES & OUTILS',
    [
      'Langages : Python, TypeScript, C++, SQL, Bash.',
      'IA & Calcul Scientifique : PyTorch, TensorFlow, Scikit-learn, OpenCV, HuggingFace.',
      'Ingenierie Logicielle & DevOps : Docker, Git, Linux, FastAPI, React, PostgreSQL.',
      'Methodologie : Revue de litterature (IEEE/ACM/Springer), redaction LaTeX, plans d experiences reproductibles.'
    ],
    y2
  );

  addSection(
    'LANGUES & DISTINCTIONS',
    [
      'Arabe : Langue maternelle · Francais : Courant (C1) · Anglais : Scientifique et technique avance (B2/C1).',
      'Bourse fictive d excellence academique pour la duree du cycle Master (2024-2026).'
    ],
    y2
  );

  drawFooters(doc, 'Curriculum Vitae (2 pages)');
  savePdf(doc, 'cv-academique-demo.pdf');
}

// 5. Lettre de motivation
function buildLettreMotivation() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeaderBanner(
    doc,
    'LETTRE DE MOTIVATION DOCTORALE (SPECIMEN)',
    'Candidature au Cycle Doctoral Sciences & Technologies',
    'DEMO-LM-2026-005'
  );

  let y = 76;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Objet : Candidature a une these de doctorat en Informatique & IA (Specimen)', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text('A l attention de Monsieur/Madame le Directeur de These et de la Commission du CEDoc', 14, y);

  y += 12;
  doc.setFontSize(10.2);
  doc.setTextColor(30, 41, 59);

  const paragraphs = [
    'Madame, Monsieur le Directeur de These,',
    'Titulaire d un diplome de Master Recherche obtenu avec la mention Tres Bien (profil fictif de demonstration), j ai l honneur de soumettre ma candidature au sein de votre equipe de recherche pour preparer une these de doctorat.',
    'Au cours de mon cursus universitaire et de mon projet de fin d etudes, j ai acquis de solides bases en apprentissage automatique, en genie logiciel et en conception d architectures distribuees. Mes travaux m ont conduit a developper une approche rigoureuse de l experimentation scientifique et de la validation statistique.',
    'Le sujet propose dans votre laboratoire correspond pleinement a mes objectifs scientifiques : concevoir des modeles sobres, explicables et fiables capables de fonctionner sous contraintes de ressources tout en garantissant un haut niveau de performance et de reproductibilite.',
    'Intégrer le Centre d Etudes Doctorales me permettrait de contribuer activement aux publications de l equipe, de participer aux seminaires doctoraux et de valoriser les resultats obtenus au sein de la communaute academique internationale.',
    'Dans l attente de l examen de mon dossier, je vous prie d agreer, Madame, Monsieur, l expression de mes salutations respectueuses.',
    'Signe : Candidat Specimen Demo (Document fictif de test)'
  ];

  for (const p of paragraphs) {
    y = writeWrapped(doc, p, 14, y, 182, 5.4) + 5;
  }

  drawFooters(doc, 'Lettre de motivation');
  savePdf(doc, 'lettre-motivation-demo.pdf');
}

// 6. Projet de recherche doctorale (3 pages)
function buildProjetRecherche() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeaderBanner(
    doc,
    'AVANT-PROJET DE RECHERCHE DOCTORALE (SPECIMEN)',
    'Modeles Fondamentaux Legers et Apprentissage Auto-Supervise — Document 3 Pages',
    'DEMO-PR-2026-006'
  );

  let y = 74;
  y = drawKeyValueBox(doc, 14, y, 182, [
    ['Intitule du projet', 'Modeles legers auto-supervises pour le diagnostic medical'],
    ['Laboratoire d accueil', 'Laboratoire LISS (Cadre de demonstration GCD)'],
    ['Duree previsionnelle', '36 mois (3 annees doctorales)'],
    ['Mots-cles', 'Deep Learning, Self-Supervised Learning, Distillation, Edge AI']
  ]);

  const addSection = (title: string, body: string, curY: number): number => {
    let ny = curY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text(title, 14, ny);
    ny += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.8);
    doc.setTextColor(30, 41, 59);
    ny = writeWrapped(doc, body, 14, ny, 182, 5.2);
    return ny;
  };

  y = addSection(
    '1. CONTEXTE SCIENTIFIQUE ET PROBLEMATIQUE',
    'Les modeles de fondation recents en vision par ordinateur offrent des performances remarquables sur les taches de classification et de segmentation. Toutefois, leur cout computationnel et leur dependance a de larges jeux de donnees annotes limitent leur deploiement dans les environnements cliniques disposant de ressources materielles moderees. Cette these vise a concevoir des architectures compactes entrainees par apprentissage auto-supervise.',
    y
  );

  y = addSection(
    '2. OBJECTIFS DE RECHERCHE',
    'L objectif principal est de reduire de plus de 70% le nombre de parametres et la latence d inference tout en maintenant une precision diagnostique comparable aux modeles de reference. Trois axes sont retenus : (1) pre-entrainement auto-supervise sans annotations couteuses, (2) distillation de connaissances multi-echelles, (3) calibration de l incertitude pour l aide a la decision.',
    y
  );

  // Page 2
  doc.addPage();
  drawHeaderBanner(
    doc,
    'AVANT-PROJET DE RECHERCHE — ETAT DE L ART & METHODOLOGIE',
    'Page 2 / 3 — Cadre Methodologique et Architecture Proposee',
    'DEMO-PR-2026-006'
  );

  let y2 = 72;
  y2 = addSection(
    '3. SYNTHESE DE L ETAT DE L ART',
    'Les approches DINO, MAE et SimCLR ont demontre l efficacite du pre-entrainement contrastif et par masquage sur images naturelles et medicales. Parallelement, les reseaux hybrides CNN-Transformer (MobileViT, EfficientFormer) permettent un compromis favorable entre capture de contexte global et efficacite memoire. Neanmoins, la robustesse face aux changements de domaine entre centres hospitaliers reste un verrou majeur.',
    y2
  );

  y2 = addSection(
    '4. METHODOLOGIE EXPERIMENTALE PROPOSEE',
    'Etape A : Constitution d un corpus d evaluation multi-sources normalise et anonymise. Etape B : Conception d un encodeur hybride leger associe a un objectif d invariance multi-vues. Etape C : Integration d une couche d estimation d incertitude epistemique (Monte Carlo / Evidential Deep Learning) afin de signaler les cas ambigus au praticien.',
    y2
  );

  y2 = addSection(
    '5. PROTOCOLES DE VALIDATION & METRIQUES',
    'Les performances seront evaluees selon l AUC-ROC, le score Dice, l ECE (Expected Calibration Error), le nombre de FLOPs et le temps d inference sur GPU embarque. Des etudes d ablation systematiques permettront de mesurer la contribution de chaque composant architectural.',
    y2
  );

  // Page 3
  doc.addPage();
  drawHeaderBanner(
    doc,
    'AVANT-PROJET DE RECHERCHE — CHRONOGRAMME & BIBLIOGRAPHIE',
    'Page 3 / 3 — Plan de Travail sur 36 Mois',
    'DEMO-PR-2026-006'
  );

  let y3 = 72;
  y3 = drawKeyValueBox(doc, 14, y3, 182, [
    ['Annee 1 (Mois 1 - 12)', 'Revue bibliographique approfondie, preparation des donnees, premieres maquettes'],
    ['Annee 2 (Mois 13 - 24)', 'Developpement des methodes de distillation, validation croisee, soumission revues'],
    ['Annee 3 (Mois 25 - 36)', 'Tests de robustesse, redaction du manuscrit de these et soutenance']
  ]);

  addSection(
    '6. BIBLIOGRAPHIE INDICATIVE (REFERENCES DE DEMONSTRATION)',
    '[1] Dosovitskiy A. et al., "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale", ICLR 2021.\n[2] He K. et al., "Masked Autoencoders Are Scalable Vision Learners", CVPR 2022.\n[3] Caron M. et al., "Emerging Properties in Self-Supervised Vision Transformers", ICCV 2021.\n[4] Mehta S. & Rastegari M., "MobileViT: Light-weight, General-purpose, and Mobile-friendly Vision Transformer", ICLR 2022.',
    y3 + 4
  );

  drawFooters(doc, 'Projet de recherche doctorale (3 pages)');
  savePdf(doc, 'projet-recherche-demo.pdf');
}

// 7. Attestation d'inscription
function buildAttestationInscription() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeaderBanner(
    doc,
    'ATTESTATION D INSCRIPTION UNIVERSITAIRE (SPECIMEN)',
    'Service des Inscriptions & Vie Etudiante — Modele Fictif',
    'DEMO-INS-2026-007'
  );

  let y = 76;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  y = writeWrapped(
    doc,
    'L etablissement universitaire de demonstration certifie que l etudiant(e) ci-apres est regulierement inscrit(e) au titre de l annee universitaire fictive 2025/2026 :',
    14,
    y,
    182
  );

  y += 5;
  y = drawKeyValueBox(doc, 14, y, 182, [
    ['Nom & Prenom (fictif)', 'TAHIRI Hamza (Specimen de demonstration)'],
    ['Code Apogee / CNE fictif', 'SPEC-APO-2026-771'],
    ['Cycle d etudes', 'Master Recherche (Bac+5) — En cours de finalisation'],
    ['Filiere', 'Sciences des Donnees, Reseaux et Systemes Intelligents'],
    ['Statut administratif', 'Inscrit regulier — Piece justificative complementaire Demo']
  ]);

  y += 12;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  writeWrapped(
    doc,
    'Note : Ce document PDF de demonstration est fourni a titre purement illustratif afin de tester la consultation multi-documents dans GCD.',
    14,
    y,
    182
  );

  drawFooters(doc, 'Attestation d inscription');
  savePdf(doc, 'attestation-inscription-demo.pdf');
}

// ============================================================================
// DOSSIER COMPLET DE DEMONSTRATION — AYOUB REGRAGUI (6 VERITABLES PDF)
// ============================================================================

const REGRAGUI_DIR = path.resolve(OUT_DIR, 'ayoub-regragui');
fs.mkdirSync(REGRAGUI_DIR, { recursive: true });

function saveRegraguiPdf(doc: jsPDF, filename: string) {
  const outPath = path.join(REGRAGUI_DIR, filename);
  const buffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated ayoub-regragui/${filename} (${buffer.length} bytes, ${doc.getNumberOfPages()} page(s))`);
}

function drawRegraguiHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  refCode: string
) {
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 32, 210, 2.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('UNIVERSITE SIDI MOHAMED BEN ABDELLAH — POLE DOCTORAL GCD', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(191, 219, 254);
  doc.text('Centre d Etudes Doctorales Sciences & Technologies · EST Fes (Cadre Demo)', 14, 18.5);
  doc.text(`Dossier : GCD-2026-USMBA-0115 · Piece : ${refCode}`, 14, 24.5);

  // Prominent DOCUMENT DE DEMONSTRATION badge
  doc.setFillColor(220, 38, 38);
  doc.roundedRect(136, 7, 62, 11, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  doc.text('DOCUMENT DE DEMONSTRATION', 167, 13.8, { align: 'center' });

  // Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(title, 14, 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.2);
  doc.setTextColor(71, 85, 105);
  doc.text(subtitle, 14, 51.5);

  // Mandatory demo disclaimer
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(14, 56, 182, 10, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.6);
  doc.setTextColor(153, 27, 27);
  doc.text(
    'DOCUMENT DE DEMONSTRATION — Donnees fictives a but pedagogique. Ne constitue en aucun cas un document officiel authentique.',
    105,
    62.2,
    { align: 'center' }
  );
}

function drawRegraguiFooters(doc: jsPDF, docLabel: string) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 281, 196, 281);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(185, 28, 28);
    doc.text('DOCUMENT DE DEMONSTRATION', 14, 287);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`· ${docLabel} · Ayoub Regragui (GCD-2026-USMBA-0115)`, 58, 287);
    doc.text(`Page ${i} / ${pageCount}`, 196, 287, { align: 'right' });
  }
}

// 1. Attestation de diplôme / Réussite — Ayoub Regragui
function buildRegraguiDiplome() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(1.1);
  doc.rect(7, 7, 196, 283);
  doc.setDrawColor(147, 197, 253);
  doc.setLineWidth(0.4);
  doc.rect(10, 10, 190, 277);

  drawRegraguiHeader(
    doc,
    'ATTESTATION DE DIPLOME & REUSSITE (DEMO)',
    'Diplome d Ingenieur d Etat en Genie Logiciel — Promotion Fictive 2025/2026',
    'DIP-REG-2026-01'
  );

  let y = 76;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('ATTESTATION ACADEMIQUE DE VALIDATION DE GRADE (SPECIMEN)', 105, y, { align: 'center' });

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  y = writeWrapped(
    doc,
    'Le Directeur de l etablissement universitaire (cadre de demonstration GCD) atteste que l etudiant identifie ci-dessous a satisfait a toutes les epreuves theoriques, pratiques et a la soutenance du Projet de Fin d Etudes requises pour l obtention du grade :',
    16,
    y,
    178
  );

  y += 5;
  y = drawKeyValueBox(doc, 16, y, 178, [
    ['Nom et Prenom', 'REGRAGUI Ayoub'],
    ['Code National Etudiant (CNE)', 'N139820412'],
    ['Numero CNIE (fictif)', 'CD712894'],
    ['Etablissement d origine', 'Ecole Superieure de Technologie de Fes (EST Fes - USMBA)'],
    ['Diplome delivre', 'Ingenieur d Etat en Genie Logiciel'],
    ['Session de deliberation', 'Juin 2026 — Session Normale'],
    ['Moyenne generale cumulee', '16.40 / 20'],
    ['Mention attribuee', 'Tres Bien — Felicitation du Jury (Donnees fictives)']
  ]);

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Projet de Fin d Etudes (PFE) soutenu :', 16, y);
  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  y = writeWrapped(
    doc,
    '"Architecture logicielle legere et apprentissage auto-supervise pour l analyse diagnostique d images medicales" — Note de soutenance : 17.50 / 20.',
    16,
    y,
    178
  );

  y += 12;
  doc.setDrawColor(148, 163, 184);
  doc.roundedRect(124, y, 70, 30, 2, 2, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Cachet Fictif de Demonstration', 159, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Fes (Demo), le 10 Juillet 2026', 159, y + 16, { align: 'center' });
  doc.text('DOCUMENT DE DEMONSTRATION', 159, y + 23, { align: 'center' });

  drawRegraguiFooters(doc, 'Attestation de diplome');
  saveRegraguiPdf(doc, '01-attestation-diplome-regragui.pdf');
}

// 2. Relevés de notes officiels — Ayoub Regragui (2 pages)
function buildRegraguiReleveNotes() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawRegraguiHeader(
    doc,
    'RELEVES DE NOTES OFFICIELS — CYCLE INGENIEUR (DEMO)',
    'Ingenieur d Etat en Genie Logiciel · Annees Universitaires 2024 - 2026',
    'RN-REG-2026-02'
  );

  let y = 72;
  y = drawKeyValueBox(doc, 14, y, 182, [
    ['Candidat', 'REGRAGUI Ayoub'],
    ['CNE / Massar', 'N139820412 · CNIE : CD712894'],
    ['Formation', 'Ingenieur d Etat en Genie Logiciel (EST Fes - USMBA)']
  ]);

  const drawTable = (
    heading: string,
    startY: number,
    rows: Array<[string, string, string, string]>
  ): number => {
    let cy = startY;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(heading, 14, cy);
    cy += 3.5;

    doc.setFillColor(30, 41, 59);
    doc.rect(14, cy, 182, 7.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.2);
    doc.text('Code', 17, cy + 5.2);
    doc.text('Module / Unité d Enseignement', 42, cy + 5.2);
    doc.text('Note / 20', 146, cy + 5.2);
    doc.text('Decision', 172, cy + 5.2);
    cy += 7.5;

    rows.forEach((row, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, cy, 182, 7.2, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(14, cy + 7.2, 196, cy + 7.2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(15, 23, 42);
      doc.text(row[0], 17, cy + 4.8);
      doc.text(row[1], 42, cy + 4.8);
      doc.setFont('helvetica', 'bold');
      doc.text(row[2], 149, cy + 4.8);
      doc.setTextColor(5, 150, 105);
      doc.text(row[3], 172, cy + 4.8);
      cy += 7.2;
    });

    return cy + 7;
  };

  y = drawTable('Semestre S3 (Cycle Ingenieur) — Architecture & Algorithmique', y + 7, [
    ['GL301', 'Architecture Logicielle, Microservices & Design Patterns', '16.50', 'Valide'],
    ['GL302', 'Methodes Formelles, Verification & Qualite Logicielle', '15.90', 'Valide'],
    ['GL303', 'Apprentissage Automatique & Statistiques Appliquees', '16.80', 'Valide'],
    ['GL304', 'Bases de Donnees Distribuees & Indexation Avancee', '16.10', 'Valide'],
    ['GL305', 'Systemes d Exploitation & Calcul Parallele', '15.70', 'Valide']
  ]);

  drawTable('Semestre S4 (Cycle Ingenieur) — Intelligence Artificielle & Cloud', y, [
    ['GL401', 'Deep Learning, Vision par Ordinateur & Imagerie', '17.10', 'Valide'],
    ['GL402', 'DevOps, Conteneurisation Kubernetes & Integration Continue', '16.40', 'Valide'],
    ['GL403', 'Traitement Automatique des Langues & LLM', '16.20', 'Valide'],
    ['GL404', 'Cybersecurite Applicative & Cryptographie', '15.80', 'Valide'],
    ['GL405', 'Methodologie de Recherche & Redaction Scientifique', '16.90', 'Valide']
  ]);

  doc.addPage();
  drawRegraguiHeader(
    doc,
    'RELEVES DE NOTES OFFICIELS — S5 & PFE (PAGE 2)',
    'Bilan Cumulatif de Fin de Cycle Ingenieur d Etat en Genie Logiciel',
    'RN-REG-2026-02'
  );

  let y2 = drawTable('Semestre S5 — Specialisation IA & Ingenierie des Systemes', 74, [
    ['GL501', 'Apprentissage Auto-Supervise & Modeles Legers', '17.20', 'Valide'],
    ['GL502', 'Edge AI, Quantification & Optimisation d Inference', '16.40', 'Valide'],
    ['GL503', 'Ingenierie des Exigences & Gestion de Projets Complexes', '16.00', 'Valide'],
    ['GL504', 'Seminaire Scientifique & Ethique de l IA (Loi 09-08)', '16.60', 'Valide']
  ]);

  y2 = drawTable('Semestre S6 — Projet de Fin d Etudes (Laboratoire LISS)', y2, [
    ['PFE01', 'Stage Recherche 6 mois : Imagerie Medicale Auto-Supervisee', '17.10', 'Valide'],
    ['PFE02', 'Memoire d Ingenieur & Soutenance devant Jury', '17.50', 'Valide']
  ]);

  drawKeyValueBox(doc, 14, y2, 182, [
    ['Moyenne Generale du Cycle Ingenieur', '16.40 / 20'],
    ['Mention & Classement (Demo)', 'Mention Tres Bien — Top 5% de promotion'],
    ['Decision du Conseil de Jury', 'Diplome valide et delivre (Document de demonstration)']
  ]);

  drawRegraguiFooters(doc, 'Releves de notes officiels');
  saveRegraguiPdf(doc, '02-releve-notes-regragui.pdf');
}

// 3. Curriculum Vitae — Ayoub Regragui (2 pages)
function buildRegraguiCv() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawRegraguiHeader(
    doc,
    'CURRICULUM VITAE ACADEMIQUE (DEMO)',
    'Candidature Doctorale — Genie Logiciel & Intelligence Artificielle Appliquee',
    'CV-REG-2026-03'
  );

  let y = 72;
  y = drawKeyValueBox(doc, 14, y, 182, [
    ['Identite', 'Ayoub Regragui (CNIE : CD712894 · CNE : N139820412)'],
    ['Email academique', 'ayoub.regragui@usmba.ac.ma'],
    ['Telephone', '+212 6 63 45 78 90'],
    ['Diplome', 'Ingenieur d Etat en Genie Logiciel — EST Fes (USMBA, 2026)']
  ]);

  const addCvSection = (heading: string, bullets: string[], curY: number): number => {
    let ny = curY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(37, 99, 235);
    doc.text(heading, 14, ny);
    doc.setDrawColor(191, 219, 254);
    doc.line(14, ny + 1.5, 196, ny + 1.5);
    ny += 6.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.3);
    doc.setTextColor(30, 41, 59);
    for (const b of bullets) {
      ny = writeWrapped(doc, `• ${b}`, 16, ny, 178, 4.7) + 2;
    }
    return ny;
  };

  y = addCvSection(
    'FORMATION ACADEMIQUE',
    [
      '2023 - 2026 : Cycle Ingenieur d Etat en Genie Logiciel — EST Fes, USMBA. Moyenne : 16.40/20 (Mention Tres Bien).',
      '2021 - 2023 : Classes Preparatoires Integrees / DUT Genie Informatique — Mention Tres Bien.',
      '2020 - 2021 : Baccalaureat Sciences Mathematiques A — Mention Tres Bien.'
    ],
    y
  );

  y = addCvSection(
    'EXPERIENCES DE RECHERCHE & PROJETS TECHNIQUES',
    [
      'Stage PFE Recherche (Fev. - Juil. 2026) — Laboratoire LISS (Fes) : Conception d un encodeur Vision Transformer leger pre-entraine par apprentissage auto-supervise (DINOv2-Lite) sur radiographies thoraciques et coupes IRM.',
      'Projet d Ingenierie (2025) : Plateforme de suivi clinique securisee et inference Edge-AI sous contrainte memoire (< 15 Mo) via distillation de connaissances et quantification INT8.',
      'Contribution Open-Source Academique : Pipelines reproductibles de benchmark sous PyTorch Lightning et Docker.'
    ],
    y
  );

  doc.addPage();
  drawRegraguiHeader(
    doc,
    'CURRICULUM VITAE ACADEMIQUE — PAGE 2 (DEMO)',
    'Publications Fictives, Competences Techniques & Langues',
    'CV-REG-2026-03'
  );

  let y2 = 72;
  y2 = addCvSection(
    'COMMUNICATIONS & TRAVAUX SCIENTIFIQUES (FICTIFS)',
    [
      'Regragui A., El Amrani Y. (2026), "Compact Self-Supervised Backbones for Early Medical Screening", Journees Doctorales USMBA-LISS (Atelier Demo).',
      'Regragui A. (2025), "Audit automatise et qualite logicielle des pipelines MLOps", Rapport Technique EST Fes.'
    ],
    y2
  );

  y2 = addCvSection(
    'COMPETENCES TECHNIQUES & SCIENTIFIQUES',
    [
      'IA & Vision : PyTorch, MONAI, Scikit-learn, OpenCV, ONNX Runtime, TensorRT, Distillation & Pruning.',
      'Langages & Web : Python, TypeScript, C++, SQL, React, FastAPI, Node.js.',
      'Infrastructure & Qualite : Docker, Git, Linux, CI/CD, Tests unitaires, Redaction scientifique LaTeX.'
    ],
    y2
  );

  addCvSection(
    'LANGUES & CENTRES D INTERET',
    [
      'Arabe : Langue maternelle · Francais : Courant (C1) · Anglais : Scientifique avance (C1).',
      'Veille technologique en IA frugale, ethique medicale et methodes formelles.'
    ],
    y2
  );

  drawRegraguiFooters(doc, 'Curriculum Vitae');
  saveRegraguiPdf(doc, '03-cv-regragui.pdf');
}

// 4. Lettre de motivation — Ayoub Regragui
function buildRegraguiLettreMotivation() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawRegraguiHeader(
    doc,
    'LETTRE DE MOTIVATION DOCTORALE (DEMO)',
    'Candidature au sujet DOC-2026-IA01 · Laboratoire LISS — USMBA',
    'LM-REG-2026-04'
  );

  let y = 74;
  y = drawKeyValueBox(doc, 14, y, 182, [
    ['Candidat', 'Ayoub Regragui — Ingenieur d Etat en Genie Logiciel'],
    ['Destinataire', 'Pr. Youssef El Amrani & Commission du CEDoc Sciences & Technologies'],
    ['Sujet vise', 'Modeles Fondamentaux Legers et Apprentissage Auto-Supervise (DOC-2026-IA01)']
  ]);

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Objet : Candidature a une these de doctorat — Sujet DOC-2026-IA01', 14, y);

  y += 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const paragraphs = [
    'Monsieur le Professeur, Madame et Monsieur les membres de la Commission Doctorale,',
    'Diplome Ingenieur d Etat en Genie Logiciel de l USMBA (promotion 2026, mention Tres Bien avec 16.40/20), je vous adresse ma candidature pour preparer une these de doctorat sur le sujet : « Modeles Fondamentaux Legers et Apprentissage Auto-Supervise pour le Diagnostic Precoce en Imagerie Medicale » au sein du Laboratoire LISS.',
    'Mon projet de fin d etudes m a permis d explorer les verrous scientifiques lies a la lourdeur des modeles de fondation visuels et a la rarete des annotations medicales certifiees. En combinant distillation structuree et pre-entrainement auto-supervise, j ai pu valider des prototypes reproductibles demontrant qu une architecture compacte peut preserver une haute sensibilite clinique.',
    'Ma double culture d ingenieur logiciel et de chercheur en apprentissage profond constitue un atout direct pour mener a bien l industrialisation scientifique des experiences, garantir la tracabilite des resultats et contribuer aux publications du laboratoire dans des revues et conferences de premier plan.',
    'Motive, rigoureux et pleinement engage dans une carriere de recherche academique et appliquee, je reste a votre disposition pour un entretien devant le jury.',
    'Veuillez agreer, Monsieur le Directeur de These, l expression de ma haute consideration.',
    'Ayoub Regragui — Fes, le 27 Octobre 2026 (Document de demonstration)'
  ];

  for (const p of paragraphs) {
    y = writeWrapped(doc, p, 14, y, 182, 5.1) + 4.5;
  }

  drawRegraguiFooters(doc, 'Lettre de motivation');
  saveRegraguiPdf(doc, '04-lettre-motivation-regragui.pdf');
}

// 5. Projet de recherche doctoral — Ayoub Regragui (3 pages)
function buildRegraguiProjetRecherche() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawRegraguiHeader(
    doc,
    'PROJET DE RECHERCHE DOCTORAL (DEMO)',
    'Modeles Fondamentaux Legers et Apprentissage Auto-Supervise pour le Diagnostic Precoce',
    'PR-REG-2026-05'
  );

  let y = 72;
  y = drawKeyValueBox(doc, 14, y, 182, [
    ['Candidat', 'Ayoub Regragui (Ingenieur d Etat en Genie Logiciel)'],
    ['Sujet propose', 'Modeles Fondamentaux Legers & Imagerie Medicale (DOC-2026-IA01)'],
    ['Direction scientifique', 'Pr. Youssef El Amrani — Laboratoire LISS (USMBA Fes)'],
    ['Mots-cles', 'Vision Transformers Legers, Auto-Supervision, Distillation, Imagerie']
  ]);

  const addPrSection = (title: string, body: string, curY: number): number => {
    let ny = curY + 7.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 58, 138);
    doc.text(title, 14, ny);
    ny += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    return writeWrapped(doc, body, 14, ny, 182, 5.0);
  };

  y = addPrSection(
    '1. CONTEXTE ET PROBLEMATIQUE SCIENTIFIQUE',
    'Le depistage precoce en imagerie medicale (radiographie, scanner thoracique, IRM) s appuie de plus en plus sur des modeles de fondation visuels a grande echelle. Cependant, ces architectures comptent souvent plusieurs centaines de millions de parametres, exigent des grappes GPU couteuses et souffrent d un manque de labels experts pour les pathologies rares. Ce projet doctoral propose de concevoir une nouvelle famille de modeles fondamentaux compacts pre-entraines par apprentissage auto-supervise.',
    y
  );

  y = addPrSection(
    '2. HYPOTHESES ET OBJECTIFS DE THESE',
    'Hypothese centrale : un encodeur hybride CNN-Transformer compresse par distillation multi-echelles et guide par des taches pretextes anatomiques peut egaler les modeles massifs avec un facteur de reduction superieur a 5x. Objectifs : (O1) pre-entrainement auto-supervise sans biais de domaine ; (O2) calibration fiable de l incertitude diagnostique ; (O3) validation sur postes cliniques a ressources limitees.',
    y
  );

  doc.addPage();
  drawRegraguiHeader(
    doc,
    'PROJET DE RECHERCHE DOCTORAL — PAGE 2 (DEMO)',
    'Etat de l Art, Methodologie Experimentale & Protocoles d Evaluation',
    'PR-REG-2026-05'
  );

  let y2 = 72;
  y2 = addPrSection(
    '3. SYNTHESE DE L ETAT DE L ART',
    'Les methodes DINOv2, iBOT et Masked Autoencoders (MAE) ont etabli l etat de l art en apprentissage auto-supervise visuel. En imagerie clinique, des adaptations recentes (MedMAE, CheXzero) montrent un fort potentiel mais restent trop lourdes pour l inference locale. Les architectures hybrides legeres (MobileViT, EfficientFormerV2, FastViT) ouvrent la voie a une IA médicale frugale et explicable.',
    y2
  );

  y2 = addPrSection(
    '4. ARCHITECTURE & METHODOLOGIE PROPOSEE',
    'Axe 1 : Conception d un backbone leger (< 15M parametres) associant convolutions locales et attention lineaire fenetree. Axe 2 : Apprentissage auto-supervise par alignement anatomique multi-vues et reconstruction masquee frequencielle. Axe 3 : Quantification d incertitude epistemique par apprentissage evidentiel afin d alerter le radiologue lorsque la confiance est insuffisante.',
    y2
  );

  y2 = addPrSection(
    '5. PROTOCOLES DE VALIDATION & CRITERES DE SUCCES',
    'Evaluation rigoureuse sur corpus publics anonymises (CheXpert, MIMIC-CXR, BraTS) selon AUC-ROC, F1-Score, Expected Calibration Error (ECE), latence en millisecondes et empreinte memoire RAM/VRAM, accompagnee d etudes d ablation reproductibles.',
    y2
  );

  doc.addPage();
  drawRegraguiHeader(
    doc,
    'PROJET DE RECHERCHE DOCTORAL — PAGE 3 (DEMO)',
    'Plan de Travail sur 36 Mois & Bibliographie Indicative',
    'PR-REG-2026-05'
  );

  let y3 = 72;
  y3 = drawKeyValueBox(doc, 14, y3, 182, [
    ['Annee 1 (M1 - M12)', 'Etat de l art exhaustif, preparation des corpus, baseline auto-supervisee'],
    ['Annee 2 (M13 - M24)', 'Distillation & calibration d incertitude, soumission IEEE TMI / MICCAI'],
    ['Annee 3 (M25 - M36)', 'Validation multi-centres, deploiement Edge prototype, redaction these']
  ]);

  addPrSection(
    '6. BIBLIOGRAPHIE INDICATIVE (EXEMPLES SCIENTIFIQUES)',
    '[1] Oquab M. et al., "DINOv2: Learning Robust Visual Features without Supervision", TMLR 2024.\n[2] He K. et al., "Masked Autoencoders Are Scalable Vision Learners", CVPR 2022.\n[3] Mehta S. & Rastegari M., "MobileViT: Light-weight, General-purpose Vision Transformer", ICLR 2022.\n[4] Sensoy M. et al., "Evidential Deep Learning to Quantify Classification Uncertainty", NeurIPS 2018.',
    y3 + 4
  );

  drawRegraguiFooters(doc, 'Projet de recherche doctoral');
  saveRegraguiPdf(doc, '05-projet-recherche-regragui.pdf');
}

// 6. Copie de la CIN — Ayoub Regragui
function buildRegraguiCin() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawRegraguiHeader(
    doc,
    'COPIE DE LA CARTE NATIONALE D IDENTITE (CIN DEMO)',
    'Piece d identite fictive — Specimen pedagogique exclusivement reserve a la demonstration',
    'CIN-REG-2026-06'
  );

  // Recto Card Mockup (clean vector layout clearly labeled specimen)
  let y = 76;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('RECTO — SPECIMEN FICTIF DE CARTE D IDENTITE', 14, y);
  y += 4;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, y, 132, 82, 4, 4, 'FD');

  // Card header strip
  doc.setFillColor(30, 58, 138);
  doc.roundedRect(14, y, 132, 13, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('CARTE D IDENTITE NATIONALE (SPECIMEN DEMO)', 80, y + 8.2, { align: 'center' });

  // Photo placeholder frame
  doc.setFillColor(226, 232, 240);
  doc.setDrawColor(148, 163, 184);
  doc.roundedRect(20, y + 19, 30, 38, 2, 2, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.2);
  doc.text('PHOTO', 35, y + 36, { align: 'center' });
  doc.text('FICTIVE', 35, y + 41, { align: 'center' });
  doc.text('DEMO', 35, y + 46, { align: 'center' });

  // Card fields
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('NOM : REGRAGUI', 56, y + 24);
  doc.text('PRENOM : AYOUB', 56, y + 31);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Ne le : 14 / 05 / 2003 (Donnee fictive)', 56, y + 39);
  doc.text('Lieu de naissance : Fes (Demo)', 56, y + 46);
  doc.text('Validite jusqu au : 15 / 09 / 2034 (Demo)', 56, y + 53);

  doc.setFillColor(254, 226, 226);
  doc.roundedRect(20, y + 63, 120, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(185, 28, 28);
  doc.text('N° CIN FICTIF : CD712894  ·  DOCUMENT DE DEMONSTRATION', 80, y + 70.5, { align: 'center' });

  // Verso Card Mockup
  y += 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('VERSO — MENTIONS COMPLEMENTAIRES (SPECIMEN FICTIF)', 14, y);
  y += 4;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(100, 116, 139);
  doc.roundedRect(14, y, 132, 68, 4, 4, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Adresse fictive : Quartier Atlas, Avenue Universitaire (Demo), 30000 Fes', 20, y + 14);
  doc.text('Identifiant etudiant associe (CNE) : N139820412', 20, y + 22);
  doc.text('Sexe : Masculin  ·  Nationalite : Marocaine (Specimen)', 20, y + 30);

  // Simulated MRZ lines clearly marked DEMO
  doc.setFillColor(241, 245, 249);
  doc.rect(20, y + 40, 120, 18, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('IDDEMO<<CD712894<SPECIMEN<<<<<<<<<<<<', 24, y + 47);
  doc.text('0305141M3409152DEMO<<REGRAGUI<<AYOUB', 24, y + 54);

  // Explicit legal notice box below
  y += 78;
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(252, 165, 165);
  doc.roundedRect(14, y, 182, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(153, 27, 27);
  doc.text('AVERTISSEMENT IMPORTANT : DOCUMENT DE DEMONSTRATION', 105, y + 6.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    'Ce visuel est un modele genere informatiquement avec des informations entierement fictives pour tester la verification d identite dans GCD.',
    105,
    y + 13,
    { align: 'center' }
  );

  drawRegraguiFooters(doc, 'Copie de la CIN');
  saveRegraguiPdf(doc, '06-copie-cin-regragui.pdf');
}

buildAttestationReussite();
buildDiplomeUniversitaire();
buildReleveNotes();
buildCvAcademique();
buildLettreMotivation();
buildProjetRecherche();
buildAttestationInscription();

buildRegraguiDiplome();
buildRegraguiReleveNotes();
buildRegraguiCv();
buildRegraguiLettreMotivation();
buildRegraguiProjetRecherche();
buildRegraguiCin();
