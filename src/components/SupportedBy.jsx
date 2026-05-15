import React from 'react';
import './SupportedBy.css';

const SupportedBy = () => {
  return (
    <section className="supported-section">
      <div className="container">
        <h4 className="supported-title">Dilindungi Badan Hukum</h4>
        
        <div className="legal-protection">
          <p className="legal-text">Keputusan Menteri Hukum Republik Indonesia AHU-A084709.AH.01.30 Tahun 2026</p>
          <div className="legal-barcode-box">
            <img 
              src="/barcode-perizinan.png" 
              alt="Barcode Perizinan AHU" 
              className="legal-barcode" 
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SupportedBy;
