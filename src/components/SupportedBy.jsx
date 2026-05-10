import React from 'react';
import './SupportedBy.css';
import { useAppContext } from '../context/AppContext';

const SupportedBy = () => {
  const { t } = useAppContext();
  return (
    <section className="supported-section">
      <div className="container">
        <h4 className="supported-title">{t.supported.title}</h4>
        
        <div className="supported-logos">
          
          {/* Logo 1: Lodehv */}
          <div className="supported-item">
            <div className="supported-img-box">
              <img 
                src="/lodehv.jpeg" 
                alt="Logo Lodehv" 
                className="supported-logo logo-round" 
              />
            </div>
            <span className="supported-label">Lodehv</span>
          </div>

          {/* Logo 2: Bithinks */}
          <div className="supported-item">
            <div className="supported-img-box">
              <img 
                src="/bithinks.jpeg" 
                alt="Logo Bithinks" 
                className="supported-logo logo-round" 
              />
            </div>
            <span className="supported-label">Bithinks</span>
          </div>

        </div>
      </div>
    </section>
  );
};

export default SupportedBy;
