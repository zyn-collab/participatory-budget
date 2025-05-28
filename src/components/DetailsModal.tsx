'use client';

import { Programme } from '@/types/programme';
import { useEffect, useRef } from 'react';

interface DetailsModalProps {
  programme: Programme;
  onClose: () => void;
}

const formatCurrency = (value: number) => {
  return `MVR ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function DetailsModal({ programme, onClose }: DetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle escape key to close
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements?.[0];
    const lastElement = focusableElements && focusableElements.length > 0 ? focusableElements[focusableElements.length - 1] : undefined;

    function handleTab(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !firstElement || !lastElement) return;
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    document.addEventListener('keydown', handleTab);
    firstElement?.focus();
    return () => document.removeEventListener('keydown', handleTab);
  }, []);

  if (!programme) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div ref={modalRef} className="modal-content">
        <button onClick={onClose} className="modal-close-button" aria-label="Close modal">
          &times;
        </button>

        <h2 id="modal-title" className="modal-title">
          {programme.name}
        </h2>

        <div className="modal-section">
          <h3 className="modal-section-title">Cost</h3>
          <p className="modal-section-text" style={{ fontSize: '1.25rem', color: '#2b6cb0' }}>
            {formatCurrency(programme.cost_mvr)}
          </p>
        </div>

        <div className="modal-section">
          <h3 className="modal-section-title">Purpose</h3>
          <p className="modal-section-text">{programme.purpose}</p>
        </div>

        <div className="modal-section">
          <h3 className="modal-section-title">Current Status</h3>
          <p className="modal-section-text">{programme.status}</p>
        </div>

        <div className="modal-section">
          <h3 className="modal-section-title">Detailed Justification</h3>
          <p className="modal-section-text">{programme.justification}</p>
        </div>
      </div>
    </div>
  );
} 