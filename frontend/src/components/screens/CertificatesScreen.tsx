import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { certificatesApi, eventsApi } from '../../services/api';
import { CertificateItem, EventItem } from '../../types';
import {
  Award,
  Download,
  Calendar,
  Clock,
  Building,
  CheckCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

export const CertificatesScreen: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewCert, setPreviewCert] = useState<CertificateItem | null>(null);
  const [batchEventId, setBatchEventId] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const [certsRes, eventsRes] = await Promise.all([
        certificatesApi.getAll(),
        eventsApi.getAll({ status: 'completed' })
      ]);

      if (certsRes.success) setCertificates(certsRes.data);
      if (eventsRes.success) setEvents(eventsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [user]);

  const handleBatchGenerate = async () => {
    if (!batchEventId) return;
    try {
      const res = await certificatesApi.batchGenerate(parseInt(batchEventId, 10));
      setFeedback(res.message);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setTimeout(() => setFeedback(null), 4000);
      fetchCertificates();
    } catch (err: any) {
      alert(`Batch generation error: ${err.message}`);
    }
  };

  // High-Resolution PDF Download using jsPDF
  const downloadPDF = (cert: CertificateItem) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // Border Frame
    doc.setDrawColor(79, 70, 229); // indigo
    doc.setLineWidth(3);
    doc.rect(8, 8, width - 16, height - 16);

    doc.setDrawColor(20, 184, 166); // teal inner border
    doc.setLineWidth(0.8);
    doc.rect(12, 12, width - 24, height - 24);

    // Header Branding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text('SR UNIVERSITY', width / 2, 30, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('DEPT. OF STUDENT WELFARE & COMMUNITY AFFAIRS', width / 2, 38, { align: 'center' });
    doc.text('Warangal, Telangana – Academic Year 2026–2027', width / 2, 44, { align: 'center' });

    // Certificate Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(79, 70, 229);
    doc.text('CERTIFICATE OF COMMENDATION', width / 2, 60, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(71, 85, 105);
    doc.text('This is proudly presented to certify that', width / 2, 72, { align: 'center' });

    // Volunteer Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42);
    doc.text(cert.volunteer_name || 'Sneha Patel', width / 2, 86, { align: 'center' });

    // Body description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85);
    const bodyText = `has actively and satisfactorily completed ${cert.hours_credited} hours of verified community volunteer service for the initiative "${cert.event_title}", demonstrating exemplary leadership, civic responsibility, and dedication to social welfare.`;
    const splitBody = doc.splitTextToSize(bodyText, width - 60);
    doc.text(splitBody, width / 2, 100, { align: 'center' });

    // Details Grid
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text(`Certificate No: ${cert.certificate_number}`, 25, 140);
    doc.text(`Issue Date: ${cert.issue_date}`, 25, 147);
    doc.text(`Credit: ${cert.hours_credited} Service Hours`, 25, 154);

    // Signatures
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.5);
    doc.line(width - 95, 150, width - 25, 150);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Dr. Rajesh Sharma', width - 60, 156, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(cert.signature_title || 'Dean of Student Affairs, SR University', width - 60, 161, { align: 'center' });

    // Authenticity badge bottom
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Digital Verifiability Hash: Verified via CommunityConnect Node • SR University CSE DevOps Capstone 2026', width / 2, 185, { align: 'center' });

    // Trigger Download
    doc.save(`${cert.certificate_number}.pdf`);
  };

  const canBatchGenerate = ['admin', 'organizer', 'coordinator'].includes(user?.role || '');

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Participation & Merit Certificates
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official SR University community service certificates with digital verification IDs and PDF export.
          </p>
        </div>

        {canBatchGenerate && events.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={batchEventId}
              onChange={e => setBatchEventId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            >
              <option value="">Select Completed Event...</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
            <button
              onClick={handleBatchGenerate}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-all shrink-0"
            >
              Batch Issue Certificates
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Grid of Certificates */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Loading certificate registry...</p>
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No certificates issued yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Certificates are automatically generated when events finish and volunteer attendance is verified.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map(cert => (
            <div
              key={cert.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-teal-500/10 rounded-bl-full pointer-events-none"></div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 tracking-wider">
                        Official Credential
                      </span>
                      <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        {cert.certificate_number}
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {cert.volunteer_name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {cert.volunteer_email}
                </p>

                <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/60 text-xs space-y-1.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {cert.event_title}
                  </p>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Issued: {cert.issue_date}</span>
                    <span className="font-bold text-indigo-600">{cert.hours_credited} Service Hrs</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => setPreviewCert(cert)}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  Preview
                </button>
                <button
                  onClick={() => downloadPDF(cert)}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificate Modal Preview */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setPreviewCert(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              ✕
            </button>

            {/* Simulated Certificate Canvas */}
            <div className="p-8 border-4 border-indigo-600/60 rounded-2xl bg-gradient-to-b from-indigo-50/20 via-white to-teal-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 text-center relative">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-teal-400 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-wider uppercase">
                SR University
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Student Welfare & Community Outreach
              </p>

              <h3 className="text-2xl font-serif font-bold text-indigo-700 dark:text-indigo-400 mt-4">
                Certificate of Commendation
              </h3>

              <p className="text-xs text-slate-500 italic mt-3">This is awarded to</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 underline decoration-teal-400 underline-offset-8">
                {previewCert.volunteer_name}
              </h4>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-5 leading-relaxed max-w-lg mx-auto">
                for invaluable volunteer service and completion of <strong>{previewCert.hours_credited} hours</strong> during the <strong>{previewCert.event_title}</strong>.
              </p>

              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <div className="text-left font-mono text-[10px]">
                  <p>CERT: {previewCert.certificate_number}</p>
                  <p>DATE: {previewCert.issue_date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Dr. Rajesh Sharma</p>
                  <p className="text-[10px] text-slate-400">{previewCert.signature_title}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setPreviewCert(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                Close Preview
              </button>
              <button
                onClick={() => downloadPDF(previewCert)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download Verified PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
