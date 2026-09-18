/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  query,
  limit
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { 
  SchoolTenant, 
  SchoolClass, 
  Student, 
  AttendanceSheet, 
  AttendanceRecord, 
  Evaluation, 
  Mark, 
  AuditLog,
  SchoolPublicSiteConfig,
  SchoolSection,
  SchoolAdmissionConfig,
  SchoolArticle,
  ExamResultPublication,
  PreRegistrationSubmission,
  LibraryResource,
  SchoolUserAccount,
  OnboardingStep,
  SchoolSubscription,
  Homework
} from '../types';
import { 
  INITIAL_SCHOOLS, 
  CLASSES, 
  STUDENTS, 
  INITIAL_ATTENDANCE_SHEETS, 
  INITIAL_ATTENDANCE_RECORDS, 
  INITIAL_EVALUATIONS, 
  INITIAL_MARKS,
  INITIAL_PUBLIC_SITE_CONFIGS,
  INITIAL_SECTIONS,
  INITIAL_ADMISSION_CONFIGS,
  INITIAL_ARTICLES,
  INITIAL_EXAM_RESULTS,
  INITIAL_PRE_REGISTRATIONS,
  INITIAL_LIBRARY_RESOURCES,
  INITIAL_USER_ACCOUNTS,
  INITIAL_ONBOARDING_STEPS,
  INITIAL_SUBSCRIPTIONS
} from '../data/mockData';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to check Firestore connection on boot and ensure primary school exists
export async function seedDatabaseIfEmpty() {
  try {
    const schoolsCol = collection(db, 'schools');
    const q = query(schoolsCol, limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      console.log('Seeding ASI Gabon establishment into Firestore...');
      for (const school of INITIAL_SCHOOLS) {
        await setDoc(doc(db, 'schools', school.id), school);
      }
      for (const account of INITIAL_USER_ACCOUNTS) {
        await setDoc(doc(db, 'userAccounts', account.id), account);
      }
      for (const cls of CLASSES) {
        await setDoc(doc(db, 'classes', cls.id), cls);
      }
      for (const stud of STUDENTS) {
        await setDoc(doc(db, 'students', stud.id), stud);
      }
      for (const [key, config] of Object.entries(INITIAL_PUBLIC_SITE_CONFIGS)) {
        await setDoc(doc(db, 'siteConfigs', key), config);
      }
      for (const [key, sub] of Object.entries(INITIAL_SUBSCRIPTIONS)) {
        await setDoc(doc(db, 'subscriptions', key), sub);
      }
      for (const ev of INITIAL_EVALUATIONS) {
        await setDoc(doc(db, 'evaluations', ev.id), ev);
      }
      for (const mark of INITIAL_MARKS) {
        await setDoc(doc(db, 'marks', mark.id), mark);
      }
      console.log('ASI Gabon successfully seeded into Firestore.');
    } else {
      // Check if evaluations specifically are empty in Firestore
      try {
        const evalsCol = collection(db, 'evaluations');
        const evalsSnap = await getDocs(query(evalsCol, limit(1)));
        if (evalsSnap.empty && INITIAL_EVALUATIONS.length > 0) {
          console.log('Seeding initial evaluations and marks into Firestore...');
          for (const ev of INITIAL_EVALUATIONS) {
            await setDoc(doc(db, 'evaluations', ev.id), ev);
          }
          for (const mark of INITIAL_MARKS) {
            await setDoc(doc(db, 'marks', mark.id), mark);
          }
        }
      } catch (e) {
        console.warn('Evaluations check warning:', e);
      }
      console.log('Firestore connected successfully.');
    }
  } catch (error) {
    console.error('Firestore connection check warning:', error);
  }
}

// Subscribe helper to coordinate all Firestore collections to React states
export function startFirebaseSync(setters: {
  setSchools: React.Dispatch<React.SetStateAction<SchoolTenant[]>>;
  setClasses: React.Dispatch<React.SetStateAction<SchoolClass[]>>;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  setSheets: React.Dispatch<React.SetStateAction<AttendanceSheet[]>>;
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  setEvaluations: React.Dispatch<React.SetStateAction<Evaluation[]>>;
  setMarks: React.Dispatch<React.SetStateAction<Mark[]>>;
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  setSiteConfigs?: React.Dispatch<React.SetStateAction<Record<string, SchoolPublicSiteConfig>>>;
  setSections?: React.Dispatch<React.SetStateAction<SchoolSection[]>>;
  setAdmissionConfigs?: React.Dispatch<React.SetStateAction<Record<string, SchoolAdmissionConfig>>>;
  setArticles?: React.Dispatch<React.SetStateAction<SchoolArticle[]>>;
  setExamResults?: React.Dispatch<React.SetStateAction<ExamResultPublication[]>>;
  setPreRegistrations?: React.Dispatch<React.SetStateAction<PreRegistrationSubmission[]>>;
  setLibraryResources?: React.Dispatch<React.SetStateAction<LibraryResource[]>>;
  setUserAccounts?: React.Dispatch<React.SetStateAction<SchoolUserAccount[]>>;
  setOnboardingSteps?: React.Dispatch<React.SetStateAction<OnboardingStep[]>>;
  setSubscriptions?: React.Dispatch<React.SetStateAction<Record<string, SchoolSubscription>>>;
  setHomeworks?: React.Dispatch<React.SetStateAction<Homework[]>>;
}) {
  const unsubscribes: (() => void)[] = [];

  // 1. Schools Listener
  unsubscribes.push(
    onSnapshot(
      collection(db, 'schools'),
      (snapshot) => {
        const data: SchoolTenant[] = [];
        snapshot.forEach((doc) => {
          data.push({ ...doc.data() as SchoolTenant, id: doc.id });
        });
        setters.setSchools(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'schools');
      }
    )
  );

  // 2. Classes Listener
  unsubscribes.push(
    onSnapshot(
      collection(db, 'classes'),
      (snapshot) => {
        const data: SchoolClass[] = [];
        snapshot.forEach((doc) => {
          data.push({ ...doc.data() as SchoolClass, id: doc.id });
        });
        setters.setClasses(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'classes');
      }
    )
  );

  // 3. Students Listener
  unsubscribes.push(
    onSnapshot(
      collection(db, 'students'),
      (snapshot) => {
        const data: Student[] = [];
        snapshot.forEach((doc) => {
          data.push({ ...doc.data() as Student, id: doc.id });
        });
        setters.setStudents(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'students');
      }
    )
  );

  // 4. Sheets Listener
  unsubscribes.push(
    onSnapshot(
      collection(db, 'sheets'),
      (snapshot) => {
        const data: AttendanceSheet[] = [];
        snapshot.forEach((doc) => {
          data.push({ ...doc.data() as AttendanceSheet, id: doc.id });
        });
        setters.setSheets(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'sheets');
      }
    )
  );

  // 5. Records Listener
  unsubscribes.push(
    onSnapshot(
      collection(db, 'records'),
      (snapshot) => {
        const data: AttendanceRecord[] = [];
        snapshot.forEach((doc) => {
          data.push({ ...doc.data() as AttendanceRecord, id: doc.id });
        });
        setters.setRecords(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'records');
      }
    )
  );

  // 6. Evaluations Listener
  unsubscribes.push(
    onSnapshot(
      collection(db, 'evaluations'),
      (snapshot) => {
        const data: Evaluation[] = [];
        snapshot.forEach((doc) => {
          data.push({ ...doc.data() as Evaluation, id: doc.id });
        });
        setters.setEvaluations(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'evaluations');
      }
    )
  );

  // 7. Marks Listener
  unsubscribes.push(
    onSnapshot(
      collection(db, 'marks'),
      (snapshot) => {
        const data: Mark[] = [];
        snapshot.forEach((doc) => {
          data.push({ ...doc.data() as Mark, id: doc.id });
        });
        setters.setMarks(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'marks');
      }
    )
  );

  // 8. Audit Logs Listener
  unsubscribes.push(
    onSnapshot(
      collection(db, 'auditLogs'),
      (snapshot) => {
        const data: AuditLog[] = [];
        snapshot.forEach((doc) => {
          data.push({ ...doc.data() as AuditLog, id: doc.id });
        });
        data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setters.setAuditLogs(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'auditLogs');
      }
    )
  );

  // 9. Site Configs Listener
  if (setters.setSiteConfigs) {
    unsubscribes.push(
      onSnapshot(
        collection(db, 'siteConfigs'),
        (snapshot) => {
          const map: Record<string, SchoolPublicSiteConfig> = {};
          snapshot.forEach((doc) => {
            map[doc.id] = doc.data() as SchoolPublicSiteConfig;
          });
          setters.setSiteConfigs?.(prev => ({ ...prev, ...map }));
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'siteConfigs');
        }
      )
    );
  }

  // 10. Sections Listener
  if (setters.setSections) {
    unsubscribes.push(
      onSnapshot(
        collection(db, 'sections'),
        (snapshot) => {
          const list: SchoolSection[] = [];
          snapshot.forEach((doc) => {
            list.push({ ...doc.data() as SchoolSection, id: doc.id });
          });
          setters.setSections?.(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'sections');
        }
      )
    );
  }

  // 11. Admission Configs Listener
  if (setters.setAdmissionConfigs) {
    unsubscribes.push(
      onSnapshot(
        collection(db, 'admissionConfigs'),
        (snapshot) => {
          const map: Record<string, SchoolAdmissionConfig> = {};
          snapshot.forEach((doc) => {
            map[doc.id] = doc.data() as SchoolAdmissionConfig;
          });
          setters.setAdmissionConfigs?.(prev => ({ ...prev, ...map }));
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'admissionConfigs');
        }
      )
    );
  }

  // 12. Articles Listener
  if (setters.setArticles) {
    unsubscribes.push(
      onSnapshot(
        collection(db, 'articles'),
        (snapshot) => {
          const list: SchoolArticle[] = [];
          snapshot.forEach((doc) => {
            list.push({ ...doc.data() as SchoolArticle, id: doc.id });
          });
          setters.setArticles?.(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'articles');
        }
      )
    );
  }

  // 13. Exam Results Listener
  if (setters.setExamResults) {
    unsubscribes.push(
      onSnapshot(
        collection(db, 'examResults'),
        (snapshot) => {
          const list: ExamResultPublication[] = [];
          snapshot.forEach((doc) => {
            list.push({ ...doc.data() as ExamResultPublication, id: doc.id });
          });
          setters.setExamResults?.(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'examResults');
        }
      )
    );
  }

  // 14. Pre Registrations Listener
  if (setters.setPreRegistrations) {
    unsubscribes.push(
      onSnapshot(
        collection(db, 'preRegistrations'),
        (snapshot) => {
          const list: PreRegistrationSubmission[] = [];
          snapshot.forEach((doc) => {
            list.push({ ...doc.data() as PreRegistrationSubmission, id: doc.id });
          });
          setters.setPreRegistrations?.(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'preRegistrations');
        }
      )
    );
  }

  // 15. Library Resources Listener
  if (setters.setLibraryResources) {
    unsubscribes.push(
      onSnapshot(
        collection(db, 'libraryResources'),
        (snapshot) => {
          const list: LibraryResource[] = [];
          snapshot.forEach((doc) => {
            list.push({ ...doc.data() as LibraryResource, id: doc.id });
          });
          setters.setLibraryResources?.(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'libraryResources');
        }
      )
    );
  }

  // 16. User Accounts Listener
  if (setters.setUserAccounts) {
    unsubscribes.push(
      onSnapshot(
        collection(db, 'userAccounts'),
        (snapshot) => {
          const list: SchoolUserAccount[] = [];
          snapshot.forEach((doc) => {
            list.push({ ...doc.data() as SchoolUserAccount, id: doc.id });
          });
          if (list.length === 0) {
            setters.setUserAccounts?.(INITIAL_USER_ACCOUNTS);
          } else {
            // Merge default accounts so initial staff credentials always work
            const merged = [...list];
            for (const initAcc of INITIAL_USER_ACCOUNTS) {
              if (!merged.some(a => a.id === initAcc.id || a.username.toLowerCase() === initAcc.username.toLowerCase())) {
                merged.push(initAcc);
              }
            }
            setters.setUserAccounts?.(merged);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'userAccounts');
        }
      )
    );
  }

  // 17. Onboarding Steps Listener
  if (setters.setOnboardingSteps) {
    unsubscribes.push(
      onSnapshot(
        collection(db, 'onboardingSteps'),
        (snapshot) => {
          const list: OnboardingStep[] = [];
          snapshot.forEach((doc) => {
            list.push({ ...doc.data() as OnboardingStep, id: doc.id });
          });
          setters.setOnboardingSteps?.(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'onboardingSteps');
        }
      )
    );
  }

  // 18. Subscriptions Listener
  if (setters.setSubscriptions) {
    unsubscribes.push(
      onSnapshot(
        collection(db, 'subscriptions'),
        (snapshot) => {
          const map: Record<string, SchoolSubscription> = {};
          snapshot.forEach((doc) => {
            map[doc.id] = doc.data() as SchoolSubscription;
          });
          setters.setSubscriptions?.(prev => ({ ...prev, ...map }));
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'subscriptions');
        }
      )
    );
  }

  // 19. Homeworks Listener
  if (setters.setHomeworks) {
    unsubscribes.push(
      onSnapshot(
        collection(db, 'homeworks'),
        (snapshot) => {
          const list: Homework[] = [];
          snapshot.forEach((doc) => {
            list.push({ ...doc.data() as Homework, id: doc.id });
          });
          setters.setHomeworks?.(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'homeworks');
        }
      )
    );
  }

  return () => {
    unsubscribes.forEach(unsub => unsub());
  };
}

// ============================================================================
// Firestore Writer & Deleter Helper Functions
// ============================================================================

export async function dbSaveSchool(school: SchoolTenant) {
  try {
    await setDoc(doc(db, 'schools', school.id), school);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `schools/${school.id}`);
  }
}

export async function dbDeleteSchool(schoolId: string) {
  try {
    await deleteDoc(doc(db, 'schools', schoolId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `schools/${schoolId}`);
  }
}

export async function dbSaveClass(cls: SchoolClass) {
  try {
    await setDoc(doc(db, 'classes', cls.id), cls);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `classes/${cls.id}`);
  }
}

export async function dbDeleteClass(classId: string) {
  try {
    await deleteDoc(doc(db, 'classes', classId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `classes/${classId}`);
  }
}

export async function dbSaveStudent(student: Student) {
  try {
    await setDoc(doc(db, 'students', student.id), student);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `students/${student.id}`);
  }
}

export async function dbDeleteStudent(studentId: string) {
  try {
    await deleteDoc(doc(db, 'students', studentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `students/${studentId}`);
  }
}

export async function dbSaveSheet(sheet: AttendanceSheet) {
  try {
    await setDoc(doc(db, 'sheets', sheet.id), sheet);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `sheets/${sheet.id}`);
  }
}

export async function dbSaveRecord(record: AttendanceRecord) {
  try {
    await setDoc(doc(db, 'records', record.id), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `records/${record.id}`);
  }
}

export async function dbSaveEvaluation(evaluation: Evaluation) {
  try {
    await setDoc(doc(db, 'evaluations', evaluation.id), evaluation);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `evaluations/${evaluation.id}`);
  }
}

export async function dbSaveMark(mark: Mark) {
  try {
    await setDoc(doc(db, 'marks', mark.id), mark);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `marks/${mark.id}`);
  }
}

export async function dbSaveAuditLog(log: AuditLog) {
  try {
    await setDoc(doc(db, 'auditLogs', log.id), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `auditLogs/${log.id}`);
  }
}

export async function dbSaveSiteConfig(schoolId: string, config: SchoolPublicSiteConfig) {
  try {
    await setDoc(doc(db, 'siteConfigs', schoolId), config);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `siteConfigs/${schoolId}`);
  }
}

export async function dbSaveSection(section: SchoolSection) {
  try {
    await setDoc(doc(db, 'sections', section.id), section);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `sections/${section.id}`);
  }
}

export async function dbDeleteSection(sectionId: string) {
  try {
    await deleteDoc(doc(db, 'sections', sectionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `sections/${sectionId}`);
  }
}

export async function dbSaveAdmissionConfig(schoolId: string, config: SchoolAdmissionConfig) {
  try {
    await setDoc(doc(db, 'admissionConfigs', schoolId), config);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `admissionConfigs/${schoolId}`);
  }
}

export async function dbSaveArticle(article: SchoolArticle) {
  try {
    await setDoc(doc(db, 'articles', article.id), article);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `articles/${article.id}`);
  }
}

export async function dbDeleteArticle(articleId: string) {
  try {
    await deleteDoc(doc(db, 'articles', articleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `articles/${articleId}`);
  }
}

export async function dbSaveExamResult(result: ExamResultPublication) {
  try {
    await setDoc(doc(db, 'examResults', result.id), result);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `examResults/${result.id}`);
  }
}

export async function dbDeleteExamResult(resultId: string) {
  try {
    await deleteDoc(doc(db, 'examResults', resultId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `examResults/${resultId}`);
  }
}

export async function dbSavePreRegistration(pr: PreRegistrationSubmission) {
  try {
    await setDoc(doc(db, 'preRegistrations', pr.id), pr);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `preRegistrations/${pr.id}`);
  }
}

export async function dbDeletePreRegistration(prId: string) {
  try {
    await deleteDoc(doc(db, 'preRegistrations', prId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `preRegistrations/${prId}`);
  }
}

export async function dbSaveLibraryResource(resource: LibraryResource) {
  try {
    await setDoc(doc(db, 'libraryResources', resource.id), resource);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `libraryResources/${resource.id}`);
  }
}

export async function dbDeleteLibraryResource(resourceId: string) {
  try {
    await deleteDoc(doc(db, 'libraryResources', resourceId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `libraryResources/${resourceId}`);
  }
}

export async function dbSaveUserAccount(account: SchoolUserAccount) {
  try {
    await setDoc(doc(db, 'userAccounts', account.id), account);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `userAccounts/${account.id}`);
  }
}

export async function dbDeleteUserAccount(accountId: string) {
  try {
    await deleteDoc(doc(db, 'userAccounts', accountId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `userAccounts/${accountId}`);
  }
}

export async function dbSaveOnboardingStep(step: OnboardingStep) {
  try {
    await setDoc(doc(db, 'onboardingSteps', step.id), step);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `onboardingSteps/${step.id}`);
  }
}

export async function dbDeleteOnboardingStep(stepId: string) {
  try {
    await deleteDoc(doc(db, 'onboardingSteps', stepId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `onboardingSteps/${stepId}`);
  }
}

export async function dbSaveSubscription(schoolId: string, subscription: SchoolSubscription) {
  try {
    await setDoc(doc(db, 'subscriptions', schoolId), subscription);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `subscriptions/${schoolId}`);
  }
}

export async function dbDeleteSubscription(schoolId: string) {
  try {
    await deleteDoc(doc(db, 'subscriptions', schoolId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `subscriptions/${schoolId}`);
  }
}

export async function dbDeleteSheet(sheetId: string) {
  try {
    await deleteDoc(doc(db, 'sheets', sheetId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `sheets/${sheetId}`);
  }
}

export async function dbDeleteRecord(recordId: string) {
  try {
    await deleteDoc(doc(db, 'records', recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `records/${recordId}`);
  }
}

export async function dbDeleteEvaluation(evalId: string) {
  try {
    await deleteDoc(doc(db, 'evaluations', evalId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `evaluations/${evalId}`);
  }
}

export async function dbDeleteMark(markId: string) {
  try {
    await deleteDoc(doc(db, 'marks', markId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `marks/${markId}`);
  }
}

export async function dbDeleteAuditLog(logId: string) {
  try {
    await deleteDoc(doc(db, 'auditLogs', logId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `auditLogs/${logId}`);
  }
}

export async function dbDeleteSiteConfig(schoolId: string) {
  try {
    await deleteDoc(doc(db, 'siteConfigs', schoolId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `siteConfigs/${schoolId}`);
  }
}

export async function dbDeleteAdmissionConfig(schoolId: string) {
  try {
    await deleteDoc(doc(db, 'admissionConfigs', schoolId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `admissionConfigs/${schoolId}`);
  }
}

export async function dbSaveHomework(homework: Homework) {
  try {
    await setDoc(doc(db, 'homeworks', homework.id), homework, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `homeworks/${homework.id}`);
  }
}

export async function dbDeleteHomework(homeworkId: string) {
  try {
    await deleteDoc(doc(db, 'homeworks', homeworkId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `homeworks/${homeworkId}`);
  }
}

