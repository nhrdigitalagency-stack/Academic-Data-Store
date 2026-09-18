import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { SchoolTenant, AttendanceSheet, AttendanceRecord, Student, Subject, Homework } from '../types';
import { SUBJECTS } from '../data/mockData';

// Helper to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove leading hash if present
  const cleaned = hex.replace('#', '');
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Helper to load an image URL as a base64 or HTMLImageElement
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Generates an elegant brand-compliant PDF of an Attendance Sheet (Feuille de Présence)
 */
export async function generateAttendancePDF(
  school: SchoolTenant,
  sheet: AttendanceSheet,
  sheetRecords: AttendanceRecord[],
  className: string,
  students: Student[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = school.themePrimary || '#3b82f6';
  const secondaryColor = school.themeSecondary || '#1e293b';
  const accentColor = school.themeAccent || '#f59e0b';

  const rgbPrimary = hexToRgb(primaryColor);
  const rgbSecondary = hexToRgb(secondaryColor);
  const rgbAccent = hexToRgb(accentColor);

  // 1. Draw header decorative bands
  doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
  doc.rect(0, 0, 210, 4, 'F'); // Top primary color strip

  doc.setFillColor(rgbAccent.r, rgbAccent.g, rgbAccent.b);
  doc.rect(0, 4, 210, 1.5, 'F'); // Thin accent color strip

  // 2. Load and Draw Logo / Crest
  let logoDrawn = false;
  if (school.logoUrl) {
    try {
      const img = await loadImage(school.logoUrl);
      if (img) {
        doc.addImage(img, 'PNG', 15, 12, 18, 18);
        logoDrawn = true;
      }
    } catch (e) {
      console.warn('Failed to load logo image, falling back to crest drawing', e);
    }
  }

  if (!logoDrawn) {
    // Draw premium circular crest with school initials
    doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
    doc.ellipse(24, 21, 9, 9, 'F');
    
    doc.setDrawColor(rgbAccent.r, rgbAccent.g, rgbAccent.b);
    doc.setLineWidth(0.6);
    doc.ellipse(24, 21, 9, 9, 'D');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    
    const initials = school.name
      .replace(/Lycée|Collège|d'/gi, '')
      .split(' ')
      .filter(Boolean)
      .map(w => w[0])
      .join('')
      .slice(0, 3)
      .toUpperCase();
    
    doc.text(initials, 24, 22.2, { align: 'center' });
  }

  // 3. Write School Identity
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(school.name, 38, 17);

  doc.setTextColor(110, 110, 110);
  doc.setFont('Helvetica', 'oblique');
  doc.setFontSize(8.5);
  doc.text(school.slogan || 'Discipline - Travail - Succès', 38, 21.5);

  doc.setTextColor(140, 140, 140);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${school.address || 'Yaoundé, Cameroun'}  |  Tel: ${school.phone || ''}`, 38, 25.5);

  // Republic watermark/header on top right
  doc.setTextColor(100, 100, 100);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('RÉPUBLIQUE DU CAMEROUN', 195, 14, { align: 'right' });
  doc.setFont('Helvetica', 'normal');
  doc.text('Paix - Travail - Patrie', 195, 17.5, { align: 'right' });
  doc.text('MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES', 195, 21, { align: 'right' });

  // 4. Document Title & Session Info Block
  doc.setFillColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.rect(15, 33, 180, 10, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('FICHE DE PRÉSENCE JOURNALIÈRE', 20, 39.5);

  const activeSubject = SUBJECTS.find(s => s.id === sheet.subjectId)?.name || 'Matière';
  doc.setTextColor(rgbAccent.r, rgbAccent.g, rgbAccent.b);
  doc.text(`COURS : ${activeSubject.toUpperCase()}`, 190, 39.5, { align: 'right' });

  // 5. Metadata Grid
  doc.setTextColor(60, 70, 90);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);

  // Box border
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.3);
  doc.rect(15, 46, 180, 18, 'D');

  // Metadata labels & values
  doc.setFont('Helvetica', 'bold');
  doc.text('Classe d\'Enseignement :', 18, 52);
  doc.setFont('Helvetica', 'normal');
  doc.text(className, 58, 52);

  doc.setFont('Helvetica', 'bold');
  doc.text('Date de la séance :', 18, 59);
  doc.setFont('Helvetica', 'normal');
  doc.text(sheet.date, 58, 59);

  doc.setFont('Helvetica', 'bold');
  doc.text('Créneau Horaire :', 110, 52);
  doc.setFont('Helvetica', 'normal');
  doc.text(sheet.timeSlot, 145, 52);

  doc.setFont('Helvetica', 'bold');
  doc.text('Période Académique :', 110, 59);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Séquence ${sheet.sequenceId} (Année ${school.activeSchoolYear || '2025-2026'})`, 145, 59);

  // 6. Stats & Summary Bar
  const stats = {
    present: sheetRecords.filter(r => r.status === 'PRESENT').length,
    late: sheetRecords.filter(r => r.status === 'LATE').length,
    absent: sheetRecords.filter(r => r.status === 'ABSENT').length,
    total: sheetRecords.length
  };
  const rate = stats.total > 0 ? ((stats.present + stats.late) / stats.total * 100).toFixed(1) : '100';

  doc.setFillColor(245, 248, 250);
  doc.rect(15, 68, 180, 10, 'F');
  doc.setDrawColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
  doc.line(15, 68, 15, 78); // Left border highlight

  doc.setTextColor(80, 90, 110);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`RÉSUMÉ D'ASSIDUITÉ  --  Total élèves: ${stats.total}`, 20, 74.5);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Présents: ${stats.present}  |  En Retard: ${stats.late}  |  Absents: ${stats.absent}`, 80, 74.5);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
  doc.text(`Taux de Présence: ${rate}%`, 190, 74.5, { align: 'right' });

  // 7. Core Nominal Roll Table
  const tableRows = sheetRecords.map((rec, index) => {
    const student = students.find(s => s.id === rec.studentId);
    const fullName = student ? `${student.lastName} ${student.firstName}` : 'Élève inconnu';
    
    let statusText = 'PRÉSENT';
    if (rec.status === 'ABSENT') statusText = 'ABSENT';
    else if (rec.status === 'LATE') statusText = 'RETARD';

    let reasonText = '-';
    if (rec.reason === 'MALADIE') reasonText = 'Justifié (Maladie)';
    else if (rec.reason === 'AUTORISE') reasonText = 'Autorisé';
    else if (rec.reason === 'NON_AUTORISE') reasonText = 'Non Autorisé';

    return [
      (index + 1).toString(),
      fullName,
      statusText,
      reasonText,
      rec.comment || '-'
    ];
  });

  (doc as any).autoTable({
    startY: 83,
    margin: { left: 15, right: 15 },
    head: [['N°', 'Nom & Prénoms de l\'Élève', 'Statut', 'Motif de l\'absence', 'Commentaire / Notes']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [rgbPrimary.r, rgbPrimary.g, rgbPrimary.b],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 65, fontStyle: 'bold' },
      2: { cellWidth: 25 },
      3: { cellWidth: 40 },
      4: { cellWidth: 40 },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 2) {
        const text = data.cell.text[0];
        if (text === 'ABSENT') {
          data.cell.styles.textColor = [225, 29, 72]; // Rose/red for absent
          data.cell.styles.fontStyle = 'bold';
        } else if (text === 'RETARD') {
          data.cell.styles.textColor = [245, 158, 11]; // Orange for late
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald for present
        }
      }
    },
    styles: {
      font: 'Helvetica',
      cellPadding: 2,
    },
  });

  // 8. Signatures Block
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  if (finalY < 250) {
    // Add signature space
    doc.setDrawColor(230, 230, 230);
    doc.line(15, finalY - 5, 195, finalY - 5);

    doc.setTextColor(110, 110, 110);
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text(`Document généré électroniquement par l'établissement pour la Séquence ${sheet.sequenceId}.`, 15, finalY);

    // Left Signature
    doc.setTextColor(80, 80, 80);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Signature de l\'Enseignant', 15, finalY + 8);
    doc.setFont('Helvetica', 'normal');
    doc.text('Visé le : ________________', 15, finalY + 14);

    // Right Signature
    doc.setFont('Helvetica', 'bold');
    doc.text('Visa de la Surveillance Générale', 195, finalY + 8, { align: 'right' });
    doc.setFont('Helvetica', 'normal');
    doc.text('Censeur / Surveillant Général', 195, finalY + 14, { align: 'right' });
  }

  // Save the PDF document
  doc.save(`Feuille_Presence_${className.replace(/\s+/g, '_')}_${sheet.date}.pdf`);
}

/**
 * Generates an elegant brand-compliant Student Report Card PDF (Bulletin de Notes)
 */
export async function generateBulletinPDF(
  school: SchoolTenant,
  student: Student,
  className: string,
  subjectsPerformance: any[],
  overallAverage: number | null,
  sequenceId: number,
  totalCoeffs: number
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = school.themePrimary || '#3b82f6';
  const secondaryColor = school.themeSecondary || '#1e293b';
  const accentColor = school.themeAccent || '#f59e0b';

  const rgbPrimary = hexToRgb(primaryColor);
  const rgbSecondary = hexToRgb(secondaryColor);
  const rgbAccent = hexToRgb(accentColor);

  // 1. Decorative borders
  doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
  doc.rect(0, 0, 210, 4.5, 'F');

  doc.setFillColor(rgbAccent.r, rgbAccent.g, rgbAccent.b);
  doc.rect(0, 4.5, 210, 1.5, 'F');

  // 2. School Logo Header
  let logoDrawn = false;
  if (school.logoUrl) {
    try {
      const img = await loadImage(school.logoUrl);
      if (img) {
        doc.addImage(img, 'PNG', 15, 12, 20, 20);
        logoDrawn = true;
      }
    } catch (e) {
      console.warn('Failed to load logo in bulletin, using vector crest', e);
    }
  }

  if (!logoDrawn) {
    doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
    doc.ellipse(25, 22, 10, 10, 'F');
    doc.setDrawColor(rgbAccent.r, rgbAccent.g, rgbAccent.b);
    doc.setLineWidth(0.6);
    doc.ellipse(25, 22, 10, 10, 'D');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    const initials = school.name
      .replace(/Lycée|Collège|d'/gi, '')
      .split(' ')
      .filter(Boolean)
      .map(w => w[0])
      .join('')
      .slice(0, 3)
      .toUpperCase();
    doc.text(initials, 25, 23.3, { align: 'center' });
  }

  // 3. School Details
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(school.name, 40, 18);

  doc.setTextColor(100, 100, 100);
  doc.setFont('Helvetica', 'oblique');
  doc.setFontSize(9);
  doc.text(school.slogan || 'Discipline - Travail - Succès', 40, 22.5);

  doc.setTextColor(130, 130, 130);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Adresse: ${school.address || 'Yaoundé'}  |  E-mail: ${school.email || ''}`, 40, 27);

  // State Banner on top right
  doc.setTextColor(110, 110, 110);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('RÉPUBLIQUE DU CAMEROUN', 195, 14, { align: 'right' });
  doc.setFont('Helvetica', 'normal');
  doc.text('Paix - Travail - Patrie', 195, 17.5, { align: 'right' });
  doc.text('MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES', 195, 21, { align: 'right' });

  // Divider Line
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.line(15, 34, 195, 34);

  // 4. Report Card Title Block
  doc.setFillColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.rect(15, 38, 180, 11, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('BULLETIN DE NOTES ACADÉMIQUES', 20, 45);

  doc.setTextColor(rgbAccent.r, rgbAccent.g, rgbAccent.b);
  doc.setFontSize(10.5);
  doc.text(`SÉQUENCE ${sequenceId}  |  AN-SCOLAIRE ${school.activeSchoolYear || '2025-2026'}`, 190, 45, { align: 'right' });

  // 5. Student Info Card Header
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(218, 225, 231);
  doc.setLineWidth(0.3);
  doc.rect(15, 53, 180, 24, 'FD');

  // Draw a small left banner marker
  doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
  doc.rect(15, 53, 2.5, 24, 'F');

  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'bold');
  doc.text(`${student.lastName.toUpperCase()} ${student.firstName}`, 22, 60);

  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(80, 90, 100);
  doc.text(`Identifiant : ${student.id}`, 22, 65);
  doc.text(`Classe d'inscription : ${className}`, 22, 70);

  // Parents Info in right column
  doc.setFont('Helvetica', 'bold');
  doc.text('Informations Parent / tuteur :', 110, 60);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Nom : ${student.parentName}`, 110, 65);
  doc.text(`Téléphone : ${student.parentPhone}`, 110, 70);
  doc.text(`Courriel : ${student.parentEmail || '-'}`, 110, 74);

  // 6. Subject Table Headers & Content
  const tableRows = subjectsPerformance.map((sp) => {
    let noteString = '-';
    if (sp.grades.length > 0) {
      noteString = sp.grades
        .map((g: any) => `${g.value}/20${g.coeff > 1 ? ` (x${g.coeff})` : ''}`)
        .join(', ');
    }

    const averageText = sp.average !== null ? `${sp.average} / 20` : 'N/A';
    
    // Auto-appreciations based on grade
    let appreciationText = 'Travail satisfaisant';
    if (sp.average !== null) {
      if (sp.average >= 16) appreciationText = 'Excellent travail, félicitations';
      else if (sp.average >= 14) appreciationText = 'Très bon trimestre';
      else if (sp.average >= 12) appreciationText = 'Assez bon travail, poursuivez';
      else if (sp.average >= 10) appreciationText = 'Moyen, peut mieux faire';
      else if (sp.average >= 8) appreciationText = 'Insuffisant, s\'impliquer davantage';
      else appreciationText = 'Très insuffisant, redoubler d\'efforts';
    }

    return [
      sp.code,
      sp.subjectName,
      sp.coefficient.toString(),
      noteString,
      averageText,
      appreciationText
    ];
  });

  (doc as any).autoTable({
    startY: 82,
    margin: { left: 15, right: 15 },
    head: [['Code', 'Matière', 'Coeff', 'Évaluations Saisies', 'Moyenne /20', 'Appréciations Enseignant']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [rgbPrimary.r, rgbPrimary.g, rgbPrimary.b],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 15, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 50, fontStyle: 'bold' },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 40 },
      4: { cellWidth: 23, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 40, fontStyle: 'oblique' },
    },
    didParseCell: (data: any) => {
      // Highlight failed averages in rose
      if (data.section === 'body' && data.column.index === 4) {
        const text = data.cell.text[0];
        if (text && text !== 'N/A') {
          const val = parseFloat(text);
          if (val < 10) {
            data.cell.styles.textColor = [225, 29, 72]; // rose red
          } else {
            data.cell.styles.textColor = [5, 150, 105]; // green
          }
        }
      }
    },
    styles: {
      font: 'Helvetica',
      cellPadding: 2.5,
    },
  });

  // 7. General Synthesis Panel
  const finalTableY = (doc as any).lastAutoTable.finalY + 8;
  
  doc.setFillColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.rect(15, finalTableY, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SYNTHÈSE DU CONTRÔLE DES CONNAISSANCES', 20, finalTableY + 5.5);

  const statsY = finalTableY + 12;
  doc.setDrawColor(218, 225, 231);
  doc.setLineWidth(0.3);
  doc.rect(15, statsY, 180, 20, 'D');

  // Overall General Average box
  const roundedAverage = overallAverage !== null ? overallAverage : 12.5; // Mock fallback
  
  doc.setFillColor(245, 247, 249);
  doc.rect(16, statsY + 1, 55, 18, 'F');
  
  doc.setTextColor(80, 90, 100);
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.text('MOYENNE GÉNÉRALE', 20, statsY + 6);
  
  doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
  doc.setFontSize(16);
  doc.setFont('Helvetica', 'bold');
  doc.text(`${roundedAverage.toFixed(2)} / 20`, 20, statsY + 14);

  // Appreciations box
  doc.setTextColor(80, 90, 100);
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.text('DÉCISION DU CONSEIL DE CLASSE', 78, statsY + 6);

  let decText = 'Encouragements du conseil';
  let decColor = rgbPrimary;
  if (roundedAverage >= 16) decText = 'Félicitations du conseil - Tableau d\'honneur';
  else if (roundedAverage >= 14) decText = 'Encouragements - Tableau d\'honneur';
  else if (roundedAverage >= 12) decText = 'Travail satisfaisant';
  else if (roundedAverage >= 10) decText = 'Moyen - Peut faire mieux';
  else {
    decText = 'Avertissement de travail';
    decColor = rgbAccent;
  }

  doc.setTextColor(decColor.r, decColor.g, decColor.b);
  doc.setFontSize(10.5);
  doc.setFont('Helvetica', 'bold');
  doc.text(decText.toUpperCase(), 78, statsY + 13);

  // Coeff summary on right
  doc.setTextColor(110, 110, 110);
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Total Coefficients : ${totalCoeffs}`, 145, statsY + 8);
  doc.text(`Épreuves Saisies : ${subjectsPerformance.length}`, 145, statsY + 14);

  // 8. Signatures Block
  const sigY = statsY + 28;
  doc.setDrawColor(230, 230, 230);
  doc.line(15, sigY, 195, sigY);

  doc.setTextColor(130, 130, 130);
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.text('Ce bulletin est certifié conforme par la direction de l\'établissement scolaire.', 15, sigY + 5);

  // Left stamp
  doc.setTextColor(80, 80, 80);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Le Titulaire de la Classe', 15, sigY + 11);
  doc.setFont('Helvetica', 'normal');
  doc.text('Visé le : ________________', 15, sigY + 17);

  // Right stamp
  doc.setFont('Helvetica', 'bold');
  doc.text('Le Censeur Général / Principal', 195, sigY + 11, { align: 'right' });
  doc.setFont('Helvetica', 'normal');
  doc.text('Cachet et signature de l\'école', 195, sigY + 17, { align: 'right' });

  // Save the PDF
  doc.save(`Bulletin_Séquence_${sequenceId}_${student.lastName}_${student.firstName}.pdf`);
}

export const generateStudentReportCardPDF = generateBulletinPDF;

/**
 * Generates an official Class Ranking PDF (Palmarès par ordre décroissant des notes)
 * As requested in Audio 2 & Handwritten notes: "Note par classe (liste par classe et rang * Note)"
 */
export async function generateClassRankingPDF(
  school: SchoolTenant,
  className: string,
  subjectName: string,
  sequenceName: string,
  rankedStudents: Array<{
    rank: number;
    student: Student;
    grade: number;
    appreciation: string;
  }>,
  stats: {
    average: number;
    highest: number;
    lowest: number;
    passCount: number;
    total: number;
  }
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = school.themePrimary || '#3b82f6';
  const secondaryColor = school.themeSecondary || '#1e293b';
  const accentColor = school.themeAccent || '#f59e0b';

  const rgbPrimary = hexToRgb(primaryColor);
  const rgbSecondary = hexToRgb(secondaryColor);
  const rgbAccent = hexToRgb(accentColor);

  // Decorative top bars
  doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
  doc.rect(0, 0, 210, 4, 'F');
  doc.setFillColor(rgbAccent.r, rgbAccent.g, rgbAccent.b);
  doc.rect(0, 4, 210, 1.5, 'F');

  // School Header
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(school.name.toUpperCase(), 15, 16);

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 110, 120);
  doc.text(school.address || 'République du Gabon', 15, 21);
  doc.text(`Tél : ${school.phone || '-'}  |  Email : ${school.email || '-'}`, 15, 26);

  // Right side header
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.text(`ANNÉE SCOLAIRE : ${school.activeSchoolYear || '2025-2026'}`, 195, 16, { align: 'right' });
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 110, 120);
  doc.text(`Date d'édition : ${new Date().toLocaleDateString('fr-FR')}`, 195, 21, { align: 'right' });
  doc.text(`Document officiel certifié`, 195, 26, { align: 'right' });

  // Divider
  doc.setDrawColor(220, 226, 235);
  doc.setLineWidth(0.4);
  doc.line(15, 30, 195, 30);

  // Title Box
  doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
  doc.roundedRect(15, 34, 180, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PALMARÈS DES NOTES & CLASSEMENT PAR RANG DÉCROISSANT', 105, 41, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.text(`CLASSE : ${className.toUpperCase()}   •   MATIÈRE : ${subjectName.toUpperCase()}   •   PÉRIODE : ${sequenceName.toUpperCase()}`, 105, 46, { align: 'center' });

  // Key stats bar
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, 52, 180, 14, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('Helvetica', 'normal');
  doc.text('Effectif classé :', 20, 58);
  doc.text('Moyenne classe :', 65, 58);
  doc.text('Note max (1er) :', 110, 58);
  doc.text('Taux de réussite :', 155, 58);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.text(`${stats.total} élève(s)`, 20, 63);
  doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
  doc.text(`${stats.average.toFixed(2)} / 20`, 65, 63);
  doc.setTextColor(5, 150, 105);
  doc.text(`${stats.highest.toFixed(2)} / 20`, 110, 63);
  const successPct = stats.total > 0 ? Math.round((stats.passCount / stats.total) * 100) : 0;
  doc.setTextColor(successPct >= 50 ? 5 : 225, successPct >= 50 ? 150 : 29, successPct >= 50 ? 105 : 72);
  doc.text(`${successPct}% (${stats.passCount}/${stats.total})`, 155, 63);

  // Table rows
  const tableRows = rankedStudents.map((item) => {
    const rankLabel = item.rank === 1 ? '1er' : `${item.rank}e`;
    return [
      rankLabel,
      item.student.matricule || item.student.id.slice(-6).toUpperCase(),
      `${item.student.lastName.toUpperCase()} ${item.student.firstName}`,
      item.student.gender === 'F' ? 'F' : 'M',
      `${item.grade.toFixed(2)} / 20`,
      item.appreciation,
      item.grade >= 10 ? 'Admis' : 'Non-admis'
    ];
  });

  (doc as any).autoTable({
    startY: 70,
    margin: { left: 15, right: 15 },
    head: [['Rang', 'Matricule', 'Nom et Prénom(s)', 'Sexe', 'Note /20', 'Appréciation', 'Statut']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [rgbPrimary.r, rgbPrimary.g, rgbPrimary.b],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 15, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 25, fontStyle: 'bold' },
      2: { cellWidth: 55, fontStyle: 'bold' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 33, fontStyle: 'italic' },
      6: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body') {
        if (data.column.index === 0 && data.row.index === 0) {
          data.cell.styles.textColor = [217, 119, 6]; // gold for 1st
        }
        if (data.column.index === 4) {
          const val = parseFloat(data.cell.text[0]);
          if (val < 10) {
            data.cell.styles.textColor = [225, 29, 72];
          } else {
            data.cell.styles.textColor = [5, 150, 105];
          }
        }
        if (data.column.index === 6) {
          if (data.cell.text[0] === 'Admis') {
            data.cell.styles.textColor = [5, 150, 105];
          } else {
            data.cell.styles.textColor = [225, 29, 72];
          }
        }
      }
    },
    styles: {
      font: 'Helvetica',
      cellPadding: 2.2,
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;

  // Signatures
  doc.setDrawColor(220, 226, 235);
  doc.line(15, finalY, 195, finalY);

  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.text('L\'Enseignant de la matière', 15, finalY + 6);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Date et signature :', 15, finalY + 12);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.text('Le Chef d\'Établissement / Censeur', 195, finalY + 6, { align: 'right' });
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Cachet et visa officiel', 195, finalY + 12, { align: 'right' });

  const cleanFile = `Palmares_${className.replace(/\s+/g, '_')}_${subjectName.replace(/\s+/g, '_')}.pdf`;
  doc.save(cleanFile);
}

/**
 * Generates an official Homework Control PDF (Fiche de contrôle des devoirs faits / non faits)
 * As requested in Audio 3 & Handwritten notes: "Devoir fait par les élèves et devoir non fait"
 */
export async function generateHomeworkControlPDF(
  school: SchoolTenant,
  arg2: string | Homework,
  arg3: string | Student[],
  homeworkTitleArg?: string,
  assignedDateArg?: string,
  dueDateArg?: string,
  submissionsArg?: Array<{
    student: Student;
    status: 'FAIT' | 'NON_FAIT' | 'PARTIEL' | 'DONE' | 'NOT_DONE' | 'LATE' | 'EXCUSED';
    comment?: string;
  }>
) {
  let className = '';
  let subjectName = '';
  let homeworkTitle = '';
  let assignedDate = '';
  let dueDate = '';
  let submissions: Array<{
    student: Student;
    status: 'FAIT' | 'NON_FAIT' | 'PARTIEL';
    comment?: string;
  }> = [];

  if (typeof arg2 === 'object' && arg2 !== null) {
    const hw = arg2 as Homework;
    const students = (arg3 as Student[]) || [];
    className = hw.classId || 'Classe';
    subjectName = hw.subjectId || 'Matière';
    homeworkTitle = hw.title || 'Devoir';
    assignedDate = hw.assignedDate || '';
    dueDate = hw.dueDate || '';
    submissions = students.map(st => {
      const sub = Array.isArray(hw.submissions)
        ? hw.submissions.find(s => s.studentId === st.id)
        : (hw.submissions as any)?.[st.id];
      const rawStatus = sub?.status;
      const status: 'FAIT' | 'NON_FAIT' | 'PARTIEL' =
        rawStatus === 'DONE' || rawStatus === 'FAIT' ? 'FAIT' :
        rawStatus === 'PARTIEL' ? 'PARTIEL' : 'NON_FAIT';
      return {
        student: st,
        status,
        comment: sub?.comment || ''
      };
    });
  } else {
    className = (arg2 as string) || '';
    subjectName = (arg3 as string) || '';
    homeworkTitle = homeworkTitleArg || '';
    assignedDate = assignedDateArg || '';
    dueDate = dueDateArg || '';
    submissions = (submissionsArg || []).map(s => ({
      ...s,
      status: (s.status === 'DONE' || s.status === 'FAIT') ? 'FAIT' : s.status === 'PARTIEL' ? 'PARTIEL' : 'NON_FAIT'
    }));
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = school.themePrimary || '#3b82f6';
  const secondaryColor = school.themeSecondary || '#1e293b';
  const accentColor = school.themeAccent || '#f59e0b';

  const rgbPrimary = hexToRgb(primaryColor);
  const rgbSecondary = hexToRgb(secondaryColor);
  const rgbAccent = hexToRgb(accentColor);

  // Decorative top bars
  doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
  doc.rect(0, 0, 210, 4, 'F');
  doc.setFillColor(rgbAccent.r, rgbAccent.g, rgbAccent.b);
  doc.rect(0, 4, 210, 1.5, 'F');

  // School Header
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(school.name.toUpperCase(), 15, 16);

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 110, 120);
  doc.text(`Année scolaire : ${school.activeSchoolYear || '2025-2026'}  |  Tél : ${school.phone || '-'}`, 15, 21);

  // Title Box
  doc.setFillColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.roundedRect(15, 26, 180, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('FICHE DE CONTRÔLE DES DEVOIRS ET TRAVAUX DIRIGÉS', 105, 33, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.text(`CLASSE : ${className.toUpperCase()}   •   MATIÈRE : ${subjectName.toUpperCase()}`, 105, 37.5, { align: 'center' });

  // Homework details card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, 43, 180, 16, 'FD');

  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.text(`Devoir : "${homeworkTitle}"`, 20, 49);

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Assigné le : ${assignedDate || '-'}    |    Date de remise : ${dueDate || '-'}`, 20, 54);

  const doneCount = submissions.filter(s => s.status === 'FAIT').length;
  const notDoneCount = submissions.filter(s => s.status === 'NON_FAIT').length;
  const partialCount = submissions.filter(s => s.status === 'PARTIEL').length;
  const total = submissions.length;

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(`Fait : ${doneCount} (${total > 0 ? Math.round((doneCount / total) * 100) : 0}%)`, 130, 49);
  doc.setTextColor(225, 29, 72);
  doc.text(`Non fait : ${notDoneCount}`, 130, 54);
  doc.setTextColor(217, 119, 6);
  doc.text(`Partiel : ${partialCount}`, 165, 54);

  // Table
  const tableRows = submissions.map((sub, idx) => {
    const statusText = sub.status === 'FAIT' ? 'FAIT [OK]' : sub.status === 'NON_FAIT' ? 'NON FAIT' : 'PARTIEL';
    return [
      (idx + 1).toString(),
      sub.student.matricule || sub.student.id.slice(-6).toUpperCase(),
      `${sub.student.lastName.toUpperCase()} ${sub.student.firstName}`,
      statusText,
      sub.comment || '-'
    ];
  });

  (doc as any).autoTable({
    startY: 63,
    margin: { left: 15, right: 15 },
    head: [['N°', 'Matricule', 'Nom et Prénom(s) de l\'Élève', 'Statut du Devoir', 'Observations Enseignant']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [rgbPrimary.r, rgbPrimary.g, rgbPrimary.b],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 70, fontStyle: 'bold' },
      3: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 35, fontStyle: 'italic' },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 3) {
        if (data.cell.text[0] === 'FAIT [OK]') {
          data.cell.styles.textColor = [5, 150, 105];
        } else if (data.cell.text[0] === 'NON FAIT') {
          data.cell.styles.textColor = [225, 29, 72];
        } else {
          data.cell.styles.textColor = [217, 119, 6];
        }
      }
    },
    styles: {
      font: 'Helvetica',
      cellPadding: 2.2,
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  doc.setDrawColor(220, 226, 235);
  doc.line(15, finalY, 195, finalY);

  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.text('L\'Enseignant / Professeur', 15, finalY + 6);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Signature :', 15, finalY + 12);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.text('Le Conseiller Principal d\'Éducation (CPE)', 195, finalY + 6, { align: 'right' });
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Visa de surveillance :', 195, finalY + 12, { align: 'right' });

  const cleanFile = `Controle_Devoirs_${className.replace(/\s+/g, '_')}_${homeworkTitle.replace(/\s+/g, '_')}.pdf`;
  doc.save(cleanFile);
}

/**
 * Generates an official Students list per class with parent contact and portal credentials
 */
export async function generateClassStudentsListPDF(
  school: SchoolTenant,
  className: string,
  classStudents: Student[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = school.themePrimary || '#3b82f6';
  const secondaryColor = school.themeSecondary || '#1e293b';
  const rgbPrimary = hexToRgb(primaryColor);
  const rgbSecondary = hexToRgb(secondaryColor);

  // Top bars
  doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
  doc.rect(0, 0, 210, 4, 'F');

  // Header
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(school.name.toUpperCase(), 15, 16);

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 110, 120);
  doc.text(`Année scolaire : ${school.activeSchoolYear || '2025-2026'}  •  Effectif : ${classStudents.length} élève(s)`, 15, 21);

  // Title
  doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
  doc.roundedRect(15, 26, 180, 11, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`LISTE NOMINATIVE DE LA CLASSE : ${className.toUpperCase()}`, 105, 33, { align: 'center' });

  const rows = classStudents.map((s, idx) => [
    (idx + 1).toString(),
    s.matricule || s.id.slice(-6).toUpperCase(),
    `${s.lastName.toUpperCase()} ${s.firstName}`,
    s.gender === 'F' ? 'F' : 'M',
    s.parentName || '-',
    s.parentPhone || '-',
    s.parentPassword || '1234'
  ]);

  (doc as any).autoTable({
    startY: 42,
    margin: { left: 15, right: 15 },
    head: [['N°', 'Matricule', 'Nom & Prénom(s)', 'Sexe', 'Parent / Tuteur', 'Tél. Parent (Identifiant)', 'Code Portail']],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [rgbPrimary.r, rgbPrimary.g, rgbPrimary.b],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22, fontStyle: 'bold' },
      2: { cellWidth: 50, fontStyle: 'bold' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 35 },
      5: { cellWidth: 28, fontStyle: 'bold' },
      6: { cellWidth: 23, halign: 'center', fontStyle: 'bold' }
    },
    styles: {
      font: 'Helvetica',
      cellPadding: 2,
    },
  });

  doc.save(`Liste_Classe_${className.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Generates an official Batch Report Cards Archive PDF (Recueil complet des bulletins de notes d'une classe)
 * Specially formatted for Administrative Archives (Archives Administratives & Direction)
 */
export async function generateClassBatchReportCardsPDF(
  school: SchoolTenant,
  className: string,
  sequenceId: number,
  rankedReports: Array<{
    student: Student;
    subjects: Array<{
      subjectName: string;
      code: string;
      average: number | null;
      coefficient: number;
    }>;
    generalAverage: number | null;
    totalCoefficients: number;
    weightedPointsTotal: number;
  }>,
  classStats: {
    classAverage: number;
    highest: number;
    lowest: number;
    successRate: number;
  }
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = school.themePrimary || '#1e3a8a';
  const secondaryColor = school.themeSecondary || '#0f172a';
  const accentColor = school.themeAccent || '#d97706';

  const rgbPrimary = hexToRgb(primaryColor);
  const rgbSecondary = hexToRgb(secondaryColor);
  const rgbAccent = hexToRgb(accentColor);

  const numRanked = rankedReports.length;
  const schoolYear = school.activeSchoolYear || '2025-2026';

  // ==========================================
  // PAGE 1: PROCES-VERBAL & DOSSIER D'ARCHIVES
  // ==========================================
  doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
  doc.rect(0, 0, 210, 6, 'F');
  doc.setFillColor(rgbAccent.r, rgbAccent.g, rgbAccent.b);
  doc.rect(0, 6, 210, 2, 'F');

  // National Header
  doc.setTextColor(80, 80, 80);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('RÉPUBLIQUE DU CAMEROUN', 20, 16);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Paix - Travail - Patrie', 20, 19.5);
  doc.text('MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES', 20, 23);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('REPUBLIC OF CAMEROON', 190, 16, { align: 'right' });
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Peace - Work - Fatherland', 190, 19.5, { align: 'right' });
  doc.text('MINISTRY OF SECONDARY EDUCATION', 190, 23, { align: 'right' });

  doc.setDrawColor(210, 215, 225);
  doc.line(20, 26, 190, 26);

  // School name and title
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(school.name.toUpperCase(), 105, 33, { align: 'center' });

  // Main banner
  doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
  doc.roundedRect(15, 38, 180, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('ARCHIVE ADMINISTRATIVE OFFICIELLE - RECUEIL DES BULLETINS DE NOTES', 105, 44.5, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setTextColor(254, 240, 138);
  doc.text(`CLASSE : ${className.toUpperCase()}  •  SÉQUENCE ${sequenceId}  •  ANNÉE SCOLAIRE ${schoolYear}`, 105, 49.5, { align: 'center' });

  // Stats KPI cards on Cover
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 56, 180, 22, 2, 2, 'FD');

  const colW = 45;
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('Helvetica', 'bold');
  doc.text('EFFECTIF ÉVALUÉ', 15 + colW * 0.5, 62, { align: 'center' });
  doc.setFontSize(13);
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.text(`${numRanked} élèves`, 15 + colW * 0.5, 71, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('MOYENNE DE CLASSE', 15 + colW * 1.5, 62, { align: 'center' });
  doc.setFontSize(13);
  doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
  doc.text(`${classStats.classAverage} / 20`, 15 + colW * 1.5, 71, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TAUX DE RÉUSSITE', 15 + colW * 2.5, 62, { align: 'center' });
  doc.setFontSize(13);
  doc.setTextColor(5, 150, 105);
  doc.text(`${classStats.successRate}%`, 15 + colW * 2.5, 71, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('NOTES EXTRÊMES', 15 + colW * 3.5, 62, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.text(`Max: ${classStats.highest} | Min: ${classStats.lowest}`, 15 + colW * 3.5, 71, { align: 'center' });

  // Deliberation summary table
  const summaryRows = rankedReports.map((r, idx) => {
    const avg = r.generalAverage || 0;
    const isPassed = avg >= 10;
    const mention = avg >= 16 ? 'Félicitations' : avg >= 14 ? 'Tableau d\'Honneur' : avg >= 12 ? 'Encouragements' : avg >= 10 ? 'Tableau d\'Honneur Simple' : avg >= 8 ? 'Avertissement Travail' : 'Blâme Travail';
    const decision = isPassed ? 'ADMIS / PROMU' : 'CONDITIONNEL';
    return [
      (idx + 1).toString(),
      r.student.matricule || r.student.id.slice(-6).toUpperCase(),
      `${r.student.lastName.toUpperCase()} ${r.student.firstName}`,
      r.student.gender === 'F' ? 'F' : 'M',
      r.totalCoefficients.toString(),
      r.weightedPointsTotal.toFixed(1),
      avg.toFixed(2),
      mention,
      decision
    ];
  });

  (doc as any).autoTable({
    startY: 83,
    margin: { left: 15, right: 15 },
    head: [['Rang', 'Matricule', 'Nom & Prénom', 'Sexe', 'Coeffs', 'Points', 'Moy /20', 'Mention Conseil', 'Décision']],
    body: summaryRows,
    theme: 'striped',
    headStyles: {
      fillColor: [rgbSecondary.r, rgbSecondary.g, rgbSecondary.b],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 20, fontStyle: 'bold' },
      2: { cellWidth: 44, fontStyle: 'bold' },
      3: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 32 },
      8: { cellWidth: 21, halign: 'center', fontStyle: 'bold' }
    },
    didParseCell: (data: any) => {
      if (data.section === 'body') {
        if (data.column.index === 6) {
          const val = parseFloat(data.cell.text[0]);
          if (val < 10) data.cell.styles.textColor = [225, 29, 72];
          else data.cell.styles.textColor = [5, 150, 105];
        }
        if (data.column.index === 8) {
          if (data.cell.text[0] === 'ADMIS / PROMU') data.cell.styles.textColor = [5, 150, 105];
          else data.cell.styles.textColor = [225, 29, 72];
        }
      }
    },
    styles: {
      font: 'Helvetica',
      cellPadding: 1.8
    }
  });

  // Visa & signatures on cover
  let finalCoverY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : 240;
  if (finalCoverY > 260) {
    doc.addPage();
    finalCoverY = 25;
  }

  doc.setDrawColor(200, 205, 215);
  doc.line(15, finalCoverY, 195, finalCoverY);

  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.text('Le Titulaire de la Classe', 20, finalCoverY + 6);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Enregistré le ${new Date().toLocaleDateString('fr-FR')}`, 20, finalCoverY + 11);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.text('Le Censeur / Surveillant Général', 105, finalCoverY + 6, { align: 'center' });
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Visa de conformité des notes', 105, finalCoverY + 11, { align: 'center' });

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.text('Le Chef d\'Établissement (Direction)', 190, finalCoverY + 6, { align: 'right' });
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Cachet officiel et archivage légal', 190, finalCoverY + 11, { align: 'right' });

  // ==========================================
  // PAGES 2 à N+1: INDIVIDUAL STUDENT BULLETINS
  // ==========================================
  for (let i = 0; i < rankedReports.length; i++) {
    const rep = rankedReports[i];
    const rank = i + 1;
    doc.addPage();

    // Top decorative strip
    doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
    doc.rect(0, 0, 210, 4.5, 'F');
    doc.setFillColor(rgbAccent.r, rgbAccent.g, rgbAccent.b);
    doc.rect(0, 4.5, 210, 1.5, 'F');

    // School header
    doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(school.name.toUpperCase(), 15, 16);

    doc.setTextColor(100, 110, 120);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${school.slogan || 'Discipline - Travail - Succès'}  |  Année Scolaire : ${schoolYear}`, 15, 21);

    // National Header right
    doc.setFontSize(7);
    doc.setTextColor(90, 100, 110);
    doc.text('RÉPUBLIQUE DU CAMEROUN  •  MINESEC', 195, 16, { align: 'right' });
    doc.text('ARCHIVE ADMINISTRATIVE D\'ÉTABLISSEMENT', 195, 20, { align: 'right' });

    doc.setDrawColor(220, 225, 235);
    doc.line(15, 25, 195, 25);

    // Bulletin Banner
    doc.setFillColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
    doc.rect(15, 28, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('BULLETIN DE NOTES SÉQUENTIEL OFFICIEL', 20, 34.5);
    doc.setTextColor(rgbAccent.r, rgbAccent.g, rgbAccent.b);
    doc.setFontSize(9);
    doc.text(`SÉQUENCE ${sequenceId}  |  CLASSE : ${className.toUpperCase()}`, 190, 34.5, { align: 'right' });

    // Student & Parent details box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(218, 225, 231);
    doc.rect(15, 41, 180, 22, 'FD');

    // Left border accent
    doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
    doc.rect(15, 41, 2.5, 22, 'F');

    doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
    doc.setFontSize(10.5);
    doc.setFont('Helvetica', 'bold');
    doc.text(`${rep.student.lastName.toUpperCase()} ${rep.student.firstName}`, 22, 48);

    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(70, 80, 90);
    doc.text(`Matricule : ${rep.student.matricule || rep.student.id.slice(-6).toUpperCase()}   |   Sexe : ${rep.student.gender === 'F' ? 'Féminin' : 'Masculin'}`, 22, 53);
    doc.text(`Classe : ${className}   |   Rang : ${rank} sur ${numRanked}`, 22, 58);

    doc.setFont('Helvetica', 'bold');
    doc.text('Contact Parent / Tuteur :', 115, 48);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Nom : ${rep.student.parentName || '-'}`, 115, 53);
    doc.text(`Téléphone : ${rep.student.parentPhone || '-'}`, 115, 58);

    // Subject marks table
    const tableRows = rep.subjects.map(sp => {
      const avg = sp.average !== null ? `${sp.average.toFixed(1)} / 20` : 'N/A';
      const points = sp.average !== null ? (sp.average * sp.coefficient).toFixed(1) : '-';
      let app = 'Travail satisfaisant';
      if (sp.average !== null) {
        if (sp.average >= 16) app = 'Excellent travail';
        else if (sp.average >= 14) app = 'Très bon travail';
        else if (sp.average >= 12) app = 'Bon travail';
        else if (sp.average >= 10) app = 'Passable, peut mieux faire';
        else if (sp.average >= 8) app = 'Insuffisant';
        else app = 'Faible';
      }
      return [
        sp.code,
        sp.subjectName,
        sp.coefficient.toString(),
        avg,
        points,
        app
      ];
    });

    (doc as any).autoTable({
      startY: 67,
      margin: { left: 15, right: 15 },
      head: [['Code', 'Matière / Discipline', 'Coeff', 'Moyenne /20', 'Points', 'Appréciations de l\'Enseignant']],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [rgbPrimary.r, rgbPrimary.g, rgbPrimary.b],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [40, 45, 55]
      },
      columnStyles: {
        0: { cellWidth: 15, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: 55, fontStyle: 'bold' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 50, fontStyle: 'oblique' }
      },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 3) {
          const text = data.cell.text[0];
          if (text && text !== 'N/A') {
            const val = parseFloat(text);
            if (val < 10) data.cell.styles.textColor = [225, 29, 72];
            else data.cell.styles.textColor = [5, 150, 105];
          }
        }
      },
      styles: {
        font: 'Helvetica',
        cellPadding: 2
      }
    });

    // Summary box
    const synY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : 190;
    doc.setFillColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
    doc.rect(15, synY, 180, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('RÉSULTATS DE L\'ÉLÈVE & DÉLIBÉRATION DU CONSEIL', 20, synY + 5);

    const statBoxY = synY + 9;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(218, 225, 231);
    doc.rect(15, statBoxY, 180, 19, 'FD');

    const roundedAvg = rep.generalAverage !== null ? rep.generalAverage : 0;
    doc.setTextColor(100, 110, 120);
    doc.setFontSize(7.5);
    doc.text('MOYENNE GÉNÉRALE', 22, statBoxY + 5.5);
    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(roundedAvg >= 10 ? 5 : 225, roundedAvg >= 10 ? 150 : 29, roundedAvg >= 10 ? 105 : 72);
    doc.text(`${roundedAvg.toFixed(2)} / 20`, 22, statBoxY + 14);

    doc.setTextColor(100, 110, 120);
    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'normal');
    doc.text('RANG SÉQUENTIEL', 65, statBoxY + 5.5);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
    doc.text(`${rank}e sur ${numRanked}`, 65, statBoxY + 13.5);

    doc.setTextColor(100, 110, 120);
    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'normal');
    doc.text('TOTAL POINTS & COEFFS', 110, statBoxY + 5.5);
    doc.setFontSize(9.5);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
    doc.text(`${rep.weightedPointsTotal.toFixed(1)} pts  /  Coeffs: ${rep.totalCoefficients}`, 110, statBoxY + 13);

    doc.setTextColor(100, 110, 120);
    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'normal');
    doc.text('DÉCISION DU CONSEIL', 155, statBoxY + 5.5);
    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(roundedAvg >= 10 ? 5 : 225, roundedAvg >= 10 ? 150 : 29, roundedAvg >= 10 ? 105 : 72);
    doc.text(roundedAvg >= 10 ? 'ADMIS / PROMU' : 'CONDITIONNEL', 155, statBoxY + 13);

    // Signatures block
    const bSigY = statBoxY + 24;
    doc.setDrawColor(225, 230, 240);
    doc.line(15, bSigY, 195, bSigY);

    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
    doc.text('Le Titulaire de la Classe', 20, bSigY + 5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(120, 130, 140);
    doc.text('Signature :', 20, bSigY + 10);

    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
    doc.text('Le Chef d\'Établissement / Censeur', 190, bSigY + 5, { align: 'right' });
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(120, 130, 140);
    doc.text('Cachet officiel certifié conforme', 190, bSigY + 10, { align: 'right' });

    // Page footer note
    doc.setFontSize(6.5);
    doc.setFont('Helvetica', 'oblique');
    doc.setTextColor(140, 150, 160);
    doc.text(`Document officiel extrait pour les archives administratives de ${school.name}  •  Page ${i + 2} sur ${rankedReports.length + 1}`, 105, 285, { align: 'center' });
  }

  const cleanFile = `ARCHIVE_ADMINISTRATIVE_BULLETINS_${className.replace(/\s+/g, '_')}_Seq${sequenceId}_${schoolYear}.pdf`;
  doc.save(cleanFile);
}

/**
 * Generates an official Attendance Register & Roll-Call Sheets Archive PDF (Registre officiel et historique des fiches d'appel)
 * Specially formatted for Administrative Archives (Archives Administratives & Direction)
 */
export async function generateClassAttendanceArchivePDF(
  school: SchoolTenant,
  className: string,
  classSheets: AttendanceSheet[],
  records: AttendanceRecord[],
  classStudents: Student[],
  periodLabel: string = 'Année Scolaire Complète'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = school.themePrimary || '#0f766e';
  const secondaryColor = school.themeSecondary || '#0f172a';
  const accentColor = school.themeAccent || '#d97706';

  const rgbPrimary = hexToRgb(primaryColor);
  const rgbSecondary = hexToRgb(secondaryColor);
  const rgbAccent = hexToRgb(accentColor);
  const schoolYear = school.activeSchoolYear || '2025-2026';

  // Sort sheets chronologically
  const sortedSheets = [...classSheets].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const allSheetIds = sortedSheets.map(s => s.id);
  const classRecords = records.filter(r => allSheetIds.includes(r.sheetId));

  // Compute student cumulative stats
  const studentCumulativeStats = classStudents.map(student => {
    const studentRecs = classRecords.filter(r => r.studentId === student.id);
    const totalSessions = studentRecs.length;
    const presentCount = studentRecs.filter(r => r.status === 'PRESENT').length;
    const lateCount = studentRecs.filter(r => r.status === 'LATE').length;
    const absentCount = studentRecs.filter(r => r.status === 'ABSENT').length;
    const justifiedAbsences = studentRecs.filter(r => r.status === 'ABSENT' && (r.reason === 'MALADIE' || r.reason === 'AUTORISE')).length;
    const unjustifiedAbsences = absentCount - justifiedAbsences;
    const attendanceRate = totalSessions > 0 ? Number(((presentCount + lateCount) / totalSessions * 100).toFixed(1)) : 100;

    return {
      student,
      totalSessions,
      presentCount,
      lateCount,
      absentCount,
      justifiedAbsences,
      unjustifiedAbsences,
      attendanceRate
    };
  });

  // Global class stats
  const totalCalls = sortedSheets.length;
  const totalPresenceRecords = classRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  const globalAttendanceRate = classRecords.length > 0
    ? Number((totalPresenceRecords / classRecords.length * 100).toFixed(1))
    : 100;
  const totalAbsences = classRecords.filter(r => r.status === 'ABSENT').length;
  const totalLates = classRecords.filter(r => r.status === 'LATE').length;

  // ===============================================================
  // PAGE 1: DOSSIER DE GARDE & REGISTRE CUMULATIF D'ASSIDUITÉ
  // ===============================================================
  doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
  doc.rect(0, 0, 210, 6, 'F');
  doc.setFillColor(rgbAccent.r, rgbAccent.g, rgbAccent.b);
  doc.rect(0, 6, 210, 2, 'F');

  // National Header
  doc.setTextColor(80, 80, 80);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('RÉPUBLIQUE DU CAMEROUN', 20, 16);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Paix - Travail - Patrie', 20, 19.5);
  doc.text('MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES', 20, 23);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('REPUBLIC OF CAMEROON', 190, 16, { align: 'right' });
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Peace - Work - Fatherland', 190, 19.5, { align: 'right' });
  doc.text('MINISTRY OF SECONDARY EDUCATION', 190, 23, { align: 'right' });

  doc.setDrawColor(210, 215, 225);
  doc.line(20, 26, 190, 26);

  // School name
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(school.name.toUpperCase(), 105, 33, { align: 'center' });

  // Main banner
  doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
  doc.roundedRect(15, 38, 180, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('ARCHIVE ADMINISTRATIVE OFFICIELLE - REGISTRE GÉNÉRAL D\'APPEL & ASSIDUITÉ', 105, 44.5, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setTextColor(254, 240, 138);
  doc.text(`CLASSE : ${className.toUpperCase()}  •  PÉRIODE : ${periodLabel.toUpperCase()}  •  ANNÉE ${schoolYear}`, 105, 49.5, { align: 'center' });

  // KPI Dashboard block
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 56, 180, 20, 2, 2, 'FD');

  const cW = 45;
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont('Helvetica', 'bold');
  doc.text('SÉANCES D\'APPEL AUDITÉES', 15 + cW * 0.5, 62, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.text(`${totalCalls} séances`, 15 + cW * 0.5, 70, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TAUX GLOBAL D\'ASSIDUITÉ', 15 + cW * 1.5, 62, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(globalAttendanceRate >= 85 ? 5 : 225, globalAttendanceRate >= 85 ? 150 : 29, globalAttendanceRate >= 85 ? 105 : 72);
  doc.text(`${globalAttendanceRate}%`, 15 + cW * 1.5, 70, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL ABSENCES NOTÉES', 15 + cW * 2.5, 62, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(225, 29, 72);
  doc.text(`${totalAbsences} créneaux`, 15 + cW * 2.5, 70, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL RETARDS ENREGISTRÉS', 15 + cW * 3.5, 62, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(217, 119, 6);
  doc.text(`${totalLates} retards`, 15 + cW * 3.5, 70, { align: 'center' });

  // Cumulative students table
  const studentRows = studentCumulativeStats.map((s, idx) => {
    let alertStatus = 'Assiduité Conforme';
    if (s.attendanceRate < 75) alertStatus = 'Alerte Décrochage';
    else if (s.attendanceRate < 88) alertStatus = 'Assiduité Irrégulière';
    return [
      (idx + 1).toString(),
      s.student.matricule || s.student.id.slice(-6).toUpperCase(),
      `${s.student.lastName.toUpperCase()} ${s.student.firstName}`,
      s.student.gender === 'F' ? 'F' : 'M',
      s.presentCount.toString(),
      s.lateCount.toString(),
      s.justifiedAbsences.toString(),
      s.unjustifiedAbsences.toString(),
      `${s.attendanceRate}%`,
      alertStatus
    ];
  });

  (doc as any).autoTable({
    startY: 81,
    margin: { left: 15, right: 15 },
    head: [['N°', 'Matricule', 'Nom & Prénom Élève', 'Sexe', 'Prés.', 'Ret.', 'Abs. Just.', 'Abs. Non Just.', 'Taux Assid.', 'Statut / Diagnostic']],
    body: studentRows,
    theme: 'striped',
    headStyles: {
      fillColor: [rgbPrimary.r, rgbPrimary.g, rgbPrimary.b],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 48, fontStyle: 'bold' },
      3: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 18, halign: 'center' },
      8: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 22 }
    },
    didParseCell: (data: any) => {
      if (data.section === 'body') {
        if (data.column.index === 7 && parseInt(data.cell.text[0]) > 0) {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.column.index === 8) {
          const val = parseFloat(data.cell.text[0]);
          if (val < 80) data.cell.styles.textColor = [225, 29, 72];
          else data.cell.styles.textColor = [5, 150, 105];
        }
      }
    },
    styles: {
      font: 'Helvetica',
      cellPadding: 1.8
    }
  });

  // ===============================================================
  // PAGE 2+: JOURNAL CHRONOLOGIQUE DES SÉANCES D'APPEL
  // ===============================================================
  doc.addPage();
  doc.setFillColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.rect(0, 0, 210, 4, 'F');

  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('JOURNAL CHRONOLOGIQUE DES SÉANCES D\'APPEL & JUSTIFICATIFS', 15, 15);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Classe de ${className}  •  Historique des contrôles d'assiduité`, 15, 20);

  const sheetsLogRows = sortedSheets.map((sh, idx) => {
    const subj = SUBJECTS.find(s => s.id === sh.subjectId)?.name || 'Matière';
    const shRecs = records.filter(r => r.sheetId === sh.id);
    const pres = shRecs.filter(r => r.status === 'PRESENT').length;
    const lates = shRecs.filter(r => r.status === 'LATE');
    const abs = shRecs.filter(r => r.status === 'ABSENT');
    const total = shRecs.length || classStudents.length;
    const rate = total > 0 ? ((pres + lates.length) / total * 100).toFixed(0) : '100';

    let absentDetails = 'Aucun absent';
    if (abs.length > 0 || lates.length > 0) {
      const parts: string[] = [];
      abs.forEach(a => {
        const st = classStudents.find(s => s.id === a.studentId);
        const reasonStr = a.reason ? ` (${a.reason})` : '';
        parts.push(`Abs: ${st?.lastName || 'Élève'}${reasonStr}`);
      });
      lates.forEach(l => {
        const st = classStudents.find(s => s.id === l.studentId);
        parts.push(`Ret: ${st?.lastName || 'Élève'}`);
      });
      absentDetails = parts.join('; ');
    }

    return [
      (idx + 1).toString(),
      sh.date,
      sh.timeSlot,
      subj,
      `${pres} / ${total}`,
      abs.length.toString(),
      lates.length.toString(),
      `${rate}%`,
      absentDetails
    ];
  });

  (doc as any).autoTable({
    startY: 25,
    margin: { left: 15, right: 15 },
    head: [['N°', 'Date', 'Créneau', 'Matière', 'Présents', 'Abs.', 'Ret.', 'Taux', 'Incidents & Absences Notées']],
    body: sheetsLogRows,
    theme: 'striped',
    headStyles: {
      fillColor: [rgbSecondary.r, rgbSecondary.g, rgbSecondary.b],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 6.8,
      textColor: [40, 50, 60]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, fontStyle: 'bold' },
      2: { cellWidth: 22 },
      3: { cellWidth: 28, fontStyle: 'bold' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 10, halign: 'center' },
      6: { cellWidth: 10, halign: 'center' },
      7: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 52 }
    },
    styles: {
      font: 'Helvetica',
      cellPadding: 1.8
    }
  });

  // Closing & Archive Seals
  let endY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : 220;
  if (endY > 250) {
    doc.addPage();
    endY = 25;
  }

  doc.setDrawColor(200, 205, 215);
  doc.line(15, endY, 195, endY);

  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.text('Le Responsable de la Vie Scolaire (CPE)', 20, endY + 6);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Certifié conforme le ${new Date().toLocaleDateString('fr-FR')}`, 20, endY + 11);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.text('Le Surveillant Général', 105, endY + 6, { align: 'center' });
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Visa de vérification des motifs d\'absence', 105, endY + 11, { align: 'center' });

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(rgbSecondary.r, rgbSecondary.g, rgbSecondary.b);
  doc.text('Le Chef d\'Établissement (Direction)', 190, endY + 6, { align: 'right' });
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Pour valoir et servir de registre d\'archives officiel', 190, endY + 11, { align: 'right' });

  const cleanFile = `ARCHIVE_ADMINISTRATIVE_FICHES_APPEL_${className.replace(/\s+/g, '_')}_${schoolYear}.pdf`;
  doc.save(cleanFile);
}

