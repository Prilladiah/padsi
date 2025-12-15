'use client';

import React, { useCallback, useState } from 'react';

interface CSVUploaderProps {
  onFileProcessed: (data: any[], fileType: 'stok' | 'laporan' | 'offline') => void;
  fileType: 'stok' | 'laporan' | 'offline';
  acceptedFormats?: string;
  onClose?: () => void;
}

interface UploadResult {
  success: boolean;
  message: string;
  data?: any[];
  errors?: Array<{
    lineNumber: number;
    recordId?: string;
    field: string;
    value: string;
    reason: string;
  }>;
  totalRecords?: number;
  successfulRecords?: number;
  failedRecords?: number;
}

export default function CSVUploader({ 
  onFileProcessed, 
  fileType, 
  acceptedFormats = ".csv,.json",
  onClose 
}: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  // Validasi nama file
  const validateFileName = (fileName: string): boolean => {
    console.log('🔍 Validating filename:', fileName);
    const isValidExtension = /\.(csv|json)$/i.test(fileName);
    
    if (!isValidExtension) {
      console.warn('❌ Invalid file extension');
      return false;
    }
    
    console.log('✅ File extension valid');
    return true;
  };

  // Validasi data stok
  const validateStokData = (data: any[]): UploadResult => {
    const errors: any[] = [];
    const validData: any[] = [];
    
    console.log('🔍 Validating stok data, rows:', data.length);
    
    if (data.length === 0) {
      return {
        success: false,
        message: 'Tidak ada data yang dapat divalidasi',
        totalRecords: 0,
        successfulRecords: 0,
        failedRecords: 0
      };
    }
    
    data.forEach((row, index) => {
      const lineNumber = index + 2;
      const rowErrors: string[] = [];

      console.log(`📊 Validating row ${index}:`, row);

      // Field mapping yang fleksibel
      const nama_stok = row.nama_stok || row.nama || row.item || row.product || 
                        row.namastok || row.namaStok || row.nama_barang || '';
      
      const unit_bisnis = row.unit_bisnis || row.unit || row.satuan || row.bisnis || 
                          row.unitbisnis || row.unitBisnis || row.satuan_stok || 'pcs';
      
      const supplier_stok = row.supplier_stok || row.supplier || row.vendor || 
                            row.supplierstok || row.supplierStok || 'Unknown';
      
      const tanggal_stok = row.tanggal_stok || row.tanggal || row.date || 
                           new Date().toISOString().split('T')[0];
      
      const jumlah_stok = parseFloat(row.jumlah_stok || row.jumlah || row.qty || 
                                     row.quantity || row.jumlahstok || row.jumlahStok || '0');
      
      const harga_stok = parseFloat(row.harga_stok || row.harga || row.price || 
                                    row.hargastok || row.hargaStok || row.Harga_stok || '0');

      // Validasi field wajib
      if (!nama_stok || String(nama_stok).trim() === '') {
        rowErrors.push('Nama Stok wajib diisi');
      }

      // Validasi numerik
      if (isNaN(jumlah_stok) || jumlah_stok < 0) {
        rowErrors.push('Jumlah stok harus angka dan tidak boleh negatif');
      }

      if (isNaN(harga_stok) || harga_stok < 0) {
        rowErrors.push('Harga stok harus angka dan tidak boleh negatif');
      }

      if (rowErrors.length === 0) {
        validData.push({
          id_stok: row.id_stok || `STK_${Date.now()}_${index}`,
          nama_stok: String(nama_stok).trim(),
          Harga_stok: harga_stok,
          jumlah_stok: jumlah_stok,
          unit_bisnis: String(unit_bisnis).trim(),
          supplier_stok: String(supplier_stok).trim(),
          tanggal_stok: tanggal_stok,
          created_at: row.created_at || new Date().toISOString()
        });
        console.log(`✅ Row ${index} valid`);
      } else {
        errors.push({
          lineNumber,
          recordId: row.id_stok || `ROW_${index}`,
          field: 'multiple',
          value: JSON.stringify(row),
          reason: rowErrors.join('; ')
        });
        console.log(`❌ Row ${index} invalid:`, rowErrors);
      }
    });

    const result = {
      success: errors.length === 0,
      message: errors.length === 0 
        ? `✅ Semua ${validData.length} record valid` 
        : `⚠️ ${validData.length} record berhasil, ${errors.length} record gagal`,
      data: validData,
      errors: errors.length > 0 ? errors : undefined,
      totalRecords: data.length,
      successfulRecords: validData.length,
      failedRecords: errors.length
    };

    console.log('📊 Validation result:', result);
    return result;
  };

  // Parsing CSV
  const parseCSV = (csvText: string): any[] => {
    console.log('📄 Starting CSV parse, text length:', csvText.length);
    
    const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedText.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '' && !line.startsWith('//') && !line.startsWith('#'));
    
    console.log('📝 Total lines after cleaning:', lines.length);
    
    if (lines.length === 0) {
      console.error('❌ No valid lines found');
      return [];
    }

    // Deteksi delimiter
    const firstLine = lines[0];
    console.log('🔍 First line:', firstLine);
    
    let delimiter = ',';
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const pipeCount = (firstLine.match(/\|/g) || []).length;
    
    console.log('🔍 Delimiter counts:', { semicolonCount, commaCount, tabCount, pipeCount });
    
    if (semicolonCount > commaCount && semicolonCount > tabCount && semicolonCount > pipeCount) {
      delimiter = ';';
    } else if (tabCount > commaCount && tabCount > semicolonCount && tabCount > pipeCount) {
      delimiter = '\t';
    } else if (pipeCount > commaCount && pipeCount > semicolonCount && pipeCount > tabCount) {
      delimiter = '|';
    }
    
    console.log('✅ Selected delimiter:', delimiter === '\t' ? 'TAB' : delimiter);

    // Parse headers
    const rawHeaders = firstLine.split(delimiter);
    const headers = rawHeaders.map(header => 
      header.trim()
        .replace(/^["']|["']$/g, '')
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
    );

    console.log('📋 Parsed headers:', headers);

    if (headers.length === 0 || headers.every(h => h === '')) {
      console.error('❌ No valid headers found');
      return [];
    }

    const result: any[] = [];
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) {
        console.log(`⏭️ Skipping empty line ${i}`);
        continue;
      }
      
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;
      let quoteChar = '';
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const nextChar = line[j + 1];
        
        if ((char === '"' || char === "'") && !inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar && inQuotes) {
          if (nextChar === quoteChar) {
            currentValue += char;
            j++;
          } else {
            inQuotes = false;
          }
        } else if (char === delimiter && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());
      
      console.log(`📖 Line ${i} values:`, values);
      
      const row: any = {};
      let hasData = false;
      
      headers.forEach((header, index) => {
        if (values[index] !== undefined) {
          let cleanValue = values[index]
            .replace(/^["'](.*)["']$/, '$1')
            .trim();
            
          if (cleanValue !== '') {
            row[header] = cleanValue;
            hasData = true;
          }
        }
      });

      if (hasData && Object.keys(row).length > 0) {
        console.log(`✅ Row ${i} parsed successfully`);
        result.push(row);
      } else {
        console.log(`⚠️ Row ${i} has no valid data, skipping`);
      }
    }
    
    console.log('🎉 CSV parsing complete. Total rows:', result.length);
    return result;
  };

  // Parse JSON
  const parseJSON = (jsonText: string): any[] => {
    console.log('📄 Starting JSON parse');
    
    try {
      const data = JSON.parse(jsonText);
      console.log('✅ JSON parsed successfully:', data);
      
      if (Array.isArray(data)) {
        return data;
      } else if (data.stok && Array.isArray(data.stok)) {
        return data.stok;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      } else if (data.items && Array.isArray(data.items)) {
        return data.items;
      } else {
        console.error('❌ JSON format not recognized');
        return [];
      }
    } catch (error: any) {
      console.error('❌ JSON parse error:', error.message);
      throw new Error(`Format JSON tidak valid: ${error.message}`);
    }
  };

  // Validasi data laporan
  const validateLaporanData = (data: any[]): UploadResult => {
    return {
      success: true,
      message: `${data.length} record laporan siap diimport`,
      data: data,
      totalRecords: data.length,
      successfulRecords: data.length,
      failedRecords: 0
    };
  };

  // Validasi data offline
  const validateOfflineData = (data: any[]): UploadResult => {
    return {
      success: true,
      message: `${data.length} record offline siap diimport`,
      data: data,
      totalRecords: data.length,
      successfulRecords: data.length,
      failedRecords: 0
    };
  };

  // Process file
  const processFile = async (file: File): Promise<UploadResult> => {
    try {
      console.log('🚀 Processing file:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Validasi ukuran file
      if (file.size > 50 * 1024 * 1024) {
        return {
          success: false,
          message: 'Ukuran file terlalu besar. Maksimal 50MB'
        };
      }

      if (!validateFileName(file.name)) {
        console.warn('⚠️ Filename validation failed, but continuing...');
      }

      const fileText = await file.text();
      console.log('📄 File content length:', fileText.length);

      let parsedData: any[] = [];

      // Parse berdasarkan ekstensi
      if (file.name.toLowerCase().endsWith('.csv')) {
        parsedData = parseCSV(fileText);
        console.log('📊 CSV parsed, rows:', parsedData.length);
      } else if (file.name.toLowerCase().endsWith('.json')) {
        try {
          parsedData = parseJSON(fileText);
          console.log('📊 JSON parsed, rows:', parsedData.length);
        } catch (error: any) {
          return {
            success: false,
            message: `Error parsing JSON: ${error.message}`
          };
        }
      } else {
        return {
          success: false,
          message: 'Format file tidak didukung. Gunakan CSV atau JSON'
        };
      }

      if (parsedData.length === 0) {
        return {
          success: false,
          message: 'Tidak ada data valid yang ditemukan dalam file. Pastikan file memiliki header dan data yang benar.'
        };
      }

      console.log('📊 Sample parsed data:', parsedData[0]);

      // Validasi data berdasarkan tipe
      let validationResult: UploadResult;
      switch (fileType) {
        case 'stok':
          validationResult = validateStokData(parsedData);
          break;
        case 'laporan':
          validationResult = validateLaporanData(parsedData);
          break;
        case 'offline':
          validationResult = validateOfflineData(parsedData);
          break;
        default:
          return {
            success: false,
            message: 'Tipe file tidak valid'
          };
      }

      return validationResult;

    } catch (error: any) {
      console.error('💥 Process file error:', error);
      return {
        success: false,
        message: `Error memproses file: ${error.message}`
      };
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setUploadResult(null);

    try {
      console.log('🎬 Starting file upload process...');
      const result = await processFile(file);
      console.log('📤 Upload result:', result);
      setUploadResult(result);

      if (result.success && result.data && result.data.length > 0) {
        onFileProcessed(result.data, fileType);
      }
    } catch (error: any) {
      console.error('💥 Upload error:', error);
      setUploadResult({
        success: false,
        message: `Terjadi kesalahan: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setUploadResult(null);
    document.getElementById(`csv-upload-${fileType}`)?.click();
  }, [fileType]);

  const getFileTypeLabel = () => {
    switch (fileType) {
      case 'stok': return 'Stok';
      case 'laporan': return 'Laporan';
      case 'offline': return 'Data Offline';
      default: return '';
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isProcessing && document.getElementById(`csv-upload-${fileType}`)?.click()}
      >
        <input
          type="file"
          accept={acceptedFormats}
          onChange={handleFileInput}
          disabled={isProcessing}
          className="hidden"
          id={`csv-upload-${fileType}`}
        />
        
        <div className="flex flex-col items-center justify-center gap-4">
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-700">Memproses file...</p>
                <p className="text-sm text-gray-500 mt-1">Harap tunggu sebentar</p>
              </div>
            </>
          ) : (
            <>
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-700">
                  Upload File {getFileTypeLabel()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Tarik file ke sini atau klik untuk memilih
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Format: CSV atau JSON
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  💡 Tips: File CSV harus memiliki header di baris pertama
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hasil Upload */}
      {uploadResult && (
        <div className={`mt-6 p-6 rounded-lg border-2 ${
          uploadResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              uploadResult.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {uploadResult.success ? '✓' : '✗'}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className={`text-lg font-semibold ${
                    uploadResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {uploadResult.success ? 'Upload Berhasil' : 'Upload Gagal'}
                  </p>
                  <p className={`mt-1 ${uploadResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {uploadResult.message}
                  </p>
                  
                  {/* Statistik */}
                  {uploadResult.totalRecords !== undefined && (
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div className="bg-white bg-opacity-50 rounded p-2">
                        <div className="font-semibold text-gray-600">Total</div>
                        <div className="text-xl font-bold">{uploadResult.totalRecords}</div>
                      </div>
                      <div className="bg-white bg-opacity-50 rounded p-2">
                        <div className="font-semibold text-green-600">Berhasil</div>
                        <div className="text-xl font-bold text-green-600">{uploadResult.successfulRecords}</div>
                      </div>
                      <div className="bg-white bg-opacity-50 rounded p-2">
                        <div className="font-semibold text-red-600">Gagal</div>
                        <div className="text-xl font-bold text-red-600">{uploadResult.failedRecords}</div>
                      </div>
                    </div>
                  )}

                  {/* Error details */}
                  {!uploadResult.success && uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="mt-4 p-3 bg-red-100 rounded max-h-40 overflow-y-auto">
                      <p className="font-semibold text-red-800 mb-2">Detail Error:</p>
                      <ul className="text-sm text-red-700 space-y-1">
                        {uploadResult.errors.slice(0, 5).map((error, idx) => (
                          <li key={idx}>
                            Baris {error.lineNumber}: {error.reason}
                          </li>
                        ))}
                        {uploadResult.errors.length > 5 && (
                          <li className="font-semibold">
                            ... dan {uploadResult.errors.length - 5} error lainnya
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Debug info untuk error */}
                  {!uploadResult.success && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm font-semibold text-yellow-800 mb-2">
                        💡 Tips Troubleshooting:
                      </p>
                      <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                        <li>Pastikan file CSV memiliki header di baris pertama</li>
                        <li>Gunakan delimiter koma (,) atau semicolon (;)</li>
                        <li>Pastikan tidak ada baris kosong di awal file</li>
                        <li>Cek field wajib: nama_stok, jumlah_stok, harga_stok</li>
                        <li>Buka console browser (F12) untuk detail error</li>
                      </ul>
                    </div>
                  )}

                  {/* Preview data berhasil */}
                  {uploadResult.success && uploadResult.data && uploadResult.data.length > 0 && (
                    <div className="mt-4">
                      <p className="font-semibold text-green-800 mb-2">Preview Data:</p>
                      <div className="bg-white rounded p-3 max-h-60 overflow-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="text-left p-2">Nama</th>
                              <th className="text-left p-2">Jumlah</th>
                              <th className="text-left p-2">Harga</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploadResult.data.slice(0, 5).map((item, idx) => (
                              <tr key={idx} className="border-b">
                                <td className="p-2">{item.nama_stok}</td>
                                <td className="p-2">{item.jumlah_stok} {item.unit_bisnis}</td>
                                <td className="p-2">Rp {item.Harga_stok?.toLocaleString('id-ID')}</td>
                              </tr>
                            ))}
                            {uploadResult.data.length > 5 && (
                              <tr>
                                <td colSpan={3} className="p-2 text-center text-gray-500">
                                  ... dan {uploadResult.data.length - 5} data lainnya
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  {!uploadResult.success && (
                    <button
                      onClick={handleRetry}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors whitespace-nowrap"
                    >
                      Coba Lagi
                    </button>
                  )}
                  {uploadResult.success && onClose && (
                    <button
                      onClick={onClose}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors whitespace-nowrap"
                    >
                      Tutup
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}