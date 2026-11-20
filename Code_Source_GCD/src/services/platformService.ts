import {
  ApplicationDossier,
  AuthenticatedUser,
  ThesisTopic,
  UserRole
} from '../types';
import { INITIAL_TOPICS } from '../data/mockTopics';

export interface DoctoralCampaign {
  id: string;
  code: string;
  title: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: 'ouverte' | 'planifiee' | 'cloturee';
  maxChoicesPerCandidate: number;
  description: string;
}

export interface DoctoralFormation {
  id: string;
  code: string;
  title: string;
  cedoc: string;
  institution: string;
  coordinator: string;
  accredited: boolean;
}

export interface ResearchStructure {
  id: string;
  code: string;
  name: string;
  type: 'Laboratoire' | 'Équipe de Recherche';
  institution: string;
  directorName: string;
  domain: string;
}

export interface PublishedResultEntry {
  dossierId: string;
  referenceNumber: string;
  candidateName: string;
  topicTitle: string;
  topicCode: string;
  decisionLabel: string;
  status: ApplicationDossier['status'];
  publishedAt: string;
  publishedBy: string;
}

export interface PlatformActivityEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole | 'systeme';
  category: 'candidature' | 'document' | 'evaluation' | 'cedoc' | 'administration';
  action: string;
  details: string;
  referenceNumber?: string;
}

const PLATFORM_STORAGE_KEYS = {
  CAMPAIGNS: 'gcd_platform_campaigns_v1',
  FORMATIONS: 'gcd_platform_formations_v1',
  STRUCTURES: 'gcd_platform_structures_v1',
  TOPICS: 'gcd_platform_topics_v1',
  PUBLISHED_RESULTS: 'gcd_platform_published_results_v1',
  ACTIVITY_LOGS: 'gcd_platform_activity_logs_v1',
  SUBMISSIONS_OPEN: 'gcd_platform_submissions_open_v1'
};

export const INITIAL_CAMPAIGNS: DoctoralCampaign[] = [
  {
    id: 'camp-2026-main',
    code: 'CAMP-USMBA-2026-S1',
    title: 'Campagne Doctorale Principale — Sciences & Technologies',
    academicYear: '2026/2027',
    startDate: '2026-10-15',
    endDate: '2026-11-30',
    status: 'ouverte',
    maxChoicesPerCandidate: 3,
    description:
      'Campagne officielle d’admission en cycle doctoral au CEDoc Sciences & Technologies de l’USMBA Fès.'
  },
  {
    id: 'camp-2026-ind',
    code: 'CAMP-USMBA-2026-IND',
    title: 'Appels Thèses Industrielles & Contrats R&D (CNRST / OCP / IRESEN)',
    academicYear: '2026/2027',
    startDate: '2026-10-20',
    endDate: '2026-12-05',
    status: 'ouverte',
    maxChoicesPerCandidate: 3,
    description:
      'Sujets doctoraux financés en partenariat avec les clusters industriels et organismes nationaux de recherche.'
  }
];

export const INITIAL_FORMATIONS: DoctoralFormation[] = [
  {
    id: 'fd-1',
    code: 'FD-IA-SD',
    title: 'Intelligence Artificielle, Science des Données et Systèmes Intelligents',
    cedoc: 'CEDoc Sciences & Technologies',
    institution: 'EST Fès / FST Fès - USMBA',
    coordinator: 'Pr. Youssef El Amrani',
    accredited: true
  },
  {
    id: 'fd-2',
    code: 'FD-SEC-IOT',
    title: 'Cybersécurité, Réseaux Avancés et Systèmes Embarqués IoT',
    cedoc: 'CEDoc Sciences & Technologies',
    institution: 'ENSA Fès - USMBA',
    coordinator: 'Pr. Mohamed Tazi',
    accredited: true
  },
  {
    id: 'fd-3',
    code: 'FD-EN-MAT',
    title: 'Énergies Renouvelables, Procédés et Génie des Matériaux',
    cedoc: 'CEDoc Sciences & Technologies',
    institution: 'FSDM / EST Fès - USMBA',
    coordinator: 'Pr. Fatima-Zahra Alami',
    accredited: true
  },
  {
    id: 'fd-4',
    code: 'FD-BIO-SANTE',
    title: 'Biotechnologies, Molécules Bioactives et Santé',
    cedoc: 'CEDoc Sciences & Technologies',
    institution: 'FSDM Fès - USMBA',
    coordinator: 'Pr. Rachid Berrada',
    accredited: true
  }
];

export const INITIAL_STRUCTURES: ResearchStructure[] = [
  {
    id: 'str-liss',
    code: 'LISS',
    name: 'Laboratoire d’Informatique, Signaux et Systèmes',
    type: 'Laboratoire',
    institution: 'EST Fès - USMBA',
    directorName: 'Pr. Youssef El Amrani',
    domain: 'Intelligence Artificielle & Données'
  },
  {
    id: 'str-lsir',
    code: 'LSIR',
    name: 'Laboratoire des Systèmes Intelligents et Réseaux',
    type: 'Laboratoire',
    institution: 'ENSA Fès - USMBA',
    directorName: 'Pr. Mohamed Tazi',
    domain: 'Cybersécurité & Réseaux IoT'
  },
  {
    id: 'str-lmep',
    code: 'LMEP',
    name: 'Laboratoire de Mécanique, Énergétique et Procédés',
    type: 'Laboratoire',
    institution: 'FSDM Fès - USMBA',
    directorName: 'Pr. Fatima-Zahra Alami',
    domain: 'Énergies Propres & Environnement'
  },
  {
    id: 'str-lbvrn',
    code: 'LBVRN',
    name: 'Laboratoire de Biotechnologie et Valorisation des Ressources Naturelles',
    type: 'Laboratoire',
    institution: 'FSDM Fès - USMBA',
    directorName: 'Pr. Rachid Berrada',
    domain: 'Biotechnologie & Santé'
  },
  {
    id: 'str-lgim',
    code: 'LGIM',
    name: 'Laboratoire de Génie Industriel et Maintenance',
    type: 'Laboratoire',
    institution: 'EST Fès - USMBA',
    directorName: 'Pr. Hicham Meziane',
    domain: 'Génie Mécanique & Matériaux'
  },
  {
    id: 'str-lisi',
    code: 'LISI',
    name: 'Laboratoire d’Ingénierie des Systèmes Informatiques',
    type: 'Laboratoire',
    institution: 'FST Fès - USMBA',
    directorName: 'Pr. Mounia Zeroual',
    domain: 'Génie Logiciel & Cloud'
  }
];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T, eventName?: string): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (eventName) {
      window.dispatchEvent(new CustomEvent(eventName, { detail: value }));
    }
  } catch (err) {
    console.error(`Failed saving ${key}:`, err);
  }
}

// --- Campaigns ---
export function getPlatformCampaigns(): DoctoralCampaign[] {
  return readJson<DoctoralCampaign[]>(PLATFORM_STORAGE_KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS);
}

export function savePlatformCampaigns(
  campaigns: DoctoralCampaign[],
  actor?: AuthenticatedUser | null,
  logAction?: string
): void {
  writeJson(PLATFORM_STORAGE_KEYS.CAMPAIGNS, campaigns, 'gcd_platform_updated');
  if (actor && logAction) {
    appendPlatformActivity({
      actorName: `${actor.firstName} ${actor.lastName}`,
      actorRole: actor.role,
      category: 'administration',
      action: logAction,
      details: `${campaigns.filter((c) => c.status === 'ouverte').length} campagne(s) ouverte(s) sur ${campaigns.length}.`
    });
  }
}

// --- Doctoral Formations ---
export function getDoctoralFormations(): DoctoralFormation[] {
  return readJson<DoctoralFormation[]>(PLATFORM_STORAGE_KEYS.FORMATIONS, INITIAL_FORMATIONS);
}

export function saveDoctoralFormations(
  formations: DoctoralFormation[],
  actor?: AuthenticatedUser | null,
  logAction?: string
): void {
  writeJson(PLATFORM_STORAGE_KEYS.FORMATIONS, formations, 'gcd_platform_updated');
  if (actor && logAction) {
    appendPlatformActivity({
      actorName: `${actor.firstName} ${actor.lastName}`,
      actorRole: actor.role,
      category: 'administration',
      action: logAction,
      details: `${formations.length} formation(s) doctorale(s) enregistrée(s).`
    });
  }
}

// --- Research Structures ---
export function getResearchStructures(): ResearchStructure[] {
  return readJson<ResearchStructure[]>(PLATFORM_STORAGE_KEYS.STRUCTURES, INITIAL_STRUCTURES);
}

export function saveResearchStructures(
  structures: ResearchStructure[],
  actor?: AuthenticatedUser | null,
  logAction?: string
): void {
  writeJson(PLATFORM_STORAGE_KEYS.STRUCTURES, structures, 'gcd_platform_updated');
  if (actor && logAction) {
    appendPlatformActivity({
      actorName: `${actor.firstName} ${actor.lastName}`,
      actorRole: actor.role,
      category: 'administration',
      action: logAction,
      details: `${structures.length} structure(s) de recherche active(s).`
    });
  }
}

// --- Topics ---
export function getPlatformTopics(): ThesisTopic[] {
  return readJson<ThesisTopic[]>(PLATFORM_STORAGE_KEYS.TOPICS, INITIAL_TOPICS);
}

export function savePlatformTopics(
  topics: ThesisTopic[],
  actor?: AuthenticatedUser | null,
  logAction?: string
): void {
  writeJson(PLATFORM_STORAGE_KEYS.TOPICS, topics, 'gcd_platform_updated');
  if (actor && logAction) {
    appendPlatformActivity({
      actorName: `${actor.firstName} ${actor.lastName}`,
      actorRole: actor.role,
      category: 'administration',
      action: logAction,
      details: `${topics.length} sujet(s) doctoraux publiés au catalogue.`
    });
  }
}

// --- Submissions Open Toggle ---
export function areSubmissionsOpen(): boolean {
  try {
    const raw = localStorage.getItem(PLATFORM_STORAGE_KEYS.SUBMISSIONS_OPEN);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

export function setSubmissionsOpen(
  open: boolean,
  actor?: AuthenticatedUser | null
): void {
  try {
    localStorage.setItem(PLATFORM_STORAGE_KEYS.SUBMISSIONS_OPEN, open ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('gcd_platform_updated'));
    if (actor) {
      appendPlatformActivity({
        actorName: `${actor.firstName} ${actor.lastName}`,
        actorRole: actor.role,
        category: 'administration',
        action: open ? 'Ouverture du dépôt des candidatures' : 'Fermeture temporaire du dépôt des candidatures',
        details: `Paramètre global modifié par ${actor.firstName} ${actor.lastName}.`
      });
    }
  } catch {
    // Ignore storage failures
  }
}

// --- Published Results (CEDoc) ---
export function getPublishedResults(): PublishedResultEntry[] {
  return readJson<PublishedResultEntry[]>(PLATFORM_STORAGE_KEYS.PUBLISHED_RESULTS, []);
}

export function publishCedocResults(
  dossiers: ApplicationDossier[],
  actor: AuthenticatedUser
): PublishedResultEntry[] {
  const nowIso = new Date().toISOString();
  const actorName = `${actor.firstName} ${actor.lastName}`;

  const eligible = dossiers.filter(
    (d) =>
      d.status === 'retenu' ||
      d.status === 'convoque_entretien' ||
      d.status === 'non_conforme'
  );

  const entries: PublishedResultEntry[] = eligible.map((d) => ({
    dossierId: d.id,
    referenceNumber: d.referenceNumber,
    candidateName: `${d.student.lastName.toUpperCase()} ${d.student.firstName}`,
    topicTitle: d.selectedTopics[0]?.topicTitle || 'Sujet doctoral',
    topicCode: d.selectedTopics[0]?.topicCode || 'DOC',
    decisionLabel:
      d.status === 'retenu'
        ? 'Admis (Inscription autorisée)'
        : d.status === 'convoque_entretien'
        ? 'Convoqué à l’entretien'
        : 'Non retenu',
    status: d.status,
    publishedAt: nowIso,
    publishedBy: actorName
  }));

  writeJson(PLATFORM_STORAGE_KEYS.PUBLISHED_RESULTS, entries, 'gcd_platform_updated');

  appendPlatformActivity({
    actorName,
    actorRole: actor.role,
    category: 'cedoc',
    action: 'Publication officielle des résultats CEDoc',
    details: `${entries.length} décision(s) officielle(s) publiée(s) (Admis / Entretiens / Décisions finales).`
  });

  return entries;
}

// --- Activity Logs ---
export function getStoredPlatformActivities(): PlatformActivityEntry[] {
  return readJson<PlatformActivityEntry[]>(PLATFORM_STORAGE_KEYS.ACTIVITY_LOGS, []);
}

export function appendPlatformActivity(
  entry: Omit<PlatformActivityEntry, 'id' | 'timestamp'>
): void {
  const current = getStoredPlatformActivities();
  const fullEntry: PlatformActivityEntry = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry
  };
  writeJson(
    PLATFORM_STORAGE_KEYS.ACTIVITY_LOGS,
    [fullEntry, ...current].slice(0, 100),
    'gcd_platform_updated'
  );
}

/**
 * Combines real dossier historyLogs and persisted platform admin/CEDoc logs,
 * sorted newest first. Never fabricates events.
 */
export function getAllPlatformActivities(
  dossiers: ApplicationDossier[]
): PlatformActivityEntry[] {
  const fromDossiers: PlatformActivityEntry[] = dossiers.flatMap((d) =>
    (d.historyLogs || []).map((log) => ({
      id: `${d.id}-${log.id}`,
      timestamp: log.timestamp,
      actorName: log.authorName,
      actorRole: log.authorRole,
      category:
        log.authorRole === 'directeur_cedoc'
          ? 'cedoc'
          : log.action.toLowerCase().includes('document') ||
            log.action.toLowerCase().includes('pièce')
          ? 'document'
          : log.authorRole === 'directeur'
          ? 'evaluation'
          : 'candidature',
      action: log.action,
      details: log.details,
      referenceNumber: d.referenceNumber
    }))
  );

  const fromPlatform = getStoredPlatformActivities();

  return [...fromPlatform, ...fromDossiers].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function resetPlatformEntities(): void {
  localStorage.setItem(PLATFORM_STORAGE_KEYS.CAMPAIGNS, JSON.stringify(INITIAL_CAMPAIGNS));
  localStorage.setItem(PLATFORM_STORAGE_KEYS.FORMATIONS, JSON.stringify(INITIAL_FORMATIONS));
  localStorage.setItem(PLATFORM_STORAGE_KEYS.STRUCTURES, JSON.stringify(INITIAL_STRUCTURES));
  localStorage.setItem(PLATFORM_STORAGE_KEYS.TOPICS, JSON.stringify(INITIAL_TOPICS));
  localStorage.removeItem(PLATFORM_STORAGE_KEYS.PUBLISHED_RESULTS);
  localStorage.removeItem(PLATFORM_STORAGE_KEYS.ACTIVITY_LOGS);
  localStorage.setItem(PLATFORM_STORAGE_KEYS.SUBMISSIONS_OPEN, 'true');
  window.dispatchEvent(new CustomEvent('gcd_platform_updated'));
}
