// src/components/Login.js

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGE_OPTIONS } from '../data/i18n';
import './Login.css';

const Login = ({ onViewAsGuest }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { lang, changeLang, t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(username, password);
    if (!result.success) {
      setError(t('invalidCredentials'));
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Language selector on login page */}
        <div className="login-lang">
          {LANGUAGE_OPTIONS.map(opt => (
            <button
              key={opt.code}
              className={`lang-btn ${lang === opt.code ? 'active' : ''}`}
              onClick={() => changeLang(opt.code)}
            >
              {opt.flag} {opt.code.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="login-header">
          <h1>{t('loginTitle')}</h1>
          <p>{t('loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('username')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('username')}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('password')}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary login-submit">
            {t('loginBtn')}
          </button>
        </form>

        <div className="login-footer">
          <button onClick={onViewAsGuest} className="btn-link">
            {t('viewAsGuest')}
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default Login;
