import { ApplicationDossier } from '../types';

export const INITIAL_DOSSIERS: ApplicationDossier[] = [
  {
    id: 'dos-100',
    referenceNumber: 'GCD-2026-USMBA-0115',
    isDemo: true,
    student: {
      firstName: 'Ayoub',
      lastName: 'Regragui',
      cin: 'CD712894',
      cne: 'N139820412',
      academicEmail: 'ayoub.regragui@usmba.ac.ma',
      phone: '+212 6 63 45 78 90',
      currentInstitution: 'EST Fès - USMBA',
      degreeDeclared: 'Ingénieur d’État en Génie Logiciel',
      graduationYear: '2026',
      gpa: '16.40 / 20 (Mention Très Bien)',
      documents: {
        diplomaName: '01-attestation-diplome-regragui.pdf',
        transcriptName: '02-releve-notes-regragui.pdf',
        cvName: '03-cv-regragui.pdf',
        researchProjectName: '05-projet-recherche-regragui.pdf'
      },
      legalConsent: true
    },
    selectedTopics: [
      {
        topicId: 'top-1',
        topicCode: 'DOC-2026-IA01',
        topicTitle: 'Modèles Fondamentaux Légers et Apprentissage Auto-Supervisé pour le Diagnostic Précoce en Imagerie Médicale',
        director: 'Pr. Youssef El Amrani',
        laboratory: 'Laboratoire d’Informatique, Signaux et Systèmes (LISS)',
        priority: 1
      },
      {
        topicId: 'top-6',
        topicCode: 'DOC-2026-GL06',
        topicTitle: 'Génération et Vérification Formelle de Contrats Intelligents par Grands Modèles de Langage Spécialisés',
        director: 'Pr. Mounia Zeroual',
        laboratory: 'Laboratoire d’Ingénierie des Systèmes Informatiques (LISI)',
        priority: 2
      }
    ],
    submittedAt: '2026-10-27T10:15:00Z',
    status: 'documents_en_cours',
    documentsStepValidated: false,
    directorTreatmentCompleted: false,
    documentsList: [
      {
        id: 'doc-100-1',
        category: 'diplome',
        label: 'Attestation de diplôme / Réussite',
        description:
          'Copie du diplôme d’Ingénieur d’État en Génie Logiciel ou attestation de réussite — Document de démonstration.',
        required: true,
        fileName: '01-attestation-diplome-regragui.pdf',
        fileType: 'application/pdf',
        fileSize: '11.4 KB',
        uploadDate: '2026-10-27T10:15:00Z',
        fileUrl: '/demo-pdfs/ayoub-regragui/01-attestation-diplome-regragui.pdf',
        status: 'conforme',
        remark: 'Diplôme d’Ingénieur d’État en Génie Logiciel vérifié conforme (Démonstration).',
        reviewedBy: 'Pr. Youssef El Amrani',
        reviewedAt: '2026-10-28T11:30:00Z',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 11711,
          sha256Short: 'REGD01',
          checkedAt: '2026-10-27T10:15:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 1 page)'
        }
      },
      {
        id: 'doc-100-2',
        category: 'releve_notes',
        label: 'Relevés de notes officiels',
        description:
          'Relevés de notes complets du cycle Ingénieur d’État (S3 à S6) mentionnant la moyenne 16.40/20 — Document de démonstration.',
        required: true,
        fileName: '02-releve-notes-regragui.pdf',
        fileType: 'application/pdf',
        fileSize: '26.2 KB',
        uploadDate: '2026-10-27T10:15:00Z',
        fileUrl: '/demo-pdfs/ayoub-regragui/02-releve-notes-regragui.pdf',
        status: 'conforme',
        remark: 'Relevé de notes (2 pages, moyenne 16.40/20) vérifié conforme.',
        reviewedBy: 'Pr. Youssef El Amrani',
        reviewedAt: '2026-10-28T11:35:00Z',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 26830,
          sha256Short: 'REGR02',
          checkedAt: '2026-10-27T10:15:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 2 pages)'
        }
      },
      {
        id: 'doc-100-3',
        category: 'cv',
        label: 'Curriculum Vitae',
        description:
          'Parcours universitaire, expériences de recherche au LISS et compétences en IA & Génie Logiciel — Document de démonstration.',
        required: true,
        fileName: '03-cv-regragui.pdf',
        fileType: 'application/pdf',
        fileSize: '15.8 KB',
        uploadDate: '2026-10-27T10:15:00Z',
        fileUrl: '/demo-pdfs/ayoub-regragui/03-cv-regragui.pdf',
        status: 'conforme',
        remark: 'CV académique complet vérifié conforme.',
        reviewedBy: 'Pr. Youssef El Amrani',
        reviewedAt: '2026-10-28T11:40:00Z',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 16137,
          sha256Short: 'REGC03',
          checkedAt: '2026-10-27T10:15:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 2 pages)'
        }
      },
      {
        id: 'doc-100-4',
        category: 'lettre_motivation',
        label: 'Lettre de motivation',
        description:
          'Lettre motivant la candidature sur le sujet DOC-2026-IA01 au sein du Laboratoire LISS — Document de démonstration.',
        required: true,
        fileName: '04-lettre-motivation-regragui.pdf',
        fileType: 'application/pdf',
        fileSize: '10.1 KB',
        uploadDate: '2026-10-27T10:15:00Z',
        fileUrl: '/demo-pdfs/ayoub-regragui/04-lettre-motivation-regragui.pdf',
        status: 'conforme',
        remark: 'Lettre de motivation signée et conforme au sujet visé.',
        reviewedBy: 'Pr. Youssef El Amrani',
        reviewedAt: '2026-10-28T11:45:00Z',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 10374,
          sha256Short: 'REGL04',
          checkedAt: '2026-10-27T10:15:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 1 page)'
        }
      },
      {
        id: 'doc-100-5',
        category: 'projet_recherche',
        label: 'Projet de recherche doctoral',
        description:
          'Avant-projet complet : Modèles Fondamentaux Légers et Apprentissage Auto-Supervisé pour le Diagnostic Précoce en Imagerie Médicale — Document de démonstration.',
        required: true,
        fileName: '05-projet-recherche-regragui.pdf',
        fileType: 'application/pdf',
        fileSize: '20.9 KB',
        uploadDate: '2026-10-27T10:15:00Z',
        fileUrl: '/demo-pdfs/ayoub-regragui/05-projet-recherche-regragui.pdf',
        status: 'conforme',
        remark: 'Avant-projet doctoral de 3 pages structuré et conforme.',
        reviewedBy: 'Pr. Youssef El Amrani',
        reviewedAt: '2026-10-28T11:50:00Z',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 21445,
          sha256Short: 'REGP05',
          checkedAt: '2026-10-27T10:15:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 3 pages)'
        }
      },
      {
        id: 'doc-100-6',
        category: 'autre',
        label: 'Copie de la CIN',
        description:
          'Copie recto-verso de la Carte Nationale d’Identité Électronique (CNIE CD712894) — Document de démonstration.',
        required: true,
        fileName: '06-copie-cin-regragui.pdf',
        fileType: 'application/pdf',
        fileSize: '13.6 KB',
        uploadDate: '2026-10-27T10:15:00Z',
        fileUrl: '/demo-pdfs/ayoub-regragui/06-copie-cin-regragui.pdf',
        status: 'conforme',
        remark: 'Pièce d’identité (spécimen de démonstration) lisible et conforme.',
        reviewedBy: 'Pr. Youssef El Amrani',
        reviewedAt: '2026-10-28T11:55:00Z',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 13934,
          sha256Short: 'REGC06',
          checkedAt: '2026-10-27T10:15:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 1 page)'
        }
      }
    ],
    historyLogs: [
      {
        id: 'log-100-1',
        timestamp: '2026-10-27T10:15:00Z',
        authorName: 'Ayoub Regragui',
        authorRole: 'candidat',
        action: 'Soumission officielle du dossier de démonstration',
        details: 'Dépôt complet des 6 pièces justificatives PDF (Diplôme, Relevés de notes, CV, Lettre de motivation, Projet de recherche, Copie CIN) avec consentement Loi 09-08.',
        statusAfter: 'en_attente'
      },
      {
        id: 'log-100-2',
        timestamp: '2026-10-28T11:55:00Z',
        authorName: 'Pr. Youssef El Amrani',
        authorRole: 'directeur',
        action: 'Vérification complète des 6 pièces justificatives (6/6 Conformes)',
        details: 'Les 6 documents justificatifs ont été vérifiés conformes. Le dossier est prêt pour le passage à l’avis scientifique.',
        statusAfter: 'documents_en_cours'
      }
    ]
  },
  {
    id: 'dos-101',
    referenceNumber: 'GCD-2026-USMBA-0142',
    isDemo: true,
    student: {
      firstName: 'Hamza',
      lastName: 'Tahiri',
      cne: 'N134091823',
      academicEmail: 'hamza.tahiri@usmba.ac.ma',
      phone: '+212 6 61 24 89 10',
      currentInstitution: 'EST Fès / Faculté des Sciences Dhar El Mahraz',
      degreeDeclared: 'Master Recherche en Sciences des Données et IA',
      graduationYear: '2026',
      gpa: '16.75 / 20 (Mention Très Bien)',
      documents: {
        diplomaName: 'attestation-reussite-demo.pdf',
        transcriptName: 'releve-notes-demo.pdf',
        cvName: 'cv-academique-demo.pdf',
        researchProjectName: 'projet-recherche-demo.pdf'
      },
      legalConsent: true
    },
    selectedTopics: [
      {
        topicId: 'top-1',
        topicCode: 'DOC-2026-IA01',
        topicTitle: 'Modèles Fondamentaux Légers et Apprentissage Auto-Supervisé pour le Diagnostic Précoce en Imagerie Médicale',
        director: 'Pr. Youssef El Amrani',
        laboratory: 'Laboratoire d’Informatique, Signaux et Systèmes (LISS)',
        priority: 1
      },
      {
        topicId: 'top-6',
        topicCode: 'DOC-2026-GL06',
        topicTitle: 'Génération et Vérification Formelle de Contrats Intelligents par Grands Modèles de Langage Spécialisés',
        director: 'Pr. Mounia Zeroual',
        laboratory: 'Laboratoire d’Ingénierie des Systèmes Informatiques (LISI)',
        priority: 2
      }
    ],
    submittedAt: '2026-10-28T14:32:00Z',
    status: 'avis_favorable',
    documentsStepValidated: true,
    documentsValidatedAt: '2026-10-29T10:15:00Z',
    documentsValidatedBy: 'Pr. Youssef El Amrani',
    directorTreatmentCompleted: true,
    directorProcessedAt: '2026-10-30T09:45:00Z',
    documentsList: [
      {
        id: 'doc-101-1',
        category: 'diplome',
        label: 'Attestation de diplôme ou de réussite',
        description:
          'Copie du diplôme de Master, d’Ingénieur d’État ou attestation officielle de réussite délivrée par l’établissement.',
        required: true,
        fileName: 'attestation-reussite-demo.pdf',
        fileType: 'application/pdf',
        fileSize: '10.8 KB',
        uploadDate: '2026-10-28T14:32:00Z',
        fileUrl: '/demo-pdfs/attestation-reussite-demo.pdf',
        status: 'conforme',
        remark: 'Attestation de réussite vérifiée conforme.',
        reviewedBy: 'Pr. Youssef El Amrani',
        reviewedAt: '2026-10-29T10:15:00Z',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 11009,
          sha256Short: 'ATT001',
          checkedAt: '2026-10-28T14:32:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 1 page)'
        }
      },
      {
        id: 'doc-101-2',
        category: 'releve_notes',
        label: 'Relevés de notes officiels',
        description:
          'Relevés de notes complets et certifiés du cursus (semestres S1 à S4 / cycle ingénieur) mentionnant les moyennes.',
        required: true,
        fileName: 'releve-notes-demo.pdf',
        fileType: 'application/pdf',
        fileSize: '25.7 KB',
        uploadDate: '2026-10-28T14:32:00Z',
        fileUrl: '/demo-pdfs/releve-notes-demo.pdf',
        status: 'conforme',
        remark: 'Moyenne générale 16.75/20 confirmée sur les 4 semestres.',
        reviewedBy: 'Pr. Youssef El Amrani',
        reviewedAt: '2026-10-29T10:15:00Z',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 26332,
          sha256Short: 'RN0003',
          checkedAt: '2026-10-28T14:32:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 2 pages)'
        }
      },
      {
        id: 'doc-101-3',
        category: 'cv',
        label: 'Curriculum Vitae académique',
        description:
          'Parcours universitaire détaillé, expériences de recherche, stages, publications scientifiques et compétences techniques.',
        required: true,
        fileName: 'cv-academique-demo.pdf',
        fileType: 'application/pdf',
        fileSize: '15.6 KB',
        uploadDate: '2026-10-28T14:32:00Z',
        fileUrl: '/demo-pdfs/cv-academique-demo.pdf',
        status: 'conforme',
        remark: 'Excellents prérequis en PyTorch, Computer Vision et Transformers.',
        reviewedBy: 'Pr. Youssef El Amrani',
        reviewedAt: '2026-10-29T10:15:00Z',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 16002,
          sha256Short: 'CV0004',
          checkedAt: '2026-10-28T14:32:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 2 pages)'
        }
      },
      {
        id: 'doc-101-4',
        category: 'lettre_motivation',
        label: 'Lettre de motivation',
        description:
          'Lettre exposant vos motivations scientifiques, l’adéquation avec les sujets choisis et votre projet doctoral.',
        required: true,
        fileName: 'lettre-motivation-demo.pdf',
        fileType: 'application/pdf',
        fileSize: '8.6 KB',
        uploadDate: '2026-10-28T14:32:00Z',
        fileUrl: '/demo-pdfs/lettre-motivation-demo.pdf',
        status: 'conforme',
        remark: 'Projet professionnel et motivation clairement argumentés.',
        reviewedBy: 'Pr. Youssef El Amrani',
        reviewedAt: '2026-10-29T10:15:00Z',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 8772,
          sha256Short: 'LM0005',
          checkedAt: '2026-10-28T14:32:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 1 page)'
        }
      },
      {
        id: 'doc-101-5',
        category: 'projet_recherche',
        label: 'Projet de recherche / Avant-projet de thèse',
        description:
          'Note scientifique structurée présentant la problématique, l’état de l’art, la méthodologie et la bibliographie.',
        required: true,
        fileName: 'projet-recherche-demo.pdf',
        fileType: 'application/pdf',
        fileSize: '20.5 KB',
        uploadDate: '2026-10-28T14:32:00Z',
        fileUrl: '/demo-pdfs/projet-recherche-demo.pdf',
        status: 'conforme',
        remark: 'Méthodologie solide (3 pages) et chronogramme cohérent.',
        reviewedBy: 'Pr. Youssef El Amrani',
        reviewedAt: '2026-10-29T10:15:00Z',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 20947,
          sha256Short: 'PR0006',
          checkedAt: '2026-10-28T14:32:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 3 pages)'
        }
      },
      {
        id: 'doc-101-6',
        category: 'autre',
        label: 'Attestation d’inscription universitaire',
        description:
          'Pièce complémentaire attestant l’inscription administrative universitaire de démonstration.',
        required: false,
        fileName: 'attestation-inscription-demo.pdf',
        fileType: 'application/pdf',
        fileSize: '8.8 KB',
        uploadDate: '2026-10-28T14:32:00Z',
        fileUrl: '/demo-pdfs/attestation-inscription-demo.pdf',
        status: 'conforme',
        remark: 'Attestation d’inscription complémentaire vérifiée.',
        reviewedBy: 'Pr. Youssef El Amrani',
        reviewedAt: '2026-10-29T10:15:00Z',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 8999,
          sha256Short: 'IN0007',
          checkedAt: '2026-10-28T14:32:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 1 page)'
        }
      }
    ],
    scientificOpinion: {
      decision: 'favorable',
      appreciation: 'Très pertinent — Projet structuré et maîtrisé',
      recommendations: 'Poursuivre l’état de l’art sur la quantification d’incertitude bayésienne pour le démarrage de thèse.',
      comment: 'Candidat exceptionnel. Son parcours en Master Recherche IA et son avant-projet démontrent une maîtrise remarquable des réseaux auto-supervisés. Avis très favorable pour une admission sous mon encadrement au laboratoire LISS.',
      decisionDate: '2026-10-30',
      submittedAt: '2026-10-30T09:45:00Z',
      directorName: 'Pr. Youssef El Amrani',
      directorTitle: 'Directeur de Thèse & Enseignant Chercheur (LISS - EST Fès)',
      directorEmail: 'youssef.elamrani@usmba.ac.ma'
    },
    historyLogs: [
      {
        id: 'log-1',
        timestamp: '2026-10-28T14:32:00Z',
        authorName: 'Hamza Tahiri',
        authorRole: 'candidat',
        action: 'Soumission initiale du dossier',
        details: 'Transmission du dossier avec 6 pièces PDF de démonstration pour le sujet DOC-2026-IA01.',
        statusAfter: 'en_attente'
      },
      {
        id: 'log-2',
        timestamp: '2026-10-29T10:15:00Z',
        authorName: 'Pr. Youssef El Amrani',
        authorRole: 'directeur',
        action: 'Vérification administrative des documents PDF',
        details: 'Ensemble des pièces justificatives validées conformes sans réserve.',
        statusAfter: 'documents_en_cours'
      },
      {
        id: 'log-3',
        timestamp: '2026-10-30T09:45:00Z',
        authorName: 'Pr. Youssef El Amrani',
        authorRole: 'directeur',
        action: 'Enregistrement de l’avis scientifique & Transmission au CEDoc',
        details: 'Avis Favorable émis par le Directeur de Thèse. Dossier réorienté vers la commission du CEDoc.',
        statusAfter: 'transmis_cedoc'
      }
    ]
  },
  {
    id: 'dos-102',
    referenceNumber: 'GCD-2026-USMBA-0188',
    isDemo: true,
    student: {
      firstName: 'Khadija',
      lastName: 'El Mansouri',
      cne: 'R142078345',
      academicEmail: 'khadija.elmansouri@est-fes.ac.ma',
      phone: '+212 6 72 15 33 98',
      currentInstitution: 'École Supérieure de Technologie de Fès (EST Fès)',
      degreeDeclared: 'Diplôme d’Ingénieur d’État en Réseaux & Télécommunications',
      graduationYear: '2026',
      gpa: '15.90 / 20 (Mention Bien)',
      documents: {
        diplomaName: 'diplome-universitaire-demo.pdf',
        transcriptName: 'releve-notes-demo.pdf',
        cvName: 'cv-academique-demo.pdf'
      },
      legalConsent: true
    },
    selectedTopics: [
      {
        topicId: 'top-2',
        topicCode: 'DOC-2026-CY02',
        topicTitle: 'Sécurité Décentralisée Basée sur la Blockchain et Cryptographie Post-Quantique pour les Réseaux Smart Grid IoT',
        director: 'Pr. Mohamed Tazi',
        laboratory: 'Laboratoire des Systèmes Intelligents et Réseaux (LSIR)',
        priority: 1
      },
      {
        topicId: 'top-1',
        topicCode: 'DOC-2026-IA01',
        topicTitle: 'Modèles Fondamentaux Légers et Apprentissage Auto-Supervisé pour le Diagnostic Précoce en Imagerie Médicale',
        director: 'Pr. Youssef El Amrani',
        laboratory: 'Laboratoire d’Informatique, Signaux et Systèmes (LISS)',
        priority: 2
      }
    ],
    submittedAt: '2026-10-29T16:45:00Z',
    status: 'documents_en_cours',
    documentsList: [
      {
        id: 'doc-102-1',
        category: 'diplome',
        label: 'Attestation de diplôme ou de réussite',
        description:
          'Copie du diplôme de Master, d’Ingénieur d’État ou attestation officielle de réussite délivrée par l’établissement.',
        required: true,
        fileName: 'diplome-universitaire-demo.pdf',
        fileType: 'application/pdf',
        fileSize: '9.6 KB',
        uploadDate: '2026-10-29T16:45:00Z',
        fileUrl: '/demo-pdfs/diplome-universitaire-demo.pdf',
        status: 'conforme',
        remark: 'Diplôme d ingénieur spécimen validé.',
        reviewedBy: 'Pr. Mohamed Tazi',
        reviewedAt: '2026-10-30T10:00:00Z',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 9843,
          sha256Short: 'D1P002',
          checkedAt: '2026-10-29T16:45:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 1 page)'
        }
      },
      {
        id: 'doc-102-2',
        category: 'releve_notes',
        label: 'Relevés de notes officiels',
        description:
          'Relevés de notes complets et certifiés du cursus (semestres S1 à S4 / cycle ingénieur) mentionnant les moyennes.',
        required: true,
        fileName: 'releve-notes-demo.pdf',
        fileType: 'application/pdf',
        fileSize: '25.7 KB',
        uploadDate: '2026-10-29T16:45:00Z',
        fileUrl: '/demo-pdfs/releve-notes-demo.pdf',
        status: 'conforme',
        remark: 'Notes certifiées conformes (Mention Bien).',
        reviewedBy: 'Pr. Mohamed Tazi',
        reviewedAt: '2026-10-30T10:05:00Z',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 26332,
          sha256Short: 'RN0003',
          checkedAt: '2026-10-29T16:45:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 2 pages)'
        }
      },
      {
        id: 'doc-102-3',
        category: 'cv',
        label: 'Curriculum Vitae académique',
        description:
          'Parcours universitaire détaillé, expériences de recherche, stages, publications scientifiques et compétences techniques.',
        required: true,
        fileName: 'cv-academique-demo.pdf',
        fileType: 'application/pdf',
        fileSize: '15.6 KB',
        uploadDate: '2026-10-29T16:45:00Z',
        fileUrl: '/demo-pdfs/cv-academique-demo.pdf',
        status: 'conforme',
        remark: 'Bon profil technique en réseaux IoT et cybersécurité.',
        reviewedBy: 'Pr. Mohamed Tazi',
        reviewedAt: '2026-10-30T10:10:00Z',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 16002,
          sha256Short: 'CV0004',
          checkedAt: '2026-10-29T16:45:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 2 pages)'
        }
      },
      {
        id: 'doc-102-4',
        category: 'projet_recherche',
        label: 'Projet de recherche / Avant-projet de thèse',
        description:
          'Note scientifique structurée présentant la problématique, l’état de l’art, la méthodologie et la bibliographie.',
        required: true,
        fileName: 'projet-recherche-demo.pdf',
        fileType: 'application/pdf',
        fileSize: '20.5 KB',
        uploadDate: '2026-10-29T16:45:00Z',
        fileUrl: '/demo-pdfs/projet-recherche-demo.pdf',
        status: 'en_attente_verification',
        remark: 'En cours d analyse par le Directeur de Thèse.',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 20947,
          sha256Short: 'PR0006',
          checkedAt: '2026-10-29T16:45:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 3 pages)'
        }
      }
    ],
    scientificOpinion: undefined,
    historyLogs: [
      {
        id: 'log-102-1',
        timestamp: '2026-10-29T16:45:00Z',
        authorName: 'Khadija El Mansouri',
        authorRole: 'candidat',
        action: 'Dépôt du dossier de candidature',
        details: 'Dossier créé et pièces justificatives PDF enregistrées avec succès.',
        statusAfter: 'en_attente'
      }
    ]
  },
  {
    id: 'dos-103',
    referenceNumber: 'GCD-2026-USMBA-0205',
    isDemo: true,
    student: {
      firstName: 'Amine',
      lastName: 'Bennani',
      cne: 'K139045112',
      academicEmail: 'amine.bennani@usmba.ac.ma',
      phone: '+212 6 54 88 12 09',
      currentInstitution: 'Faculté des Sciences et Techniques de Fès (FST Fès)',
      degreeDeclared: 'Master Spécialisé en Génie Logiciel & Cloud Computing',
      graduationYear: '2026',
      gpa: '15.10 / 20 (Mention Assez Bien)',
      documents: {
        diplomaName: 'attestation-reussite-demo.pdf',
        transcriptName: 'releve-notes-demo.pdf',
        cvName: 'cv-academique-demo.pdf',
        researchProjectName: 'projet-recherche-demo.pdf'
      },
      legalConsent: true
    },
    selectedTopics: [
      {
        topicId: 'top-1',
        topicCode: 'DOC-2026-IA01',
        topicTitle: 'Modèles Fondamentaux Légers et Apprentissage Auto-Supervisé pour le Diagnostic Précoce en Imagerie Médicale',
        director: 'Pr. Youssef El Amrani',
        laboratory: 'Laboratoire d’Informatique, Signaux et Systèmes (LISS)',
        priority: 1
      }
    ],
    submittedAt: '2026-11-01T11:15:00Z',
    status: 'documents_non_conformes',
    documentsStepValidated: false,
    directorTreatmentCompleted: false,
    documentsList: [
      {
        id: 'doc-103-1',
        category: 'diplome',
        label: 'Attestation de diplôme ou de réussite',
        description:
          'Copie du diplôme de Master, d’Ingénieur d’État ou attestation officielle de réussite délivrée par l’établissement.',
        required: true,
        fileName: 'attestation-reussite-demo.pdf',
        fileType: 'application/pdf',
        fileSize: '10.8 KB',
        uploadDate: '2026-11-01T11:15:00Z',
        fileUrl: '/demo-pdfs/attestation-reussite-demo.pdf',
        status: 'conforme',
        remark: 'Attestation spécimen conforme.',
        reviewedBy: 'Pr. Youssef El Amrani',
        reviewedAt: '2026-11-02T09:15:00Z',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 11009,
          sha256Short: 'ATT001',
          checkedAt: '2026-11-01T11:15:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 1 page)'
        }
      },
      {
        id: 'doc-103-2',
        category: 'releve_notes',
        label: 'Relevés de notes officiels',
        description:
          'Relevés de notes complets et certifiés du cursus (semestres S1 à S4 / cycle ingénieur) mentionnant les moyennes.',
        required: true,
        fileName: 'releve-notes-demo.pdf',
        fileType: 'application/pdf',
        fileSize: '25.7 KB',
        uploadDate: '2026-11-01T11:15:00Z',
        fileUrl: '/demo-pdfs/releve-notes-demo.pdf',
        status: 'conforme',
        reviewedBy: 'Pr. Youssef El Amrani',
        reviewedAt: '2026-11-02T09:20:00Z',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 26332,
          sha256Short: 'RN0003',
          checkedAt: '2026-11-01T11:15:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 2 pages)'
        }
      },
      {
        id: 'doc-103-3',
        category: 'projet_recherche',
        label: 'Projet de recherche / Avant-projet de thèse',
        description:
          'Note scientifique structurée présentant la problématique, l’état de l’art, la méthodologie et la bibliographie.',
        required: true,
        fileName: 'projet-recherche-demo.pdf',
        fileType: 'application/pdf',
        fileSize: '20.5 KB',
        uploadDate: '2026-11-01T11:15:00Z',
        fileUrl: '/demo-pdfs/projet-recherche-demo.pdf',
        status: 'remplacement_demande',
        remark: 'Le chapitre sur l’état de l’art manque de références académiques récentes (2024-2026). Merci de déposer une version révisée.',
        reviewedBy: 'Pr. Youssef El Amrani',
        reviewedAt: '2026-11-03T16:15:00Z',
        version: 1,
        technicalCheck: {
          isPdfFormatValid: true,
          isSizeValid: true,
          isFilePresent: true,
          isIntegrityValid: true,
          maxAllowedSizeMb: 10,
          fileSizeBytes: 20947,
          sha256Short: 'PR0006',
          checkedAt: '2026-11-01T11:15:00Z',
          summary: 'Contrôle technique conforme (PDF réel, signature %PDF- vérifiée, 3 pages)'
        }
      }
    ],
    historyLogs: [
      {
        id: 'log-103-1',
        timestamp: '2026-11-01T11:15:00Z',
        authorName: 'Amine Bennani',
        authorRole: 'candidat',
        action: 'Soumission du dossier',
        details: 'Dossier transmis avec pièces justificatives.',
        statusAfter: 'en_attente'
      },
      {
        id: 'log-103-2',
        timestamp: '2026-11-03T16:15:00Z',
        authorName: 'Pr. Youssef El Amrani',
        authorRole: 'directeur',
        action: 'Contrôle documentaire (Remplacement demandé) : Projet de recherche / Avant-projet de thèse',
        details: 'Le chapitre sur l’état de l’art manque de références académiques récentes (2024-2026). Dossier maintenu en cours de traitement.',
        statusAfter: 'documents_non_conformes'
      }
    ]
  }
];
