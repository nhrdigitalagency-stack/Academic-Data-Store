/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { SchoolClass, Student, Evaluation, Mark, Subject } from '../types';
import { CLASSES, SUBJECTS, SEQUENCES } from '../data/mockData';
import { TrendingUp, BarChart3, Users, Award, BookOpen, Layers, HelpCircle, CalendarDays, LineChart } from 'lucide-react';

interface ClassPerformanceTrendsProps {
  evaluations: Evaluation[];
  marks: Mark[];
  classes: SchoolClass[];
  students: Student[];
  activeSchoolId?: string;
}

export default function ClassPerformanceTrends({
  evaluations,
  marks,
  classes = CLASSES,
  students,
  activeSchoolId
}: ClassPerformanceTrendsProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(SUBJECTS[0]?.id || 'subj-math');
  const [selectedSequenceId, setSelectedSequenceId] = useState<number | 'all'>(5);
  const [hoveredBin, setHoveredBin] = useState<number | null>(null);
  const [hoveredTrendSeq, setHoveredTrendSeq] = useState<number | null>(null);

  // Filter subjects that are actually taught in the selected class
  // To keep it clean, we can just list all subjects or find those with evaluations
  const availableSubjects = useMemo(() => {
    return SUBJECTS;
  }, []);

  const classStudents = useMemo(() => {
    return students.filter(s => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Extract all marks for the selected class, subject and sequence
  const activeEvaluations = useMemo(() => {
    return evaluations.filter(e => 
      e.classId === selectedClassId && 
      e.subjectId === selectedSubjectId &&
      (selectedSequenceId === 'all' ? true : e.sequenceId === selectedSequenceId)
    );
  }, [evaluations, selectedClassId, selectedSubjectId, selectedSequenceId]);

  const activeMarks = useMemo(() => {
    const evalIds = new Set(activeEvaluations.map(e => e.id));
    return marks.filter(m => evalIds.has(m.evaluationId) && classStudents.some(s => s.id === m.studentId));
  }, [marks, activeEvaluations, classStudents]);

  // Performance calculations: mean, standard deviation, high, low, success rate
  const stats = useMemo(() => {
    const grades = activeMarks.map(m => m.value).filter(v => v !== undefined && !isNaN(v));
    const n = grades.length;
    if (n === 0) {
      return {
        mean: 0,
        stdDev: 0,
        highest: 0,
        lowest: 0,
        successRate: 0,
        totalGrades: 0,
        gradesList: []
      };
    }

    const sum = grades.reduce((acc, val) => acc + val, 0);
    const mean = Number((sum / n).toFixed(2));

    const variance = grades.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Number(Math.sqrt(variance).toFixed(2));

    const highest = Math.max(...grades);
    const lowest = Math.min(...grades);

    const passCount = grades.filter(g => g >= 10).length;
    const successRate = Number(((passCount / n) * 100).toFixed(0));

    // Sort student grades
    const gradesList = classStudents.map(s => {
      const studentMarks = activeMarks.filter(m => m.studentId === s.id);
      const avg = studentMarks.length > 0 
        ? Number((studentMarks.reduce((sum, m) => sum + m.value, 0) / studentMarks.length).toFixed(2))
        : null;
      return {
        student: s,
        grade: avg
      };
    }).filter(item => item.grade !== null)
      .sort((a, b) => (b.grade ?? 0) - (a.grade ?? 0));

    return {
      mean,
      stdDev,
      highest,
      lowest,
      successRate,
      totalGrades: n,
      gradesList
    };
  }, [activeMarks, classStudents]);

  // Bin grade data into 10 bins of size 2: [0-2], [2-4], [4-6], ..., [18-20]
  const bins = useMemo(() => {
    const b = Array(10).fill(0);
    const grades = activeMarks.map(m => m.value);
    
    grades.forEach(g => {
      if (g === 20) {
        b[9]++;
      } else {
        const binIndex = Math.floor(g / 2);
        if (binIndex >= 0 && binIndex < 10) {
          b[binIndex]++;
        }
      }
    });

    const maxCount = Math.max(...b, 1);
    
    return b.map((count, index) => ({
      range: `${index * 2}-${(index + 1) * 2}`,
      count,
      percentage: Number(((count / (grades.length || 1)) * 100).toFixed(1)),
      height: (count / maxCount) * 100 // Scale height for layout
    }));
  }, [activeMarks]);

  // Compute sequence course trends: Class average for selected class/subject across Sequence 1 to 6
  const trendsData = useMemo(() => {
    const result = [];
    
    for (let seqId = 1; seqId <= 6; seqId++) {
      const seqEvals = evaluations.filter(e => 
        e.classId === selectedClassId && 
        e.subjectId === selectedSubjectId && 
        e.sequenceId === seqId
      );
      
      const seqEvalIds = new Set(seqEvals.map(e => e.id));
      const seqMarks = marks.filter(m => seqEvalIds.has(m.evaluationId) && classStudents.some(s => s.id === m.studentId));
      
      let average = null;
      if (seqMarks.length > 0) {
        const sum = seqMarks.reduce((acc, m) => acc + m.value, 0);
        average = Number((sum / seqMarks.length).toFixed(2));
      }

      result.push({
        sequenceId: seqId,
        sequenceName: `S${seqId}`,
        average,
        studentCount: seqMarks.length
      });
    }

    return result;
  }, [evaluations, marks, selectedClassId, selectedSubjectId, classStudents]);

  // Generate the coordinates of the Bell Curve path (normal distribution curve overlay)
  // Formula: Gaussian normal distribution mapped to SVG coordinates (width 400, height 180)
  const bellCurvePath = useMemo(() => {
    const width = 400;
    const height = 180;
    const paddingX = 20;
    const paddingY = 20;
    const chartWidth = width - 2 * paddingX;
    const chartHeight = height - 2 * paddingY;

    const mean = stats.mean || 10;
    const stdDev = stats.stdDev || 3;
    
    // Create points from x = 0 to 20
    const points: string[] = [];
    
    for (let x = 0; x <= 100; x++) {
      const gradeVal = (x / 100) * 20; // mapping 0-100% to 0-20 grade
      
      // Calculate Gaussian probability density function (PDF)
      // pdf = (1 / (stdDev * sqrt(2pi))) * exp(-0.5 * ((x - mean)/stdDev)^2)
      const exponent = -0.5 * Math.pow((gradeVal - mean) / Math.max(stdDev, 0.5), 2);
      const pdf = (1 / (Math.max(stdDev, 0.5) * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
      
      // Map to SVG coordinate space
      const svgX = paddingX + (gradeVal / 20) * chartWidth;
      // Scale PDF to look gorgeous on our chart height (PDF max value is around 0.4 when stdDev is 1)
      const scaleFactor = chartHeight * 2.2 * Math.max(stdDev, 1.5);
      const svgY = height - paddingY - (pdf * scaleFactor);

      points.push(`${svgX.toFixed(1)},${Math.max(paddingY, Math.min(height - paddingY, svgY)).toFixed(1)}`);
    }

    return `M ${points.join(' L ')}`;
  }, [stats]);

  // SVG trend coordinates for the line chart (width 400, height 180)
  const trendLinePath = useMemo(() => {
    const width = 400;
    const height = 180;
    const paddingX = 30;
    const paddingY = 30;
    const chartWidth = width - 2 * paddingX;
    const chartHeight = height - 2 * paddingY;

    const points = trendsData.map((t, idx) => {
      const avg = t.average || 10;
      const x = paddingX + (idx / 5) * chartWidth; // 6 points (0 to 5)
      // Map grade 0-20 to height (0 is bottom, 20 is top)
      const y = height - paddingY - (avg / 20) * chartHeight;
      return { x, y, value: avg, seqId: t.sequenceId };
    });

    const pathD = points.length > 0 
      ? `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)} ` + points.slice(1).map(p => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
      : '';

    return { pathD, points };
  }, [trendsData]);

  const currentSubjectName = SUBJECTS.find(s => s.id === selectedSubjectId)?.name || '';
  const currentClassName = CLASSES.find(c => c.id === selectedClassId)?.name || '';

  return (
    <div className="space-y-6">
      {/* Intro Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-display font-bold text-slate-800 flex items-center space-x-2">
            <LineChart className="h-5 w-5 text-blue-500 shrink-0" />
            <span>Tendances des Performances Académiques & Courbe de Gauss</span>
          </h3>
          <p className="text-xs text-slate-400 max-w-2xl">
            Analysez la distribution des notes (courbe en cloche) pour vérifier le niveau de dispersion de la classe (loi normale) et observez la progression des moyennes de matières à travers les séquences de cours.
          </p>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-mono font-bold text-slate-400 mb-0.5">Classe</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-mono font-bold text-slate-400 mb-0.5">Matière</span>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {availableSubjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-mono font-bold text-slate-400 mb-0.5">Séquence (Distribution)</span>
            <select
              value={selectedSequenceId}
              onChange={(e) => setSelectedSequenceId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Toutes Séquences</option>
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>Séquence {num}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Performance Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Moyenne Générale</p>
            <p className="text-xl font-mono font-black text-slate-800">{stats.mean}/20</p>
            <p className="text-[9px] text-slate-400">Pour {stats.totalGrades} copies</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Écart-Type (Dispersion)</p>
            <p className="text-xl font-mono font-black text-slate-800">± {stats.stdDev}</p>
            <p className="text-[9px] text-slate-400">
              {stats.stdDev > 3 ? 'Classe hétérogène' : 'Classe homogène'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Taux de Réussite</p>
            <p className="text-xl font-mono font-black text-emerald-700">{stats.successRate}%</p>
            <p className="text-[9px] text-slate-400">Notes sup. à 10/20</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Extrêmes (Min / Max)</p>
            <p className="text-xl font-mono font-black text-slate-800">{stats.lowest} / {stats.highest}</p>
            <p className="text-[9px] text-slate-400">Écart de {Number((stats.highest - stats.lowest).toFixed(1))} pts</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Bell Curve Distribution */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h4 className="text-sm font-display font-bold text-slate-800 flex items-center space-x-2">
              <BarChart3 className="h-4.5 w-4.5 text-blue-500" />
              <span>Courbe de Gauss & Répartition (Histogramme)</span>
            </h4>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full uppercase font-mono">
              {selectedSequenceId === 'all' ? 'S1 à S6' : `Séquence ${selectedSequenceId}`}
            </span>
          </div>

          {stats.totalGrades === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
              <HelpCircle className="h-10 w-10 text-slate-300 mb-2 animate-bounce" />
              <p className="font-semibold">Aucun résultat enregistré</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">Il n'y a pas encore d'évaluations validées ou de notes saisies pour cette matière.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* SVG Bell Curve + Bars */}
              <div className="relative pt-4">
                <svg viewBox="0 0 400 180" className="w-full h-48 overflow-visible">
                  {/* Grid Lines */}
                  {[0, 1, 2, 3].map(i => {
                    const y = 20 + i * 46.6;
                    return (
                      <line
                        key={i}
                        x1="20"
                        y1={y}
                        x2="380"
                        y2={y}
                        stroke="#f1f5f9"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {/* Histogram Bars */}
                  {bins.map((bin, idx) => {
                    // Coordinates mapping: Width is 360px divided into 10 groups
                    const barWidth = 28;
                    const x = 20 + idx * 36;
                    const barHeight = (bin.count / Math.max(...bins.map(b => b.count), 1)) * 130;
                    const y = 160 - barHeight;

                    return (
                      <g key={idx} className="group/bar">
                        <rect
                          x={x + 4}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          fill={hoveredBin === idx ? '#3b82f6' : '#93c5fd'}
                          rx="3"
                          opacity={hoveredBin === null || hoveredBin === idx ? 0.8 : 0.4}
                          onMouseEnter={() => setHoveredBin(idx)}
                          onMouseLeave={() => setHoveredBin(null)}
                          className="transition-all duration-200 cursor-pointer"
                        />
                        {/* Text tooltip count over bar */}
                        {bin.count > 0 && (
                          <text
                            x={x + 18}
                            y={y - 6}
                            textAnchor="middle"
                            className="font-mono text-[9px] font-bold text-slate-500 fill-current opacity-0 group-hover/bar:opacity-100 transition-opacity"
                          >
                            {bin.count}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Gaussian Bell Curve Overlay Line */}
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    d={bellCurvePath}
                    fill="none"
                    stroke="#1d4ed8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="drop-shadow-[0_2px_4px_rgba(29,78,216,0.2)]"
                  />

                  {/* X Axis labels */}
                  {bins.map((bin, idx) => (
                    <text
                      key={idx}
                      x={20 + idx * 36 + 18}
                      y="174"
                      textAnchor="middle"
                      className="text-[8px] font-mono font-medium text-slate-400 fill-current"
                    >
                      {idx * 2}
                    </text>
                  ))}
                  <text x="390" y="174" textAnchor="end" className="text-[8px] font-mono font-bold text-slate-500 fill-current">20</text>
                  
                  {/* Mean Line indicator overlay */}
                  {stats.mean > 0 && (
                    <g>
                      <line
                        x1={20 + (stats.mean / 20) * 360}
                        y1="20"
                        x2={20 + (stats.mean / 20) * 360}
                        y2="160"
                        stroke="#ef4444"
                        strokeDasharray="3,3"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={20 + (stats.mean / 20) * 360}
                        cy="20"
                        r="3"
                        fill="#ef4444"
                      />
                    </g>
                  )}
                </svg>

                {/* Legend overlay overlay */}
                <div className="flex justify-center items-center space-x-6 text-[10px] mt-2 border-t border-slate-50 pt-3">
                  <div className="flex items-center space-x-1.5">
                    <span className="h-3 w-4 bg-blue-200 border border-blue-300 rounded"></span>
                    <span className="text-slate-500">Effectifs de notes (bannière)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="h-0.5 w-5 bg-blue-700 block rounded-full"></span>
                    <span className="text-slate-500">Courbe de Gauss théorique</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="h-0.5 w-4 border-t border-dashed border-red-500 block"></span>
                    <span className="text-slate-500 font-medium">Moyenne ({stats.mean})</span>
                  </div>
                </div>
              </div>

              {/* Dynamic explanations of the bell curve */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-1.5">
                <p className="font-semibold text-slate-800 flex items-center space-x-1">
                  <span className="text-blue-500">💡</span>
                  <span>Analyse statistique de la classe :</span>
                </p>
                <p>
                  Avec une moyenne de <strong className="text-slate-800">{stats.mean}/20</strong> et un écart-type de <strong className="text-slate-800">±{stats.stdDev}</strong>, 
                  {stats.stdDev > 3 ? (
                    <span> la distribution indique un niveau <strong>hétérogène</strong>. Les notes sont très étalées, suggérant de grands écarts d'assimilation des cours entre élèves. Un soutien ciblé pour les élèves du bas de la courbe est vivement recommandé.</span>
                  ) : (
                    <span> la distribution est <strong>homogène</strong> et resserrée autour de la moyenne. La majorité des élèves progresse à un rythme similaire, ce qui valide l'efficacité globale de la pédagogie dispensée.</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Sequence-by-Sequence Line Chart */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h4 className="text-sm font-display font-bold text-slate-800 flex items-center space-x-2">
              <TrendingUp className="h-4.5 w-4.5 text-blue-500" />
              <span>Évolution des Moyennes de Séquences (Trends)</span>
            </h4>
            <span className="text-xs text-slate-400 font-sans font-medium">Séquence 1 à 6</span>
          </div>

          <div className="space-y-6">
            {/* SVG Line Graph */}
            <div className="relative pt-4">
              <svg viewBox="0 0 400 180" className="w-full h-48 overflow-visible">
                {/* Horizontal reference lines for grade benchmarks: 10, 15, 20 */}
                {[0, 5, 10, 15, 20].map((val) => {
                  const y = 150 - (val / 20) * 120;
                  return (
                    <g key={val}>
                      <line
                        x1="30"
                        y1={y}
                        x2="370"
                        y2={y}
                        stroke={val === 10 ? '#fed7aa' : '#f1f5f9'}
                        strokeWidth={val === 10 ? '1.5' : '1'}
                        strokeDasharray={val === 10 ? '3,3' : 'none'}
                      />
                      <text
                        x="24"
                        y={y + 3}
                        textAnchor="end"
                        className="text-[8px] font-mono font-bold text-slate-400 fill-current"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Connected Line Path */}
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  d={trendLinePath.pathD}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Glowing area under the line */}
                {trendLinePath.points.length > 0 && (
                  <path
                    d={`${trendLinePath.pathD} L ${trendLinePath.points[trendLinePath.points.length - 1].x},150 L ${trendLinePath.points[0].x},150 Z`}
                    fill="url(#grad-blue)"
                    opacity="0.08"
                  />
                )}

                {/* SVG Gradient declaration */}
                <defs>
                  <linearGradient id="grad-blue" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Point circles over coordinates */}
                {trendLinePath.points.map((pt, idx) => (
                  <g key={idx} className="group/pt">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredTrendSeq === pt.seqId ? '6' : '4'}
                      fill={hoveredTrendSeq === pt.seqId ? '#1d4ed8' : '#3b82f6'}
                      stroke="white"
                      strokeWidth="2"
                      className="transition-all cursor-pointer"
                      onMouseEnter={() => setHoveredTrendSeq(pt.seqId)}
                      onMouseLeave={() => setHoveredTrendSeq(null)}
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 10}
                      textAnchor="middle"
                      className={`font-mono text-[9px] font-bold text-blue-700 fill-current transition-opacity ${hoveredTrendSeq === pt.seqId ? 'opacity-100' : 'opacity-0 sm:group-hover/pt:opacity-100'}`}
                    >
                      {pt.value}/20
                    </text>
                  </g>
                ))}

                {/* Sequence labels X Axis */}
                {trendsData.map((t, idx) => {
                  const x = 30 + (idx / 5) * 340;
                  return (
                    <text
                      key={idx}
                      x={x}
                      y="166"
                      textAnchor="middle"
                      className="text-[9px] font-display font-semibold text-slate-500 fill-current"
                    >
                      S{t.sequenceId}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Performance Ranking Table */}
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Classement d'Excellence : {currentSubjectName} ({currentClassName})
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[140px] overflow-y-auto custom-scrollbar">
                {stats.gradesList.slice(0, 6).map((item, idx) => {
                  const isPass = (item.grade ?? 0) >= 10;
                  return (
                    <div key={item.student.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <span className="font-mono font-bold text-slate-400">#{idx + 1}</span>
                        <p className="font-bold text-slate-700 truncate">{item.student.lastName} {item.student.firstName}</p>
                      </div>
                      <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${isPass ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                        {item.grade}/20
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
