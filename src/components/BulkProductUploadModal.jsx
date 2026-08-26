"use client";

import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  Trash2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { parseCsvProducts, downloadSampleTemplate } from '../utils/excelParser';

export default function BulkProductUploadModal({ isOpen, onClose, onImportSuccess, userToken, shopName }) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileProcess = (selectedFile) => {
    if (!selectedFile) return;
    setFileName(selectedFile.name);
    setFile(selectedFile);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const result = parseCsvProducts(text);
      setParsedData(result);
    };
    reader.readAsText(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setFile(null);
    setFileName('');
    setParsedData(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExecuteImport = async () => {
    if (!parsedData || !parsedData.validProducts || parsedData.validProducts.length === 0) return;
    setIsImporting(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }

      const res = await fetch('/api/products/bulk-upload', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          products: parsedData.validProducts.map(p => ({
            ...p,
            sellerShopName: shopName || p.sellerShopName
          }))
        })
      });

      const data = await res.json();
      if (res.ok) {
        setImportResult({ success: true, count: data.count || parsedData.validProducts.length });
        if (onImportSuccess) {
          onImportSuccess(data.products || parsedData.validProducts);
        }
      } else {
        setImportResult({ success: false, error: data.error || 'Failed to import products' });
      }
    } catch {
      setImportResult({ success: false, error: 'Network error during bulk import' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
              <FileSpreadsheet size={24} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                Excel / CSV Bulk Product Listing
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                Upload dozens of products instantly with automated validation & instant publishing
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Step 1: Download Template Helper Banner */}
        <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '14px 18px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
              1. Need a template to start?
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
              Download our pre-formatted spreadsheet with sample products & instructions.
            </div>
          </div>

          <button 
            onClick={downloadSampleTemplate}
            style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#059669', padding: '8px 14px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
          >
            <Download size={14} /> Download Sample Template (.csv)
          </button>
        </div>

        {/* Success Screen after Import */}
        {importResult?.success ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', background: '#ecfdf5', borderRadius: '18px', border: '1px solid #a7f3d0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)' }}>
              <CheckCircle2 size={32} color="#ffffff" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#065f46', margin: '0 0 8px 0' }}>
              🎉 Bulk Listing Successful!
            </h3>
            <p style={{ fontSize: '14px', color: '#047857', margin: '0 0 20px 0' }}>
              Successfully uploaded and published <strong>{importResult.count} products</strong> to the marketplace.
            </p>
            <button
              onClick={onClose}
              style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' }}
            >
              View Updated Catalog
            </button>
          </div>
        ) : (
          <>
            {/* Step 2: Upload Zone */}
            {!parsedData && (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragging ? '2px dashed #10b981' : '2px dashed #cbd5e1',
                  background: isDragging ? '#ecfdf5' : '#fafafa',
                  borderRadius: '18px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".csv,.txt,.xlsx" 
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files && handleFileProcess(e.target.files[0])}
                />
                
                <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                  <UploadCloud size={28} color="#2563eb" />
                </div>

                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                  Drag and drop your Excel / CSV file here
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  or <span style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: '700' }}>browse from your computer</span> (.csv, .xlsx)
                </div>
              </div>
            )}

            {/* Step 3: Live Preview Table */}
            {parsedData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Stats ribbon */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>File: {fileName}</span>
                    <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px' }}>
                      ✓ {parsedData.validProducts.length} Valid Products Ready
                    </span>
                    {parsedData.errors.length > 0 && (
                      <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px' }}>
                        ⚠️ {parsedData.errors.length} Issues Found
                      </span>
                    )}
                  </div>

                  <button 
                    onClick={handleReset}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={13} /> Choose Another File
                  </button>
                </div>

                {/* Preview Table */}
                <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 }}>
                        <th style={{ padding: '10px 14px', fontWeight: '800' }}>#</th>
                        <th style={{ padding: '10px 14px', fontWeight: '800' }}>Product Title</th>
                        <th style={{ padding: '10px 14px', fontWeight: '800' }}>Category</th>
                        <th style={{ padding: '10px 14px', fontWeight: '800' }}>Selling Price</th>
                        <th style={{ padding: '10px 14px', fontWeight: '800' }}>MRP</th>
                        <th style={{ padding: '10px 14px', fontWeight: '800' }}>Stock</th>
                        <th style={{ padding: '10px 14px', fontWeight: '800', textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.validProducts.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 14px', fontWeight: '700', color: '#0f172a', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#64748b', textTransform: 'capitalize' }}>{p.category}</td>
                          <td style={{ padding: '10px 14px', fontWeight: '800', color: '#059669' }}>₹{(p.price || 0).toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 14px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{(p.originalPrice || 0).toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 14px', color: '#334155' }}>{p.countInStock} units</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                            <span style={{ color: '#059669', fontWeight: '800', fontSize: '11px' }}>✓ Ready</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {importResult?.error && (
                  <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', border: '1px solid #fecaca' }}>
                    ❌ {importResult.error}
                  </div>
                )}

                {/* Final Import Button */}
                <button
                  onClick={handleExecuteImport}
                  disabled={isImporting || parsedData.validProducts.length === 0}
                  style={{
                    width: '100%',
                    height: '46px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '14px',
                    cursor: isImporting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                    marginTop: '4px'
                  }}
                >
                  {isImporting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Batch Importing {parsedData.validProducts.length} Products...
                    </>
                  ) : (
                    <>
                      ⚡ Import & Publish {parsedData.validProducts.length} Products to Store <ArrowRight size={16} />
                    </>
                  )}
                </button>

              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
