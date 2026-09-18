/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Student, AttendanceSheet, AttendanceRecord, SchoolClass, Evaluation, SchoolTenant } from '../types';

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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
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
  console.error('Firestore Error in useTenantStats: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface SchoolStatDetails {
  studentCount: number;
  classCount: number;
  sheetsCount: number;
  recordsCount: number;
  evalCount: number;
  attendanceRate: number;
  activityCount: number;
  healthScore: number;
}

export interface TenantStats {
  totalStudents: number;
  activeStudentsCount: number;
  attendanceRate: number;
  classesCount: number;
  sheetsCount: number;
  recordsCount: number;
  evaluationsCount: number;
  pendingValidationsCount: number;
  systemUsageCount: number;
  totalSchoolsCount: number;
  activeSchoolsCount: number;
  schools: SchoolTenant[];
  loading: boolean;
  schoolStatsMap: Record<string, SchoolStatDetails>;
}

export function useTenantStats(schoolId?: string): TenantStats {
  const [schools, setSchools] = useState<SchoolTenant[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sheets, setSheets] = useState<AttendanceSheet[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  
  const [loadingStates, setLoadingStates] = useState({
    schools: true,
    students: true,
    classes: true,
    sheets: true,
    records: true,
    evaluations: true,
  });

  useEffect(() => {
    // 0. Schools Live Query Listener
    const unsubSchools = onSnapshot(
      collection(db, 'schools'),
      (snapshot) => {
        const list: SchoolTenant[] = [];
        snapshot.forEach((doc) => {
          list.push({ ...(doc.data() as SchoolTenant), id: doc.id });
        });
        setSchools(list);
        setLoadingStates((prev) => ({ ...prev, schools: false }));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'schools');
        setLoadingStates((prev) => ({ ...prev, schools: false }));
      }
    );

    // 1. Students Live Query Listener
    const unsubStudents = onSnapshot(
      collection(db, 'students'),
      (snapshot) => {
        const list: Student[] = [];
        snapshot.forEach((doc) => {
          list.push({ ...(doc.data() as Student), id: doc.id });
        });
        setStudents(list);
        setLoadingStates((prev) => ({ ...prev, students: false }));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'students');
        setLoadingStates((prev) => ({ ...prev, students: false }));
      }
    );

    // 2. Classes Live Query Listener
    const unsubClasses = onSnapshot(
      collection(db, 'classes'),
      (snapshot) => {
        const list: SchoolClass[] = [];
        snapshot.forEach((doc) => {
          list.push({ ...(doc.data() as SchoolClass), id: doc.id });
        });
        setClasses(list);
        setLoadingStates((prev) => ({ ...prev, classes: false }));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'classes');
        setLoadingStates((prev) => ({ ...prev, classes: false }));
      }
    );

    // 3. Sheets Live Query Listener
    const unsubSheets = onSnapshot(
      collection(db, 'sheets'),
      (snapshot) => {
        const list: AttendanceSheet[] = [];
        snapshot.forEach((doc) => {
          list.push({ ...(doc.data() as AttendanceSheet), id: doc.id });
        });
        setSheets(list);
        setLoadingStates((prev) => ({ ...prev, sheets: false }));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'sheets');
        setLoadingStates((prev) => ({ ...prev, sheets: false }));
      }
    );

    // 4. Records Live Query Listener
    const unsubRecords = onSnapshot(
      collection(db, 'records'),
      (snapshot) => {
        const list: AttendanceRecord[] = [];
        snapshot.forEach((doc) => {
          list.push({ ...(doc.data() as AttendanceRecord), id: doc.id });
        });
        setRecords(list);
        setLoadingStates((prev) => ({ ...prev, records: false }));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'records');
        setLoadingStates((prev) => ({ ...prev, records: false }));
      }
    );

    // 5. Evaluations Live Query Listener
    const unsubEvaluations = onSnapshot(
      collection(db, 'evaluations'),
      (snapshot) => {
        const list: Evaluation[] = [];
        snapshot.forEach((doc) => {
          list.push({ ...(doc.data() as Evaluation), id: doc.id });
        });
        setEvaluations(list);
        setLoadingStates((prev) => ({ ...prev, evaluations: false }));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'evaluations');
        setLoadingStates((prev) => ({ ...prev, evaluations: false }));
      }
    );

    return () => {
      unsubSchools();
      unsubStudents();
      unsubClasses();
      unsubSheets();
      unsubRecords();
      unsubEvaluations();
    };
  }, []);

  const isLoading = Object.values(loadingStates).some(state => state);

  // Filter lists based on target schoolId if requested
  const targetStudents = schoolId ? students.filter((s) => s.schoolId === schoolId) : students;
  const targetClasses = schoolId ? classes.filter((c) => c.schoolId === schoolId) : classes;
  const targetSheets = schoolId ? sheets.filter((s) => s.schoolId === schoolId) : sheets;
  const targetEvaluations = schoolId ? evaluations.filter((e) => e.schoolId === schoolId) : evaluations;

  // Records don't have schoolId directly. We map them via sheetIds.
  const targetSheetIds = new Set(targetSheets.map((s) => s.id));
  const targetRecords = records.filter((r) => targetSheetIds.has(r.sheetId));

  // Computations
  const totalStudents = targetStudents.length;
  const activeStudentsCount = targetStudents.filter(s => s.status === 'Active' || s.status === 'Actif' || !s.status).length;
  
  const presentCount = targetRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const attendanceRate = targetRecords.length > 0
    ? Number(((presentCount / targetRecords.length) * 100).toFixed(1))
    : 0;

  const pendingValidationsCount = targetEvaluations.filter((e) => e.status === 'PENDING_VALIDATION').length;

  // Dynamic school counts computed in real-time from Firestore collection
  const realTimeTotalSchoolsCount = schools.length;
  const realTimeActiveSchoolsCount = schools.filter(s => s.licenseStatus === 'Active' || !s.licenseStatus).length;

  // Build the per-school statistics map for SuperAdmin insights
  const schoolStatsMap: Record<string, SchoolStatDetails> = {};
  
  // Find all unique school IDs from schools or entities
  const allSchoolIds = Array.from(new Set([
    ...schools.map(s => s.id),
    ...students.map(s => s.schoolId).filter(Boolean) as string[],
    ...classes.map(c => c.schoolId).filter(Boolean) as string[],
    ...sheets.map(sh => sh.schoolId).filter(Boolean) as string[],
    ...evaluations.map(e => e.schoolId).filter(Boolean) as string[]
  ]));

  allSchoolIds.forEach(schId => {
    const sList = students.filter(s => s.schoolId === schId);
    const cList = classes.filter(c => c.schoolId === schId);
    const shList = sheets.filter(s => s.schoolId === schId);
    const eList = evaluations.filter(e => e.schoolId === schId);

    const shIds = new Set(shList.map(s => s.id));
    const rList = records.filter(r => shIds.has(r.sheetId));
    
    const pCount = rList.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const attRate = rList.length > 0 
      ? Number(((pCount / rList.length) * 100).toFixed(1))
      : 0;

    const activityCount = shList.length + eList.length;

    // Calculate dynamic healthScore / adoption score based strictly on real data
    let hScore = (activityCount > 0 || cList.length > 0)
      ? Math.max(5, Math.min(100, Math.round(50 + Math.min(activityCount * 3, 30) + Math.min(cList.length * 4, 20))))
      : 0;

    schoolStatsMap[schId] = {
      studentCount: sList.length,
      classCount: cList.length,
      sheetsCount: shList.length,
      recordsCount: rList.length,
      evalCount: eList.length,
      attendanceRate: attRate,
      activityCount,
      healthScore: hScore
    };
  });

  return {
    totalStudents,
    activeStudentsCount,
    attendanceRate,
    classesCount: targetClasses.length,
    sheetsCount: targetSheets.length,
    recordsCount: targetRecords.length,
    evaluationsCount: targetEvaluations.length,
    pendingValidationsCount,
    systemUsageCount: targetSheets.length + targetEvaluations.length + targetRecords.length,
    totalSchoolsCount: realTimeTotalSchoolsCount,
    activeSchoolsCount: realTimeActiveSchoolsCount,
    schools,
    loading: isLoading,
    schoolStatsMap,
  };
}
