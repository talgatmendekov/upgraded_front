// src/components/FeedbackButton.js
import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './FeedbackButton.css';

const FeedbackButton = () => {
  const { t } = useLanguage();

  const handleClick = () => {
    window.open('https://forms.gle/jcaH7P3cF5QZeuCfA', '_blank');
  };

  return (
    <button 
      className="feedback-button" 
      onClick={handleClick}
      title={t('feedbackTitle')}
    >
      💡 {t('feedback')}
    </button>
  );
};

export default FeedbackButton;
